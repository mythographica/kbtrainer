// engine.ts — typed port of the era app/bin/app.js (stage 4.5).
//
// The typing pipeline, behavior-preserving: same lesson/book flow, same
// countdown boot, same backspace error-stack logic, same stats formulas,
// same string-eval surface (ev.t("app.counter()", 1000) etc. — window.app
// is published at the bottom).
//
// What changed vs era (and only this):
//  - keystroke counting lives in the domain chain now. The laGo block
//    constructs Session -> KeyStroke -> Correct|Mistake -> StatUpdate with
//    the era verdict; StatUpdate bumps session.stats.typed/errors and
//    profile.cntFull, which era reads as vars.cntSess/cntErr/user.cntFull
//    through the kbstore accessors. The engine stays the router — era
//    compare rules (rule chars, shiftControl) are its own; dispatchKey is
//    the future domain-driven path, not used here.
//  - session.expectedChar mirrors vars.next_char1 at chain time, so the
//    recorded keystrokes carry the real expectation.
//  - two era implicit globals (thereIsNoErrors, real_prepare's str) are
//    declared — the compiled output is strict mode, where assigning an
//    undeclared name throws.
//
// Stage 4.7 — the domain owns the cursor: every lesson/book start (and
// every repeat after the end of the text) builds Session.Run -> Lesson|
// Book -> Native|Paragraph (app.runStart), and vars.strArr.pos becomes a
// view onto run.pos. A correct key no longer moves the cursor here:
// StatUpdate picks the next letter (LetterPick|WordPick advance
// run.pos). The engine keeps its other cursor moves (backspace, the space
// and non-typable skips, end of text) — they write the same cell through
// the view. The lesson timer stays app.counter()'s: only the engine knows
// when typing is really going on (app.started).

/* eslint-disable @typescript-eslint/no-explicit-any */

namespace keng {

declare const vars: any;     // bin/kernel.js (stats adopted by kbstore)
declare const user: any;     // bin/user.js (adopted by kbstore)
declare const strings: any;  // locale/*/strings.js
declare const fns: any;      // bin/fns.js
declare const skins: any;    // bin/skins.js
declare const kb: any;       // bin/kb.js
declare const layouts: any;  // bin/layouts.js (typed port)
declare const lessons: any;  // bin/lessons.js
declare const objx: any;     // bin/objex.js
declare const ev: any;       // bin/ev.js
declare const mix: any;      // bin/mixer.js
declare const alf: any;      // bin/alf.js
// kbstore is typed globally — see kbstore.d.ts (window.kbstore, booted in preload)

const app: any = {
  // for controlling where is needed to use keyboard and where is not.
  keyboard_on	: false
	, blur_focus	: true  // for snk. pausing
	, stored_cs		: ""	// stored strings array for paragraph mode
	, stored_row	: 0 	// stored previous row for 2+ strings shift
	, prevKey		: ""	// previously typed key, if any was typed
	, keybViewStart	: true	// to show keyboard or not
	, _started		: false	// for snk.
	, started		: false // can we type or not. used for pausing. Was known as cntStarter
	, lastPos		: 0
	, timer			: false
	, speed			: 0
	, typed			: 0
	, strer			: 0
	, keybViewPerx	: 0

	, restart		: function(par?: any){
		app.started = false;
		app._started = false;
		app.keyboard_on = false;
		app.start.cl.cnt = 3;
		app.start.fn(true);
	}

	, start			: {
	  fn : function(par?: any){

			var start_tf = false;
			app._started = false;

			var str = strings.s8;
			vars.strArr = {};

			if(user.LessonsMode == "lesson"){
				document.title = "Lessons Mode";
				fns.lesson_load();
				var l = user.LessonNum;
				var lnm = ((kb.map[l[0]].language === undefined) ? l[0].toUpperCase() : kb.map[l[0]].language);
				document.title = lnm + " -- " + lessons.arr[l[0]][l[1]].name + " -- " + vars.strArr.name;
				start_tf = true;

			}else if(user.LessonsMode == "vocabulary"){
				document.title = "Vocabulary Mode";
				// the old pre-lib/books mode: a pasted textarea (Ctrl+3),
				// typed once. Memory only — never persisted to user.txt.
				// Newlines become the paragraph mark, like imported books.
				var vocText = String((window as any).__vocabText || "");
				if(vocText.length > 0){
					// copied text almost always ends (and often starts) with
					// newline runs — those would become a trailing/leading ¶,
					// and ¶ is TYPABLE (it is the Enter key in the maps), so a
					// trailing one would sit at the end untypable-by-instinct
					// and the run would never finish. They are copy artifacts,
					// not content: strip them before the ¶ conversion
					vocText = vocText.replace(/(\n\r|\r\n|\n|\r)+$/g, "").replace(/^(\n\r|\r\n|\n|\r)+/g, "");
				}
				if(vocText.length > 0){
					var vocData = vocText.replace(/\n\r|\r\n|\n|\r/g, "¶");
					vars.strArr = { size: vocData.length, data: vocData, name: "Vocabulary", autor: "", book: "Vocabulary", pos: 0, path: "", err: "" };
					start_tf = true;
				}else{
					start_tf = false;
					str = "Paste the text first (Ctrl+3)";
				}
			}else if(user.LessonsMode == "book"){
				document.title = "Books Mode";
				vars.bookWasRead = false;
				fns.book_load();
				if(vars.bookWasRead == true){	// go next step
					document.title = vars.strArr.autor + "  --  " + vars.strArr.book;
					start_tf = true;
				}else{					// can't go next step
					start_tf = false;
					str = vars.strArr.err;
				}
			}

			if(start_tf == true){
				app.prepare_strings();
				vars.pressed	= [];
				app.runStart();
				if((par === undefined)){
					vars.cntSess	= 0;
					vars.cntErr		= 0;
					vars.timerCnt	= 0;
				}
				objx.full.q.fadeIn(300, function(){
					objx.messager.q.fadeIn(700, function(){
						app.start.cl.fn();
					}); });
			}else{
				objx.full.q.fadeIn(300);
				app.pauser(500, str);
				app._started = true; // keyboard off, but snk. works
			}
		}

		, app_start		: function(){
			app.keyboard_start();
			app.blur_focus_reset();
			app._started = true;
		}
		, cl			: { // count loading
		  cnt	: 3
			, fn	: function(){
			// !!!  kbTrainer Starts Here
				if(app._started === false){
					if(app.start.cl.cnt < 0){
						objx.messager.In(strings.s6);
						app.start.app_start();
					}else{ // app.start.cl.cnt >= 0
						objx.messager.In(strings.s8 + "<br>" + strings.s2 + app.start.cl.cnt);
						app.start.cl.cnt--;
						ev.t("app.start.cl.fn()", 500);
					}
				}else{
					app.pauser(300);
					app.start.app_start();
				}
			}
		}
	}

	// Session.Run for the loaded lesson/book (traced), then vars.strArr.pos
	// becomes a view onto run.pos: one cursor, owned by the domain. A book
	// resumes at its bookmark (vars.strArr.pos as loaded); a repeat passes
	// 0. Returns false when the domain is unavailable — the era cursor stays
	// a plain field then and the engine moves it itself.
	, runStart		: function(startPos?: number){
		try{
			var sa = vars.strArr;
			var session = kbstore.session;
			var isBook = (user.LessonsMode == "book");
			var isVoc = (user.LessonsMode == "vocabulary");
			var title = isVoc ? "Vocabulary" : (isBook ? (sa.autor + " -- " + sa.book) : String(sa.name));
			var id = isVoc ? "vocabulary" : (isBook ? String(sa.path) : String(user.LessonNum.join("_")));
			var from = (startPos === undefined) ? Number(sa.pos) || 0 : startPos;
			var run = new session.Run(title, sa.data, from);
			var paragraph = (user.TypingMode == "paragraph");
			if(isBook){
				var book = new run.Book();
				if(paragraph){ new book.Paragraph(id); }else{ new book.Native(id); }
			}else if(isVoc){
				// Session.Run.Vocabulary (traced): the pasted-text run
				new run.Vocabulary(sa.data.length);
			}else{
				var lesson = new run.Lesson();
				if(paragraph){ new lesson.Paragraph(id); }else{ new lesson.Native(id); }
			}
			Object.defineProperty(sa, "pos", {
				get : function(){ return run.pos; },
				set : function(value: number){ run.pos = value; },
				enumerable : true,
				configurable : true
			});
			return true;
		}catch(e){ return false; }
	}
	// the end of the text: the pass that just ended is finished (if the last
	// key's LetterPick did not already finish it), the repeat is a new Run
	, runRepeat		: function(){
		try{
			var current = kbstore.session.run;
			if(current){ new current.Finish(); }
		}catch(e){}
		if(!app.runStart(0)){ vars.strArr.pos = 0; }
	}

	, p_go			: function(){ // reviewing current position for attributes
		app.get_strings();
		app.attr.set_at();
	}
	, prep_go			: function(){
		app.started = false;
		vars.pressed = [];
		app.p_go();
	}
	, mooving_keys		: function(keys: any){
		var z = keys.code;
		if((z == 10) || (z == 255) || ((z > 112) && (z < 123))){
		// nothing to do with it or:
		}else{
			var go_next = true;
			if(user.LessonsMode == "lesson"){ //if lessons mode
				if(keys.ctrl){
					if((z >= 37) && (z <= 40)){
						var klm = user.LessonNum[0];
						var klb = user.LessonNum[1];
						var kll = user.LessonNum[2];
						var LessLen = lessons.arr[klm][klb].les.length;
						// var BaseLen = lessons.arr[klm].length; // era: computed, unused

						if(z == 37){ // previously lesson, Ctrl + arrow_left
							if((kll - 1) >= 0){
								user.LessonNum[2]--;
							}
						}
						if(z == 38){ // previously base, Ctrl + arrow_top
							for(var i in lessons.arr[klm]){
								if(i == klb){ break; }
								user.LessonNum[1] = i;
							}
							user.LessonNum[2] = 0;
						}
						if(z == 39){ // next lesson, Ctrl + arrow_right
							if((kll + 1) < LessLen){
								user.LessonNum[2]++;
							}
						}
						if(z == 40){ // next base, Ctrl + arrow_bottom
							var needToDo = false;
							for(var i in lessons.arr[klm]){
								if(needToDo){
									user.LessonNum[1] = i;
									break;
								}
								if(i == klb){ needToDo = true; }
							}
							user.LessonNum[2] = 0;
						}

						// Session.RunControl -> LessonPrev|LessonNext|BaseNext
						// via the domain router (traced): navId is the era's
						// "map_base_lesson" id AFTER its LessonNum move; the
						// restart below starts the new Run
						try{
							kbstore.session.handler.dispatchKey(z, {ctrl: true}, user.LessonNum.join("_"));
						}catch(e){}

						go_next = false;
						app.restart(true);

					}
				}else{
					if((z == 36) || (z == 35)){
						if(z == 36){
							vars.strArr.pos = 0;
						}
						if(z == 35){
							vars.strArr.pos = vars.strArr.size - 10;
						}
						go_next = false;
						app.prep_go();
					}
				}
			}else if(user.LessonsMode == "book"){
				if((vars.bookWasRead) && (app.keyboard_on === true)){
					if((keys.ctrl == true) && (z !== undefined)){
						if((z >= 33) && (z <= 40)){
							if(z == 33){
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = (vars.strArr.pos - 1000);
							}
							if(z == 34){
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = (vars.strArr.pos + 1000);
							}

							if(z == 36){
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = 0;
							}
							if(z == 35){
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = (vars.strArr.size - 10);
							}

							// arrow keys
							if(z == 37){ // arrow_left
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = (vars.strArr.pos - 10);
							}
							if(z == 38){ // arrow_top
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = (vars.strArr.pos - 100);
							}
							if(z == 39){ // arrow_right
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = (vars.strArr.pos + 10);
							}
							if(z == 40){ // arrow_bottom
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = (vars.strArr.pos + 100);
							}
							// arrow keys

							vars.strArr.pos = (vars.strArr.pos < 0) ? 10 : vars.strArr.pos;
							vars.strArr.pos = (vars.strArr.pos >= vars.strArr.size) ? (vars.strArr.size - 10) : vars.strArr.pos;

							go_next = false;
							app.prep_go();

						}
						if(z == 76){ // Ctrl + L
							if((app.lastPos < vars.strArr.size) && (app.lastPos >= 0)){
								var pgo = app.lastPos;
								app.lastPos = vars.strArr.pos;
								vars.strArr.pos = pgo;

								go_next = false;
								app.prep_go();
							}
						}
					}else if((keys.ctrl == false) && (z !== undefined)){
						if((z == 37) || (z == 38)){
							vars.strArr.pos--;
							vars.strArr.pos = (vars.strArr.pos < 0) ? 0 : vars.strArr.pos;
							go_next = false;
							app.prep_go();
						}
						if((z == 39) || (z == 40)){
							vars.strArr.pos++;
							vars.strArr.pos = (vars.strArr.pos >= vars.strArr.size) ? (vars.strArr.size - 1) : vars.strArr.pos;
							go_next = false;
							app.prep_go();
						}
					}
				}
			}else if(user.LessonsMode == "vocabulary"){
				// no lesson navigation in vocabulary mode: falls through to
				// the generic typing path (go_next stays true)
			}else{
				// unreachable: LessonsMode is lesson | book | vocabulary
			}
			if(go_next === true){
				app.keydown(keys);
			}
		}
	}

	, keydown			: function(keys: any){
		var z = keys.code;
		if(vars.strArr.size > 0){
			if((z == 32) && (app.started == false)){
				app.attr.start(); // starting app and hiding messager + get_strings() is there
				app.attr.set_at();
				// Space starts the RunControl flow: run becomes active (this
				// branch is ALSO the pause-resume path — after pauser,
				// app.started is false again). Era-kept construction: the
				// router's Space branch is paused-only and would lose the
				// start/resume record here
				var runControl = new kbstore.session.RunControl();
				new runControl.Resume();
			}
			if(app.keyboard_on){
				if (z == 27){
					app.pauser(300);
					// Esc starts the RunControl flow: run goes paused — via
					// the domain router (session.run set, not paused yet)
					try{ kbstore.session.handler.dispatchKey(27); }catch(e){}
				}else if (z == 8){ // backspace
					try{
						var sp = vars.strArr.pos;
						var vp = vars.pressed;

						if (sp >= 0){
							if(vp.length > 0){
								if(user.errMode){
									if(vp[sp] !== undefined){ // error in current position
										if(vp[sp].length > 0){
											if(user.oneErrOnly){
												if(!user.ErrAlwaysCount){
													vars.cntErr = vars.cntErr - (vp[sp].length);
												}
												vp.pop();
											}else{
												vp[sp].pop();
												vars.cntErr--;
												if(vp[sp].length == 0) {
													vp.pop();
												}
											}
										}
									}else{
										if(vp[sp-1] !== undefined){
											if(vp[sp-1].length == 1){	// there was no error in previous position
												vars.strArr.pos--;		// or there was a lot of errors in ErrAlwaysCount
												vp.pop();				// but All of them are needs to count ^^^
											}else{
												if(user.oneErrOnly){
													if(!user.ErrAlwaysCount){
														vars.cntErr = vars.cntErr - (vp[sp-1].length - 1);
													}
													vars.strArr.pos--;
													vp.pop();
												}else{
													if(vp[sp-1].length > 0){
														var del_err = vp[sp-1][vp[sp-1].length - 1][1];
														vp[sp-1].pop();
														if(del_err){
															vars.strArr.pos--;
														}else{
															vars.cntErr--;
														}
													}
													if(vp[sp-1].length == 0){
														vp.pop();
														vars.strArr.pos--;
													}
												}
											}
										}else{
											vars.strArr.pos--;
										}
									}
								}else{
									vars.strArr.pos--;
								}
							}else{
								vars.strArr.pos--;
							}
							if(vars.strArr.pos < 0){ vars.strArr.pos = 0; }

							app.p_go();
						}
					}catch(e){}
				}else{
					// only ¶ marks remain = nothing left to type (trailing
					// paragraph marks are not content — without this they
					// sat untypable-by-instinct and the run never ended)
					if(vars.to_type.replace(/¶/g, "").length > 0){

						var mapK	= kb.map[user.currentMap].keys;
						var mapB	= kb.map[user.currentMap].back;
						var mapSB	= kb.map[user.currentMap].shback;

						var pressed = "";

						var CompareChar	= vars.to_type.substr(0, 1);

						if(keys.shift){
							if(mapSB[z]){
								pressed	= mapSB[z][5];
							}
						}else{
							if(mapB[z]){
								pressed	= mapB[z][5];
							}
						}

						objx.prev.In(app.attr.str_pr(pressed));

						var keyTyped = false; // laGo, carried past the block for the redraw below

						if(pressed != ""){

							var foundInMap	= false; // CompareChar
							var keyCompare = false;
							var shiftCompare = false;
							var laGo = false;

							if(mapK[CompareChar]){
								foundInMap = true;
								if(mapK[CompareChar][5] == pressed){
									if(mapK[CompareChar][6] == ""){
										keyCompare = true;
									}else{
									// wow ... next is really great  it's funtion call...
										keyCompare = kb.map[user.currentMap][mapK[CompareChar][6]](keys, CompareChar);
										if(keyCompare){ pressed = CompareChar; }
									}
								}

							}

							if(mapK[CompareChar][0] == ""){
								shiftCompare = true;
							}else{
								if(((!user.shiftControl) && (keys.shift))){ shiftCompare = true;	}
							}

							if(app.started == false){
								if(keyCompare && shiftCompare){
									if(CompareChar == " "){
										vars.strArr.pos++;
										app.prep_go();
									}else{
										app.started = true;
										if(vars.timerCnt>0){ vars.timerCnt--; }
										user.cntFull++;
										laGo = true;
									}
								}
							}else{
								laGo = true;
							}

							if(laGo){
								if(vars.pressed[vars.strArr.pos] == undefined){
									vars.pressed[vars.strArr.pos] = [];
								}

								// stage 4.5: the counting lives in the domain chain
								// now — KeyStroke -> Correct|Mistake -> StatUpdate
								// bumps session.stats (read here as vars.cntSess /
								// vars.cntErr / user.cntFull through the accessors)
								kbstore.session.expectedChar = vars.next_char1;
								var keystroke = new kbstore.session.KeyStroke(pressed);
								if(keyCompare && shiftCompare){
									vars.pressed[vars.strArr.pos][vars.pressed[vars.strArr.pos].length] = [pressed, true];
									// stage 4.7: the chain moves the cursor — StatUpdate
									// picks the next letter (LetterPick|WordPick advance
									// session.run.pos, which vars.strArr.pos reads);
									// without a run the engine moves it itself
									var runActive = !!kbstore.session.run;
									new keystroke.Correct();
									if(!runActive){ vars.strArr.pos++; }
								}else{
									vars.pressed[vars.strArr.pos][vars.pressed[vars.strArr.pos].length] = [pressed, false];
									new keystroke.Mistake();
								}
							} //if(laGo)
							keyTyped = laGo;
						} // if(pressed != "")

						// a typed key's redraw is the RESULT of its stat update:
						// StatUpdate runs as a microtask after Correct|Mistake,
						// and its postCreation hook redraws (see app.statUpdated)
						if(!keyTyped){ app.p_go(); }

					}else{ // if(vars.to_type.length > 0)

						// text is empty
						app.attr.end_of_text();

					} // if(vars.to_type.length == 0)
				}
			}
		}else{ // if(vars.strArr.size > 0)
			if(user.LessonsMode == "lesson"){
				app.pauser(300, strings.s7_1);
			}else if(user.LessonsMode == "book"){
				if(vars.strArr.err !== ""){
					app.pauser(300, vars.strArr.err);
				}else{
					app.pauser(300, strings.s7_2);
				}
			}else if(user.LessonsMode == "vocabulary"){
				app.pauser(300, strings.s7_3);
			}
		}
	}


	, attr			: { // attributes and visualisation
	  start		: function(){
			objx.messager.q.hide();
			// back to the skin's pause-box geometry
			objx.messager.obj.style.top = "";
			objx.messager.obj.style.height = "";
			objx.messager.obj.style.padding = "";
			objx.messager.obj.style.fontSize = "";
			app.get_strings();
			app.keyboard_on = true;
		}

		, str_pr	: function(str: string, par?: any, start?: any){ // strings prepare
			var re = / /g;
			var re1 = /\</g;
			var re2 = /\>/g;
			var re3 = /\//g; // era: prepared, unused
			var re4 = /\¶/g;
			var re5 = /-/g;

			var reEnter = skins.enlightEnter();

			var retr = function(stre: string){
				stre = stre.replace(re, "&nbsp;&nbsp;").replace(re1, "&lt;").replace(re2, "&gt;").replace(re4, reEnter).replace(re5, "&ndash;");
				return stre;
			};

			if(par === undefined){
				return retr(str);
			}else{ // encoding @already string with errors
				if(user.errMode){
					var va;
					if(user.TypingMode == "native"){
						va = vars.already;
					}else if(user.TypingMode == "paragraph"){ // this doesn't work with non current string
						if(start === undefined){
							return retr(str);
						}else{
							va = str;
						}
					}else{
						return retr(str);
					}
					var stri = "";
					var sp = vars.strArr.pos;
					var vp = vars.pressed;
					var vl = va.length;
					var diff = parseInt(sp) - parseInt(vl);
					for (var i = 0; i < vl; i++){
						var pos = i + diff;
						var sss = retr(va.substr(i, 1));
						if(vp[pos] !== undefined){
							if(vp[pos].length > 1){
								sss = skins.estErr(sss);
							}
						}
						stri += sss;
					}
					if(vp[sp] !== undefined){
						var sl = vp[sp][vp[sp].length - 1][0];
						stri += skins.estErr(retr(sl));
					}
					return stri;
				}else{
					return retr(str);
				}
			}
		}
		, ruenView	: function(){
			var v = "*";
			try{
				if((kb.map[user.currentMap] !== undefined) && (vars.next_char1 !== "")){
					var currMap = kb.map[user.currentMap];
					var nkey = currMap.keys[vars.next_char1];

					if(nkey !== undefined){
						v = nkey[3];
					}else{
						var letterfound = false;
						for(var i in user.maps){
							var map = user.maps[i];
							if(kb.map[map].keys[vars.next_char1]){
								v = skins.doRuEn(kb.map[map].keys[vars.next_char1][3]);
								letterfound = true;
								break;
							}
						}
						if(!letterfound){ //ver 1.18
							v = "-&gt;";
							if(((vars.strArr.pos + 1) <= vars.strArr.size) && user.skipNonTypedCharacters){ //ver 1.2
								vars.strArr.pos++;
								ev.t("app.p_go()", 200);
							}
						}
					}

				}
			}catch(e){}
			objx.map_name.In(v);
		}
		, next_key	: function(){
			try{
				var thereIsNoErrors = true; // era: implicit global (strict-mode fix)
				objx.next_key.In(vars.next_char1);
				if(vars.strArr.pos > 0){
					if(vars.pressed[vars.strArr.pos] !== undefined){
						thereIsNoErrors = false;
					}else{
						if(vars.pressed[vars.strArr.pos - 1] !== undefined){
							if(vars.pressed[vars.strArr.pos - 1].length > 1){
								thereIsNoErrors = false;
							}
						}
					}
				}else{
					if(vars.pressed[vars.strArr.pos] !== undefined){
						thereIsNoErrors = false;
					}
				}
				if((kb.map[user.currentMap] !== undefined) && (vars.next_char1 !== "")){
					if(layouts[user.layouts] && user.keybView && (app.keybViewStart)){
						var currMap = kb.map[user.currentMap];
						var nkey = currMap.keys[vars.next_char1];

						layouts.cleanerShort();
						if(app.prevKey != ""){
							layouts.makeKey(app.prevKey, false);
						}
						app.prevKey = "";

						if(nkey !== undefined){
							var shifterOb = nkey[0];
							if(shifterOb != ""){
								layouts.translator_shift = 1;
								layouts.translator();

								layouts.makeKey(nkey[4], true, vars.next_char1);
								layouts.makeShift(shifterOb);
							}else{
								layouts.translator_shift = 0;
								layouts.translator();

								if(vars.next_char1 !== " "){
									if(vars.next_char1 !== "¶"){
										layouts.makeKey(nkey[4], true, vars.next_char1);
									}else{
										layouts.makeEnter();
									}
								}else{
									var currForSpaceKey = "C";
									var currForSpaceKeyShift: any = 0;
									if(user.spaceIsShiftSensentive){
										var prevChar = " ";
										if(vars.strArr.pos > 0){
											prevChar = vars.already.substr((vars.already.length - 1), 1);
										}
										currForSpaceKey = currMap.keys[prevChar][1];
										currForSpaceKeyShift = ((currMap.keys[prevChar][0] == "R") || (currMap.keys[prevChar][0] == "L")) ? 1 : 0;
									}
									layouts.makeSpace(currForSpaceKey, currForSpaceKeyShift);

								}
							}
							if(!thereIsNoErrors && user.errMode){
								layouts.makeBackSpace();
							}
							app.prevKey = nkey[4];
							// turning attribute doesn't realy work in IE
							// so we force it making this;
							layouts.translator_shift = 0;
							layouts.translator();
						}
					}

				}
			}catch(e){}
		}
		, set_at	: function(){
			if(user.TypingMode == "native"){
				if((vars.already.length == 0) || (vars.pressed.length == 0)){ // press correct key message
					objx.already.In(strings.s4);
				}else{ // normal using
					objx.already.In(app.attr.str_pr(vars.already, true));
				}
				objx.to_type.In(app.attr.str_pr(vars.to_type));
			}else if(user.TypingMode == "paragraph"){
				if(vars.strArr.size >= vars.strArr.pos){

					var posarr = app.prepare_strings(true);

					var alr = "";
					var ttp = "";
					var count = 0;
					for(var i = (posarr[0] - 1); ((count < (1 + posarr[2])) && (i >= 0)); i--){
						alr = app.attr.str_pr(app.stored_cs[i][0]) + "<br>" + alr;
						count++;
					}
					var maxim = vars.num_of_rows - count;
					count = 1;

					for(var j = (posarr[0] + 1); ((j < app.stored_cs.length) && (count < maxim)); j++){
						if(app.stored_cs[j] !== undefined){
							ttp += app.attr.str_pr(app.stored_cs[j][0]) + "<br>";
						}else{
							break;
						}
						count++;
					}

					alr = alr + app.attr.str_pr(app.stored_cs[posarr[0]][0].substr(0, posarr[1]), true, app.stored_cs[posarr[0]][1]);
					var dttp = app.stored_cs[posarr[0]][0].substring(posarr[1]);
					var ttp1 = "";
					if(dttp.length > 1){
						ttp1 = app.attr.str_pr(dttp.substr(0, 1));
						ttp = app.attr.str_pr(dttp.substring(1)) + "<br>" + ttp;
					}else if(dttp.length == 1){
						ttp1 = app.attr.str_pr(dttp.substr(0, 1)) + "<br>";
					}else{
					}

					if(vars.strArr.size == vars.strArr.pos){
						app.attr.end_of_text();
					}else{
						var str = "<div id = \"cursorer\">" + ttp1 + "</div>";
						objx.paragrh.In("<span id = \"p_already\">" + alr + "</span>"  + str + ttp);
					}

				}
			}
			app.attr.ruenView();
			app.attr.next_key();
		}
		, end_of_text	: function(){
			try{
				if(user.LessonsMode == "book"){
					app.runRepeat(); // cursor back to 0 on a fresh Run
					app.prep_go();
					app.pauser(300, skins.doLether(strings.s7));
				}else if(user.LessonsMode == "lesson"){
					app.runRepeat();
					app.prep_go();
					app.pauser(300, skins.doLether(strings.s30));
				}else if(user.LessonsMode == "vocabulary"){
					// the era fossil left this empty: the run ended silently —
					// 100% typed, no "ended". Same shape as lesson/book; s7 is
					// the generic "Text Over! ... press bar to type it again"
					app.runRepeat();
					app.prep_go();
					app.pauser(300, skins.doLether(strings.s7));
				}
				if(layouts.cleaner !== undefined){ ev.t("layouts.cleaner()", 500); }
			}catch(e){}
		}
	}

	, get_strings	: function(){
		if(vars.strArr.size > 0){
			if(vars.strArr.pos <= vars.strArr.size){
				var diff, fr, to = 0;
				diff = vars.strArr.size - vars.strArr.pos;				// difference
				fr = vars.strArr.pos;									// from
				to = ( (diff) > vars.store_n ) ? vars.store_n : diff;	// to
				vars.to_type = vars.strArr.data.substr(fr, to);
				vars.next_char1 = vars.to_type.substr(0, 1);

				diff = vars.strArr.pos - vars.store_n;
				fr = ( diff > 0 ) ? diff : 0;
				to = vars.strArr.pos;
				vars.already = vars.strArr.data.substring(fr, to);
			}
		}

	}
	, prepare_strings : function(par?: any){
		var real_prepare = function(){
			app.stored_cs = [];
			var str = vars.strArr.data; // era: implicit global (strict-mode fix)
			var strs = str.split("¶");
			for(var i = 0; i < (strs.length - 1); i++){
				strs[i] += "¶";
			}
			var car = 0;
			var arr: any[] = [];
			arr[car] = "";
			for(var k in strs){
				var dstr = strs[k].split(" ");
				for(var i = 0; i < (dstr.length - 1); i++){
					dstr[i] += " ";
				}
				for(var j in dstr){
					if((arr[car] + dstr[j]).length > vars.store_s){
						car++;
						arr[car] = dstr[j];
					}else{
						arr[car] += dstr[j];
					}
				}
				car++;
				arr[car] = "";
			}

			if((arr[car].length == 0) || (arr[car] === " ")){
				arr.pop();
			}
			var counter = 0;
			for(var i = 0; i < arr.length; i++){
				arr[i] = [arr[i], counter, arr[i].length-1];
				counter = counter + arr[i][0].length;
			}

			app.stored_cs = arr;
		};
		var prepare_strings_pos = function(){
			var pos = vars.strArr.pos;
			var arr_pos = 0;
			var str_arr = 0;
			for(var i = 0; i < app.stored_cs.length; i++){
				if((str_arr + app.stored_cs[i][0].length) > pos){
					arr_pos = i;
					break;
				}else{
					str_arr = str_arr + app.stored_cs[i][0].length;
				}
			}
			var diff = pos - str_arr;
			var stored_row = 0;
			var diff_stored_row = 0;
			if(arr_pos > (vars.view_wh_pos + 1)){
				diff_stored_row = arr_pos - app.stored_row;
				if(diff_stored_row > vars.view_wh_pos){
					app.stored_row = arr_pos;
				}else{
					stored_row = diff_stored_row;
				}
			}else{
				app.stored_row = 1;
				stored_row = 2;
			}

			return [arr_pos, diff, stored_row];
		};
		if((par === undefined) || (par == false)){
			real_prepare();
		}else{
			return prepare_strings_pos();
		}
	}
	, counter			: function(){
		try{
		// typing speed — pure core: src/lib/stats.ts (vitest-covered)
			app.speed = (window as any).kblib.speed(vars.cntSess, vars.timerCnt);
			app.typed = fns.count_perc(vars.strArr.pos, vars.strArr.size);			// how many typed in percentage
			app.strer = fns.count_perc(vars.cntErr, vars.cntSess);					//errors percent
			if(objx.timer.hover == false){
				objx.timer.In(fns.time_HMS(vars.timerCnt).str + " :: " + vars.cntSess);
			}else{
				objx.timer.In("[ " + strings.n9 + fns.time_HMS(vars.timerCnt).stt + " :: " + strings.n3 + vars.cntSess + " ]");
			}
			if(objx.txt_perc.hover == false){
				objx.txt_perc.In("" + strings.n5[0] + app.typed);
			}else{
				objx.txt_perc.In("[ " + strings.n5[1] + app.typed + " % ]");
			}
			if(objx.err_perc.hover == false){
				objx.err_perc.In("" + strings.n2[0] + app.strer);
			}else{
				objx.err_perc.In("[ " + strings.n2[1] + app.strer + " % ]");
			}
			if(objx.speed.hover == false){
				objx.speed.In("" + strings.n1[0] + skins.doSpeed(app.speed) + strings.n1[1]);
			}else{
				objx.speed.In("[ " + strings.n1[2] + skins.doSpeed(app.speed) + " ]");
			}

			if(vars.cntSess > 0){
				if(app.started === true){
					vars.timerCnt++;
				}
				var shower = function(){
					if(app.keybViewPerx > 0){
						app.keybViewStart = true;
						app.keybViewPerx = 0;
						var sz = user.keybSize;
						objx.keyboard.m.setAttribute("kbs", sz);
						layouts.resizer(user.keybView);
						objx.keyboard.q.fadeTo(1500, 1);
					}
				};
				if(user.keybView){
					if(user.hider){
						if(app.speed > user.hiderInterval){
							app.keybViewPerx = app.keybViewPerx + 7;
							if(app.keybViewPerx > 100){
								app.keybViewPerx = 100;
								if((window as any).kbFit){ (window as any).kbFit.apply(); } // Electron: keyboard just fades, window stays
							}
							if(app.keybViewPerx < 0){ app.keybViewPerx = 0; }
							var perc = (100 - app.keybViewPerx)/100;
							objx.keyboard.q.fadeTo(300, perc);
						}else{ shower(); }
					}else{ shower(); }
				}else{ shower(); }
			}

		}catch(e){ document.title = "cnt: " + e; }
	}

	, blur_focus_reset	: function(){
		try{
			app.keyboard_on	= false;
			app.started 	= false;
			app.blur_focus = true;
			ev.WinEvent("onblur", "app.pauser");
			ev.WinEvent("onfocus", "app.focuser");
			// turning attribute doesn't realy work in IE
			// so we force it making this;
			layouts.translator_shift = 0;
			layouts.translator();
		}catch(e){
		}
	}
	, pauser		: function(par?: any, message?: any){
		app.keyboard_on = false;
		app.started 	= false;
		if(par		=== undefined){ par		= 0; }
		if(message	=== undefined){
			if(vars.strArr.err !== ""){
				message	= vars.strArr.err;
			}else{
				message	= strings.s6;
			}
		}
		objx.messager.q.html(message);
		if(!user.hideStatsOnPause){
		// keep the stats row visible: drop the pause box into the gap
		// under the stats and shrink it to fit, so it covers neither
		// the stats nor the keyboard (all measured live, per skin)
			try{
				var stBottom = 0;
				var stEls = [objx.timer, objx.txt_perc, objx.err_perc, objx.speed, objx.prev, objx.lang, objx.map_name, objx.next_key];
				for(var stI = 0; stI < stEls.length; stI++){
					stBottom = Math.max(stBottom, stEls[stI].obj.offsetTop + stEls[stI].obj.offsetHeight);
				}
				if(stBottom > 0){
					var kbTop = 0;
					try{ kbTop = objx.keyboard.obj.offsetTop; }catch(e){}
					var limit = (kbTop > stBottom + 10) ? kbTop : objx.full.obj.offsetHeight;
					var avail = limit - (stBottom + 2) - 2; // the gap the box may occupy
					if(avail < 20){ avail = 20; }
					var mSt = objx.messager.obj.style;
					mSt.top = (stBottom + 2) + "px";
					mSt.padding = "2px 5px";
					mSt.fontSize = "15px";
					mSt.height = (avail - 8) + "px"; // minus 2px borders + 2px paddings
				}
			}catch(e){}
		}
		objx.messager.q.fadeIn(par, function(){ app.blur_focus = false; });
		if(app.prevKey !== ""){
			try{
				layouts.makeKey(app.prevKey, false);
				app.prevKey = "";
			}catch(e){}
		}
		if(layouts.cleaner !== undefined){
			layouts.cleaner();
		}
		// turning attribute doesn't realy work in IE
		// so we force it making this;
		layouts.translator_shift = 0;
		layouts.translator();
	}
	, focuser		: function(){
		app.blur_focus = true;
	}

	, keyup				: function(_keys: any){
		if(app.keyboard_on){
		}
	}
	, keyboard_start		: function(){
		kb.keydown_add("app.mooving_keys");
		kb.keyup_add("app.keyup");
	}
	, keyboard_stop		: function(){
		kb.keydown_del("app.mooving_keys");
		kb.keyup_del("app.keyup");
	}
};

// era boot contract: wait for the loader chain pieces, then start
const boot = function (): void {
	try {
		if ((alf) && (mix.init) && (ev.init) && (strings.locale) && (fns) && (app)) {
			app.start.fn();
			app.timer = ev.i("app.counter()", 1000);
		} else {
			// era: arguments.callee retry — named function in strict mode
			window.setTimeout(boot, 500);
		}
	} catch (e) {
		alert(e);
	}
};

// the redraw after a typed key is the RESULT of its stat update: both
// StatUpdate types (Correct.StatUpdate and Mistake.StatUpdate — the only
// types of that name) redraw on postCreation, by when LetterPick|WordPick
// has moved the cursor; keydown redraws itself only for untyped keys
app.statUpdated = function (hookData: { TypeName: string }): void {
	if (hookData.TypeName === "StatUpdate") { app.p_go(); }
};
kbstore.store.collection.registerHook("postCreation", app.statUpdated);

// every key press is one dive call edge pinned to the session: its
// constructions (RunControl, KeyStroke -> Correct -> StatUpdate ->
// LetterPick -> KeyLight, …) parent on that edge — one Jaeger trace per
// key press. Best-effort: without the domain the handler stays as is.
try {
	const kbDive = (window as any).kbDive;
	if (kbDive && typeof kbstore !== "undefined" && kbstore.session) {
		app.mooving_keys = kbDive.wrap(app.mooving_keys, kbstore.session, "keystroke");
	}
} catch (e) { /* the raw handler keeps working */ }

(window as any).app = app;
boot();

}

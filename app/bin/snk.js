(function(){
	try{
		snk = {
		  start_snk			: function(){
				// alert(typeof(user.wsT))
				// alert(typeof(user.keybView))
				// alert(user.keybView)

				objx.zoomout_btn.In("-");
				objx.zoomout_btn.obj.title = "smaller window ( Ctrl + '-' )";
				objx.zoomout_btn.obj.onclick = function(){
					try{ window.kbZoomEvent(false); }catch(e){}
					try{ var szo = window.kbWinGetSize(); window.resizeTo(Math.round(szo[0] / 1.1), Math.round(szo[1] / 1.1)); }catch(e){}
				}

				objx.zoomin_btn.In("+");
				objx.zoomin_btn.obj.title = "bigger window ( Ctrl + '+' )";
				objx.zoomin_btn.obj.onclick = function(){
					try{ window.kbZoomEvent(true); }catch(e){}
					try{ var szi = window.kbWinGetSize(); window.resizeTo(Math.round(szi[0] * 1.1), Math.round(szi[1] * 1.1)); }catch(e){}
				}

				objx.help_btn.In(strings.m2);
				objx.help_btn.obj.onclick = function(){ snk.open_help(); }

				objx.lang_btn.In(strings.m3);
				objx.lang_btn.obj.onclick = function(){ kb.changeMap(); }

				objx.type_btn.In(strings.m4);
				objx.type_btn.obj.onclick = function(){ snk.changeTypingMode(); }

				objx.mode_btn.In(strings.m5);
				objx.mode_btn.obj.onclick = function(){ snk.changeMode(); }

				objx.sets_btn.In(strings.m7);
				objx.sets_btn.obj.onclick = function(){ snk.open_sets(); }

				objx.libr_btn.In(strings.m8);
				objx.libr_btn.obj.onclick = function(){ snk.open_lib(); }

				snk.layoutButtons();

				objx.time.obj.onmouseover = function(){
					//objx.time.cn("" + skins.selted[1] + "_time_hover");
				}
				objx.time.obj.onmouseout = function(){
					//objx.time.cn("" + skins.selted[1] + "_time");
				}
				objx.timer.obj.onmouseover = function(){
					objx.timer.hover = true;
					objx.timer.In("[ " + strings.n9 + fns.time_HMS(vars.timerCnt).stt + " :: " + strings.n3 + vars.cntSess + " ]");
				}
				objx.timer.obj.onmouseout = function(){
					objx.timer.hover = false;
					objx.timer.In(fns.time_HMS(vars.timerCnt).str + " :: " + vars.cntSess);
				}
				objx.txt_perc.obj.onmouseover = function(){
					objx.txt_perc.hover = true;
					objx.txt_perc.In("[ " + strings.n5[1] + app.typed + " % ]");
				}
				objx.txt_perc.obj.onmouseout = function(){
					objx.txt_perc.hover = false;
					objx.txt_perc.In("" + strings.n5[0] + app.typed);
				}
				objx.err_perc.obj.onmouseover = function(){
					objx.err_perc.hover = true;
					objx.err_perc.In("[ " + strings.n2[1] + app.strer + " % ]");
				}
				objx.err_perc.obj.onmouseout = function(){
					objx.err_perc.hover = false;
					objx.err_perc.In("" + strings.n2[0] + app.strer);
				}

				objx.speed.obj.onmouseover = function(){
					objx.speed.hover = true;
					objx.speed.In("[ " + strings.n1[2] + skins.doSpeed(app.speed) + " ]");
				}
				objx.speed.obj.onmouseout = function(){
					objx.speed.hover = false;
					objx.speed.In("" + strings.n1[0] + skins.doSpeed(app.speed) + strings.n1[1]);
				}
				objx.speed.obj.onclick = function(){
					vars.cntSess = 0;
					vars.cntErr = 0;
					vars.timerCnt = 0;
					// Session.ModeF7 (traced): zeroes the same stats cells the
					// lines above just zeroed (plus the domain-only `correct`)
					try{ new kbstore.session.ModeF7(); }catch(e){}
				}

				// clock retired: the TopBar island owns id.time (stage 4.2)

				kb.keydown_add("snk.keydown");
				kb.keychkb_add("snk.keychkb");
				snk.keychkb(); // showing current map;

				layouts.resizer();
				layouts.resizer(true);
				layouts.translator(1);
			}
			, keychkb		: function(){
				if(layouts !== undefined){
					layouts.translator_shift = 0;
					layouts.translator();
					objx.lang.In(kb.map[kb.current_map].name);
				}
				app.attr.ruenView();
			}
			, time			: function(){
				// bin/kbclock.js owns id.time (started by the "topbar" loader stage)
			}
			, keydown			: function(keys){
				var z = keys.code;
				//document.title = z;
				if((z == 27) && (app.keyboard_on === false)){
					// Esc on an idle/paused run is a quit REQUEST (traced), then confirmed
					try{
						var runControlQ = new kbstore.session.RunControl();
						new runControlQ.Quit();
					}catch(e){}
					if(window.confirm("Exit the program?")){
						app.keyboard_stop();
						window.close();
					}
				}

				// F-keys route through the domain router (Session.EventHandler.
				// dispatchKey) which constructs the ModeF* record; the era
				// action stays here. Exceptions: F3 and F7 construct their
				// record AFTER the state change they record (the toggle /
				// the stats zeroing), which the router cannot know — the era
				// keeps those two constructions directly.
				if(z == 112){ event.returnValue = false; try{ kbstore.session.handler.dispatchKey(112); }catch(e){} snk.open_help(); }						// F1 (Session.ModeF1 traced)
				if(z == 113){ event.returnValue = false; try{ kbstore.session.handler.dispatchKey(113); }catch(e){} kb.changeMap(); }						// F2 (Session.ModeF2 traced)
				if(z == 114){ event.returnValue = false; snk.changeTypingMode(); }				// F3 (ModeF3 record inside the toggle, era-kept)
				if(z == 115){ event.returnValue = false; snk.changeMode(); }					// F4 (ModeF4 via the router inside changeMode)
				if(z == 116){ event.returnValue = false; snk.open_sets(); }						// F5 (ModeF5 via the router inside open_sets)
				if(z == 118){ event.returnValue = false; objx.speed.obj.onclick(); }			// F7 (ModeF7 record inside the onclick, era-kept)

				if(z == 119){ event.returnValue = false; snk.open_lib(); }						// F8 (ModeF8 via the router inside open_lib)

				// to view how kbTrainer was loaded.
				if(z == 123){ event.returnValue = false; try{ kbstore.session.handler.dispatchKey(123); }catch(e){} loader_log_view()(); }	// F12 (Session.ModeF12 via the router)

				// Ctrl+1/2/3 — the era's mode switch: lesson / book / vocabulary;
				// 3 opens the mode dialog with the vocabulary paste panel (F4)
				if((z == 49) && keys.ctrl){ event.returnValue = false; user.LessonsMode = "lesson"; app.restart(); }
				if((z == 50) && keys.ctrl){ event.returnValue = false; user.LessonsMode = "book"; app.restart(); }
				if((z == 51) && keys.ctrl){ event.returnValue = false; user.LessonsMode = "vocabulary"; snk.changeMode(); }

			}
			// buttons functions
			, changeTypingMode			: function(){
				if(user.TypingMode == "native"){
					user.TypingMode = "paragraph";
				}else if(user.TypingMode == "paragraph"){
					user.TypingMode = "native";
				}
				// Session.ModeF3 (traced): records the mode the toggle produced
				try{ new kbstore.session.ModeF3(); }catch(e){}
				skins.applyCurentMode();
				// Stupid IE
				// pause AFTER the new mode's layout is applied: pauser sizes the
				// pause box to the gap above the keyboard, measured live — before
				// the switch it measured the OLD keyboard position (box too tall
				// after paragraph -> native, too short after native -> paragraph)
				app.pauser();
				// Stupid IE
				app.p_go();
				layouts.cleaner();
				// Stupid IE
				objx.messager.Fhide();
				objx.messager.Fshow();
				// can't do anything with messager...
				// Stupid IE
				// for IE
				layouts.translator_shift = 0;
				layouts.translator();
			// for IE
			}
			, changeMode			: function(){

				kernel.saveCurrentBookPosition();
				app.keyboard_stop();
				if(app._started){ // cause of app.start.cl.cnt = 3;
					if(app.blur_focus){
						app.pauser(500);
						ev.t("snk.changeMode()", 300);
					}else{
						var formd = {
						  kb		: kb
							, app		: app
							, snkt		: snk
							, user		: user
							, kernel	: kernel
							, layouts	: layouts
							, skins		: skins
							, strings	: strings
							, evop		: ""
							, lessons	: lessons
							, vocText	: (window.__vocabText || "") // the vocabulary paste round-trip
						}
						// Session.ModeF4 -> Program.ModeDialog (traced); only when
						// the overlay really opens — kbDialogOpen ignores a second one
						var modeDialog = null;
						try{
							if(!window.__kbDialog.args){
								// via the domain router
								modeDialog = kbstore.session.handler.dispatchKey(115).dialogInstance;
							}
						}catch(e){}
						formd.domain = modeDialog; // the island constructs the dialog's actions on it
						kbDialogOpen("bin/_mode.htm", formd,
							"dialogTop: "+window.screenTop+"px; dialogLeft: "+window.screenLeft+"px; dialogWidth: 750px; dialogHeight: 350px; center: 1; help:0; status:0; scroll:0; resizable: 0",
							function(){
								try{ if(modeDialog){ modeDialog.close(); } }catch(e){}
								if(formd.evop == "lib"){
									snk.open_lib(true);
								}else{
									// the pasted vocabulary text travels back and is
									// kept whenever it is non-empty — even if the
									// final selection is another mode (like the old
									// standalone window did). Memory only, never
									// persisted to user.txt
									if(typeof formd.vocText === "string" && formd.vocText.length > 0){
										window.__vocabText = formd.vocText;
									}
									app.restart();
								}
							});
					}
				}else{
					alert("Please wait...");
				}
			}
			, open_lib			: function(force){
				var doit = function(){
					kernel.saveCurrentBookPosition();
					app.keyboard_stop();
					var formd = {
					  user		: user
						, strings	: strings
					}
					// Session.ModeF8 -> Program.LibDialog (traced) via the router
					var libDialog = null;
					try{
						if(!window.__kbDialog.args){
							libDialog = kbstore.session.handler.dispatchKey(119).dialogInstance;
						}
					}catch(e){}
					formd.domain = libDialog;
					formd.kbstore = window.kbstore; // program: the library list + the file selector
					kbDialogOpen("bin/_lib.htm", formd,
						"dialogTop: "+(window.screenTop-100)+"px; dialogLeft: "+(window.screenLeft+200)+"px; dialogWidth: 620px; dialogHeight: 420px; center: 1; help:0; status:0; scroll:0; resizable: 0",
						function(){
							try{ if(libDialog){ libDialog.close(); } }catch(e){}
							app.restart();
						});
				}
				if(app._started){
					if(app.blur_focus){
						app.pauser(500);
						ev.t("snk.open_lib()", 300);
					}else{ doit(); }
				}else{
					if(force === undefined){ alert("Please wait..."); }else{ doit(); }
				}
			}
			, open_sets			: function(){
				if(app.blur_focus){
					app.pauser(500);
					ev.t("snk.open_sets()", 300);
				}else{
					var formd = {
					  kb		: kb
						, snk		: snk
						, usr		: user
						, kernel	: kernel
						, layouts	: layouts
						, skins		: skins
						, strings	: strings
					}
					// Session.ModeF5 -> Program.SettingsDialog (traced) via the router
					var setsDialog = null;
					try{
						if(!window.__kbDialog.args){
							setsDialog = kbstore.session.handler.dispatchKey(116).dialogInstance;
						}
					}catch(e){}
					formd.domain = setsDialog;
					formd.kbstore = window.kbstore; // userAliases: era pref names -> profile names
					kbDialogOpen("bin/_sets.htm", formd,
						"dialogTop: 50px; dialogLeft: 100px; dialogWidth: 750px; dialogHeight: 700px; center: 1; help:0; status:0; scroll:0; resizable: 0",
						function(){
							try{ if(setsDialog){ setsDialog.close(); } }catch(e){}
						});
				}
			}
			// button captions differ per locale, so box widths are measured from
			// the real text (bold 12px also covers the :hover style) and the row
			// is laid out left to right — no hard-coded px, nothing overlaps
			, layoutButtons		: function(){
				try{
					var ctx = document.createElement("canvas").getContext("2d");
					ctx.font = "bold 12px Tahoma, Arial, sans-serif";
					var btns = [objx.zoomout_btn, objx.zoomin_btn, objx.help_btn, objx.lang_btn,
						objx.type_btn, objx.mode_btn, objx.sets_btn, objx.libr_btn];
					var bx = 9;
					for(var bi = 0; bi < btns.length; bi++){
						var bo = btns[bi].obj;
						var bw = Math.ceil(ctx.measureText(bo.innerHTML).width) + 14;
						bo.style.boxSizing = "border-box"; // width below = the whole box (CSS padding/borders included)
						bo.style.left = bx + "px";
						bo.style.width = bw + "px";
						bo.style.setProperty("--kbx", bx + "px"); // the skin's :hover rule grows
						bo.style.setProperty("--kbw", bw + "px"); // the button around this center
						bx += bw + 3;
					}
				}catch(e){}
			}
			, open_help			: function(){
				if(app.blur_focus){
					app.pauser(300);
					ev.t("snk.open_help()", 350);
				}else{
				// the ORIGINAL help pages, as in the HTA: locale/<lang>/help.htm
				// (ru is the 2008 frameset). navigator.userLanguage was IE-only;
				// Electron: window.open needs a proper file:// URL (fs.filePath)
					var hl = String(navigator.language || "en").toLowerCase().substr(0, 2);
					if(hl !== "ru"){ hl = "en"; }
					window.open(fs.filePath(fs.locator("/locale/" + hl + "/help.htm")), "_blank");
					try{ new kbstore.session.ModeF1(); }catch(e){} // Session.ModeF1 (traced)
				}
			}
		};

		try{
			if((alf) && (mix.init) && (ev.init) && (strings.locale)){
				//if((alf) && ($()) && (ev.init) && (strings.locale)){
				snk.start_snk();
			}else{
			// restarts this unnamed function after 500 seconds
				window.setTimeout(arguments.callee, 500);
			}
		}catch(e){
			alert(e);
		}finally{}

	}catch(e){
		alert(e);
	}finally{}
})();

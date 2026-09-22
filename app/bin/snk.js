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
				// retired: the TopBar Vue island owns id.time (stage 4.2)
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

				if(z == 112){ event.returnValue = false; snk.open_help(); }						// F1 (no Shift needed outside HTA)
				if(z == 113){ event.returnValue = false; kb.changeMap(); }						// F2
				if(z == 114){ event.returnValue = false; snk.changeTypingMode(); }				// F3
				if(z == 115){ event.returnValue = false; snk.changeMode(); }					// F4
				if(z == 116){ event.returnValue = false; snk.open_sets(); }						// F5
				if(z == 118){ event.returnValue = false; objx.speed.obj.onclick(); }			// F7

				if(z == 119){ event.returnValue = false; snk.open_lib(); }						// F8

				// to view how kbTrainer was loaded.
				if(z == 123){ event.returnValue = false; loader_log_view()(); }					// F12

			}
			// buttons functions
			, changeTypingMode			: function(){
			// Stupid IE
				app.pauser();
				// Stupid IE
				if(user.TypingMode == "native"){
					user.TypingMode = "paragraph";
				}else if(user.TypingMode == "paragraph"){
					user.TypingMode = "native";
				}
				skins.applyCurentMode();
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
						}
						kbDialogOpen("bin/mode.html", formd,
							"dialogTop: "+window.screenTop+"px; dialogLeft: "+window.screenLeft+"px; dialogWidth: 750px; dialogHeight: 350px; center: 1; help:0; status:0; scroll:0; resizable: 0",
							function(){
								if(formd.evop == "lib"){
									snk.open_lib(true);
								}else{
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
					kbDialogOpen("bin/lib.html", formd,
						"dialogTop: "+(window.screenTop-100)+"px; dialogLeft: "+(window.screenLeft+200)+"px; dialogWidth: 620px; dialogHeight: 420px; center: 1; help:0; status:0; scroll:0; resizable: 0",
						function(){
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
					kbDialogOpen("bin/sets.html", formd,
						"dialogTop: 50px; dialogLeft: 100px; dialogWidth: 750px; dialogHeight: 700px; center: 1; help:0; status:0; scroll:0; resizable: 0");
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
				// Electron: window.open needs a proper file:// URL (fs.filePath).
				// help.html is the Vue island; it picks EN/RU from the OS locale itself
					window.open(fs.filePath(fs.locator("/locale/help.html")), "_blank");
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

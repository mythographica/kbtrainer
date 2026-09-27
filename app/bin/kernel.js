(function(){
	try{

		vars = {
		  StartDate				: new String(Date())

			, strArr				: {}

			, store_n				: 70	// how many symbols to store in "to_type" string
			, store_s				: 75	// how many symbols to store in one string MAX

			, to_type				: ""	// for storing symbols that user must type
			, already				: ""	// for storing symbols that user already type later (for books);
			, next_char1			: ""
			, pressed				: []	// to store pressed keys


			, cntSess				: 0 // typed symbols per this session (every changes between lessons and books set this to zero)
			, cntErr				: 0 // typed errore  per this session (every changes between lessons and books set this to zero)
			, timerCnt				: 0

			, textNotOver			: true

			, bookWasRead			: false

			, keyboardDiv			: ""

			// !!! replaced during skin evaluation
			// number of rows to view
			// let it be always no less than 5
			, num_of_rows	: 5
			// number of rows to view before refresh
			// ! never less than 1
			, view_wh_pos	: 2
		// !!! replaced during skin evaluation
		}


		kernel = {
		  startApplication	: function(){
				if(!fs.libExists()){
					fs.libCreate();
					user.save();
				}
				user.mda = fs.libExists();

				if(user.mda){

					user.load();

					// adding and loading other scripts

					ldr.add("functions", "bin/fns.js");
					ldr.add("topbar", "bin/kbclock.js");							// static kb.html chrome; this stage starts the wall clock (before objects: objex wraps the markup nodes)
					ldr.add("objects", "bin/objex.js");									// visual kernel objects

					ldr.add("kb", "bin/kb.js", "kb.mapsLoader()");						// keyboard events handlers and keycode->char maps
					ldr.add("skins", "bin/skins.js", "skins.skinLoader()");				// skins
					ldr.add("layouts", "bin/layouts.js", "layouts.layoutLoader()");		// lessons
					ldr.add("lessons", "bin/lessons.js", "lessons.lessonsLoader()");	// lessons

					ldr.add("app", "bin/engine.js");								// engine.ts port (stage 4.5)
					ldr.add("snk", "bin/snk.js");
					ldr.load();

					// window.setTimeout("loader_log_view()", 5000)
					// adding and loading other scripts

				}else{
					alert("Can't start application.\nSomething goes wrong.");
					window.close();
				}
			}

			// killer calls twice
			// probably twicw bacause onbeforeunload,
			// in correce firsr -- onbeforeunload
			// second by window.close()  that in killer's body
			// so -- must check> if called earlier.
			, killerVizvan		: false

			, killer			: function(){
				if ((user.mda) && (kernel.killerVizvan == false)){

					kernel.killerVizvan = true;

					// var wsT = window.screenY; // FF
					// var wsL = window.screenX; // FF
					var wsT = window.screenTop - 4;
					var wsL = window.screenLeft - 30;
					user.wsL = wsL;
					user.wsT = wsT;

					kernel.saveCurrentBookPosition(); // before user.save(); cause of user.CurrentBook = vars.strArr.path;

					user.save();

					kernel.saveHistory();

					window.close();
				}
			}
			, saveCurrentBookPosition	: function(){
				if(((vars.strArr.autor !== undefined) && (vars.strArr.book !== undefined) && (vars.strArr.path !== undefined))
					&& (vars.strArr.err === "")){
				// so, this is realy book, nor lesson
					api.saveBook(vars.strArr.path, vars.strArr.data, vars.strArr.autor, vars.strArr.book, vars.strArr.pos);
					user.CurrentBook = vars.strArr.path;
					// Program.BookMark (traced): the saved position
					try{ new kbstore.program.BookMark(vars.strArr.path, vars.strArr.pos); }catch(e){}
				}
			}
			, saveHistory				: function(){ }
		};

		try{
			if((alf) && (mix.init) && (ev.init) && (strings.locale)){
				//if((alf) && ($()) && (ev.init) && (strings.locale)){
				kernel.startApplication();
				document.body.onbeforeunload = function(){ kernel.killer(); }
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

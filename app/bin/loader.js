/* This loads all needed scripts in correct sequence.
   Electron edition: the original polled script tags with
   readyState/parentNode sniffs and string-eval timeouts; this version
   chains on script.onload. The public contract is unchanged:
   loader_array, loader_log, loader_log_view, ldr.add, ldr.status,
   ldr.ll, ldr.loadString_blink, and the deferred-eval convention where
   a component eval (e.g. kb.mapsLoader) marks itself "loading" via
   ldr.status and flips to "evaled" once its own sub-loads finish. */
try{

	var loader_array = {
	  "strings"		: ["locale/"+((navigator.userLanguage || navigator.language || "en").toLowerCase().substr(0, 2))+"/strings.js","","",""]
		// Strings MUST always be first
		, "mixer"		: ["bin/mixer.js","","ldr.loadString_blink()",""]
		, "eventer"		: ["bin/ev.js","","",""]
		, "alf"			: ["bin/alf.js","","",""]
		, "user"		: ["bin/user.js","","kbstore.adoptUser(user)",""]
		, "kernel"		: ["bin/kernel.js","","kbstore.adoptVars(vars)",""]
	};

	//alert(loader_log_view(1));

	var loader_log = [];
	var loader_log_view = function(par){
		var typ;
		var la = loader_log;
		var sstr = "<br>";
		if(par){ sstr = "\n"; }
		var str = "loader log:" + sstr;
		str += "total boot log entry lines count :  " + la.length + sstr;
		for(var i in la){
			typ = la[i];
			str += sstr + i + " ^ " + typ[1] + " " + typ[0] + " :  for: \"" + typ[3] + "\" " + typ[2];
		}
		if(par){
			return str;
		}else{
			var wo = window.open("", "kbTrainer Loader Message", "",true);
			wo.window.document.body.innerHTML = str;
		}
	}

	var ldr = { //loader
	  loadString_blink_tf	: false
	  // loadString_blink must be used only after strings & mixer is loaded
		, loadString_blink		: function(){
			if(!ldr.loadString_blink_tf){
				var str = (mix.In("loadString") == strings.ls) ? " " : strings.ls;
				mix.In("loadString", str);
				window.setTimeout("ldr.loadString_blink()", 350);
			}else{
				mix.In("loadString", " ");
				mix.Fhide("loadString");
			}
		}
		, timer					: function(tm){
			window.setTimeout("ldr.load()", tm);
		}
		, error_evaled			: 0
		, lc			: 0					// log counter
		, load_component		: function(id, src){
			var obj;
			obj = document.createElement("SCRIPT");
			obj.id = id;
			obj.src = src;
			document.body.appendChild(obj);
			return obj;
		}
		, add					: function(id, src, evaler){
			if(evaler === undefined){ evaler = ""; }
			loader_array[id] = [src, "", evaler, ""];
		}
		, status				: function(id, status){
			if(loader_array[id] !== undefined){
				if(status !== undefined){
					loader_array[id][3] = status;
				}else{
					return loader_array[id][3];
				}
			}
		}
		, ll					: function(p1,p2,p3,p4){ // loader log
			var la = loader_log;
			la[la.length] = [p1,p2,p3,p4];
		}
		// picks the first component not fully loaded yet and advances it
		// one step; reschedules itself while anything remains (or may be
		// added later by kernel.startApplication via ldr.add)
		, load					: function(){
			try{
				this.lc++;
				if(this.lc == 13){ // just for fun
					this.lc++;
				}
				var la = loader_array;
				for(var i in la){
					var st = la[i][3];
					if(st == "evaled" || st == "loaded"){ continue; }
					if(la[i][1] == ""){
					// script tag not appended yet
						try{
							var obj = this.load_component("js.id."+i, "" + la[i][0]);
							la[i][1] = obj;
							ldr.ll("script","loading src", "making", i);
							obj.onload = (function(entryId){
								return function(){
									ldr._markExecuted(entryId);
									window.setTimeout("ldr.load()", 0);
								};
							})(i);
							obj.onerror = (function(entryId){
								return function(){
								// like the original: a missing file does not
								// stop the chain, the entry is treated as done
									ldr.ll("script","error", "failed to load", entryId);
									ldr._markExecuted(entryId);
									window.setTimeout("ldr.load()", 0);
								};
							})(i);
						}catch(e){
							this.error_evaled++;
							ldr.ll("script","error", e, i);
						}
						this.timer(200); // watchdog in case neither handler fires
						return;
					}
					if(st == ""){
					// tag appended, script not executed yet
						this.timer(50);
						return;
					}
					if(st == "loading"){
					// component asked for time (loads its own files)
						this.timer(500);
						return;
					}
					// st == "scriptdone": script executed, run its eval if any
					if(la[i][2] != ""){
						try{
							var evalerF = new Function(la[i][2]);
							(function(){ evalerF(); })();
							la[i][3] = (la[i][3] == "scriptdone") ? "evaled" : la[i][3];
							ldr.ll("eval", "good", "just evaled", i);
							if(la[i][3] == "loading"){
								this.timer(500);
								return;
							}
							continue;
						}catch(e){
							this.error_evaled++;
							ldr.ll("eval", "error", e, i);
							this.timer(200);
							return;
						}
					}else{
						la[i][3] = "loaded";
						ldr.ll("loaded", "good", "loaded", i);
						continue;
					}
				}
				// nothing pending right now; kernel may ldr.add more later
				this.timer(300);
			}catch(e){
				if(this.error_evaled == 0){
					document.title = "kbTrainer";
				}else{
					document.title += e;
				}
				this.timer(500);
			}
		}
	}

	// marks entries whose script tag has finished executing; loader.load
	// only advances past an entry once its script ran (or failed, like the
	// original, which treated an appended tag as good enough)
	ldr._markExecuted = function(id){
		var la = loader_array;
		if(la[id] && la[id][3] == ""){ la[id][3] = "scriptdone"; }
	};

	ldr.load();

}catch(e){
	alert(e);
}finally{}

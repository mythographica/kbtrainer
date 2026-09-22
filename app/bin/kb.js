try{

	kb = {
		  map						: {} // look for maps in /res/ dir
		, mapsarr					: []

		, current_map				: ""
		, stopControl				: false // for stoping keydown function
		, chKeys					: {
			  ctk : false
			, alk : false
			, shk : false
		}

		, changeMapKeysPressed					: function(key){
			// combo match: src/lib/keymap.ts (vitest-covered); mc holds 0/1
			// ints from prefs, the flags are booleans — era compared loosely
			var res = window.kblib.mapChangerMatch(user.mapChanger, kb.chKeys, key);
			if(res.matched){
				// this returns to false on 200 ms in kb.keydown,
				kb.stopControl = true;
				kb.chKeys = res.chKeys;
			}
		}
		, changeMap					: function(){
			// cycling: src/lib/keymap.ts (vitest-covered)
			user.currentMap = window.kblib.nextMap(user.maps, user.currentMap, kb.current_map);
			kb.current_map = user.currentMap;
			for(var i in kb.keychkb_arr){ // changing keyboard map signed events
				try{ kb.keychkb_arr[i](); }catch(e){ }finally{}
			}
		}

		, loadselectedmaps			: function(){
			try{
				for(var i in user.selectedMaps){
					var smp = user.selectedMaps[i].split(".");
					if(kb.map[smp[0]][smp[1]].loader){ kb.map[smp[0]][smp[1]].loader(); }
				}
				// pair build + currentMap correction: src/lib/keymap.ts (vitest-covered)
				var sel = window.kblib.selectedMapsPair(user.selectedMaps, user.currentMap);
				user.maps = sel.maps;
				if(sel.corrected){
					user.currentMap = sel.currentMap;
					kb.current_map = user.currentMap;
				}
			}catch(e){ alert(e); }
		}

		, mapsLoaderCheck			: function(){
			var tf = true;
			for(var i in kb.map){
				for(var j in kb.map[i]){
					if(!api.checkLoaded(kb.map[i][j].obj)){
						tf = false;
						break;
					}
				}
				if(!tf){ break; }
			}

			if(tf){
				kb.loadselectedmaps();
				if(!kb.map[user.currentMap]){
					user.currentMap = "en";
				}
				var mc = user.mapChanger;
				kb.changeMap();
				ldr.status("kb", "evaled"); // component is fully loaded, so, goon next
			}else{
				ev.t("kb.mapsLoaderCheck()", 300);
			}
		}

		, mapsLoader				: function(){
			try{
				// pausing loading other components until kb become loaded (maps)
				// lookup in mapsLoaderCheck and you see what becoming next
				ldr.status("kb", "loading");
				// !!! alyays return status to loader, cause if not to return loader CYCLEs by this!
				// needed status after this is "evaled" !
				kb.map = {};
				kb.mapsarr = [];

				var FolLoc = "" + fs.locator("maps");
				if (fs.exists(FolLoc)) {
					var ff = fs.readDir(FolLoc, false);
					if (ff) {
						for (var i = 0; i < ff.length; i++) {
							var x = fs.turnObj(ff[i]);
							if (x.isFile) {
							// map.*.js parse: src/lib/keymap.ts (vitest-covered)
								var pm = window.kblib.parseMapFileName(x.name);
								if(pm){
									var name = pm.mapName;
									kb.mapsarr[kb.mapsarr.length] = name;
									if(!kb.map[pm.lang]){ kb.map[pm.lang] = []; }
									kb.map[pm.lang][pm.name] = [];
									kb.map[pm.lang][pm.name].obj = mix.nSCRIPT("map_id_"+name, x.filePath);
									ldr.ll("loading", x.filePath, "", "");
								}
							}}
					}
					ev.t("kb.mapsLoaderCheck()", 200);
				}
			}catch(e){ alert(e); }
		}

		, returnControl			: function(){
			kb.stopControl = false;
		}

		, rf: function(fnm){
			return new Function("evt", ""+fnm+"(evt);");
		}

		, keydown_arr			: {}
		, keyup_arr				: {}
		, keypress_arr			: {}
		, keychkb_arr			: {} // changing keyboard map

		, keydown_add			: function(fnToAdd){
			kb.keydown_arr[fnToAdd] = kb.rf(fnToAdd);
		}
		, keydown_del			: function(fnToDel){
			try{ if(kb.keydown_arr[fnToDel] !== undefined){ delete kb.keydown_arr[fnToDel]; } }catch(e){ }
		}

		, keypress_add			: function(fnToAdd){
			kb.keypress_arr[fnToAdd] = kb.rf(fnToAdd);
		}
		, keypress_del			: function(fnToDel){
			try{ if(kb.keypress_arr[fnToDel] !== undefined){ delete kb.keypress_arr[fnToDel]; } }catch(e){ }
		}

		, keyup_add			: function(fnToAdd){
			kb.keyup_arr[fnToAdd] = kb.rf(fnToAdd);
		}
		, keyup_del			: function(fnToDel){
			try{ if(kb.keyup_arr[fnToDel] !== undefined){ delete kb.keyup_arr[fnToDel]; } }catch(e){ }
		}

		, keychkb_add			: function(fnToAdd){
			kb.keychkb_arr[fnToAdd] = kb.rf(fnToAdd);
		}
		, keychkb_del			: function(fnToDel){
			try{ if(kb.keychkb_arr[fnToDel] !== undefined){ delete kb.keychkb_arr[fnToDel]; } }catch(e){ }
		}

		, keydown					: function(event){
			if(!kb.stopControl){
				var key = {
					  code	: event.keyCode
					, ctrl	: event.ctrlKey
					, alt	: event.altKey
					, shift	: event.shiftKey
				}
				// document.title = "here " + key.code + " " + key.ctrl + " " + key.shift + " " + key.alt;
				kb.chKeys = {
					  ctk : key.ctrl
					, alk : key.alt
					, shk : key.shift
				};

				for(var i in kb.keydown_arr){
					try{
						kb.keydown_arr[i](key);
					}catch(e){ }finally{}
				}

			}
		}
		, keyup					: function(event){
			if(!kb.stopControl){
				var key = {
					  code	: event.keyCode
					, ctrl	: event.ctrlKey
					, alt	: event.altKey
					, shift	: event.shiftKey
				}
				// document.title = "here " + key.code + " " + key.ctrl + " " + key.shift + " " + key.alt;
				kb.changeMapKeysPressed(key.code);
				if(kb.stopControl){ // protection from pressing this buttons again
					ev.t("kb.returnControl()", 200);
					kb.changeMap();
					// document.title = kb.current_map;
				}else{
					for(var i in kb.keyup_arr){
						try{
							kb.keyup_arr[i](key);
						}catch(e){ }finally{}
					}
				}
			}
		}
		, keypress					: function(event){
			if(!kb.stopControl){
				var key = {
					// in Internet Explorer this is a event.keyCode too
					// but in FireFox event.keyCode is always 0 (zero) for keypress
					// in FireFox event.which is also can be used for this in FireFox
					  code	: event.charCode
					, ctrl	: event.ctrlKey
					, alt	: event.altKey
					, shift	: event.shiftKey
				}
				// document.title = "here " + key.code + " " + key.ctrl + " " + key.shift + " " + key.alt;
				for(var i in kb.keypress_arr){
					try{
						kb.keypress_arr[i](key);
					}catch(e){ }finally{}
				}
			}
		}
	}

	ev.WinEvent("onkeydown"		, "kb.keydown");
	ev.WinEvent("onkeypress"	, "kb.keypress");
	ev.WinEvent("onkeyup"		, "kb.keyup");


	/*
	testkbdown = function(keys){
		document.title = keys.code;
	}
	kb.keydown_add("testkbdown");
	document.title = "Es";
	*/


}catch(e){
	alert(e);
}finally{}

(function(){
	try{

		// * Abstract Layer Functions library unit *
		// -- user preferenses manipulation: pf
		// -- file system objects functions: fs
		// -- books & library manipulations: books
		//
		// Electron edition: Scripting.FileSystemObject / WScript.Shell / ADODB.Stream
		// are replaced by the synchronous kbfs bridge (electron/preload.js -> main.js).
		// The bridge lives in the top window; modal dialogs (_lib.htm etc.) reach it
		// through the frame chain. Public API is unchanged from the HTA version.

		alf = false;

		var kbfs = window.kbfs
	|| (window.parent && window.parent.kbfs)
	|| (window.top && window.top.kbfs);
		var KBROOT = kbfs.rootPath(); // writable: user.txt, lib/
		var KBAPP = kbfs.appPath();   // read-only app resources: maps, skins, layouts, lessons, locale

		/* Local Variables */
		/* user preferenses */
		var DEFAULT_PREFS = [
	  "wsT:::200"
			, "wsL:::50"
			, "cntFull:::0"
			, "skin:::native"
			, "layouts:::native"
			, "maps:::ru,en"
			, "currentMap:::en"
			, "mapChanger:::0,1,1"
			, "LessonsMode:::lesson"
			, "LessonNum:::en,base0,0"
			, "errMode:::true"
			, "shiftControl:::false"
			, "keybView:::true"
			, "keybSize:::sml"
			, "hider:::true"
			, "hiderInterval:::200"
			, "ErrAlwaysCount:::false"
			, "oneErrOnly:::true"
			, "spaceInvert:::false"
			, "spaceIsShiftSensentive:::true"
			, "selectedMaps:::ru.standard,en.standard"
			, "skipNonTypedCharacters:::true"
			, "hideStatsOnPause:::false"
			, "Sound:::true"
			, "SoundVolume:::50"
			, "CurrentBook:::"
			, "TypingMode:::native"
		];

		pf = function(id, vl){
			try{
				var raw = kbfs.read(fs.userFile, "UTF-8");
				if(raw === false){
					kbfs.write(fs.userFile, DEFAULT_PREFS.join("\r\n") + "\r\n", "UTF-8");
					raw = kbfs.read(fs.userFile, "UTF-8");
				}
				// parse/format lives in src/lib/prefs.ts, built to bin/kblib.js
				// (vitest-covered); era callers keep using pf() exactly as before
				if(vl !== undefined){
					kbfs.write(fs.userFile, window.kblib.prefsSet(String(raw), id, String(vl)), "UTF-8");
					return true;
				}else{
					return window.kblib.prefsGet(String(raw), id);
				}
			}catch(e){ alert("prefs " + id + " in " + e); }
		}
		//pf.o = pv.pf;
		pf.storeLastFolderNameHF = function(){
			try{
				// pv.pf.setComplexValue("LastFolderName", CI.nsILocalFile, ffcom.HomeFolder);
				return true;
			}catch(e){ alert(e); return false; }
			return false;
		}
		pf.clearPrefs = function(){
			try{
				kbfs.del(fs.userFile);
			}catch(e){ alert(e); return false; }
			return false;
		}
		pf.storeLastFolderName = function(path){
			if(path){
				try{
					pf("LastFolderName", path)
					return true;
				}catch(e){ return false; }
			}else{
				return false;
			}
			return false;
		}
		pf.getLastFolderName = function(){
			try{
				return pf("LastFolderName");
			}catch(e){
				// alert(e);
			}
		}
		/* user preferenses */

		// xml DOM functions
		api = {
	 checkLoaded			: function(obj){
				// FOR Internet Explorer it will
				if( obj.readyState != "complete"){
					// Fire Fox
					// if( obj.parentNode === undefined){
					// if((obj["parentNode"] === undefined)){
					return false;
				}else{
					return true;
				}
			}
			, books					: function (par){
				try{
					var books = [];
					if(fs.libExists()){
						var f = fs.lib();
						var ff = fs.readDir(f, false);
						if (ff) {
							for (var i = 0; i < ff.length; i++) {
								var x = fs.turnObj(ff[i]);
								if (x.isFile) {
									var qxml = x.nlc.substr(x.name.length-4,4);
									str = x.nlc;
									str = str.replace(/.txt/g,"");
									str = str.split("_");
									var spliter = parseInt(x.nlc.replace(/.txt/g,"").split("_")[1]);
									// lib/vocabulary.txt is the vocabulary mode's
									// persisted paste (2026-09-28), not a book —
									// it has no book_N header and the NaN check
									// below alone would still list it
									if((x.name !== "vocabulary.txt") && (qxml == ".txt") && (typeof(spliter) == "number") && (spliter != NaN)){
										books[i] = new Array();
										books[i]["name"] = x.name;
										books[i]["path"] = x.path;
										books[i]["xnun"] = spliter;
										books[i]["autor"] = "";
										books[i]["book"] = "";
										books[i]["position"] = "";
										if(par){ // that I need info about book, not only max xnun
											var str = fs.readFileToString(x.path, "UTF-8");
											if(str){
												var book = str.split("\n");
												books[i]["autor"]		= book[0];
												books[i]["book"]		= book[1];
												books[i]["position"]	= book[2];
											}
										}
									}
								}
							}
						}
					}
					if(par){ // returning books array
						var perv = "";
						for (var j in books){
							for (var i in books){
								if(perv == ""){
									perv = i;
								}else{
									if(books[perv]["xnun"] > books[i]["xnun"]){
										var cerv = books[perv];
										books[perv] = books[i];
										books[i] = cerv;
									}
									perv = i;
								}
							}
							perv = "";
						}
						return books;
					}else{ // max xnun (number of book in files)
						var max = 0;
						for (var i in books){
							if(books[i]["xnun"] > max){
								max = books[i]["xnun"];
							}
						}
						return max + 1;
					}
				}catch(e){ alert(e); return false; }
			}
			, saveBook			: function(path, data, autor_id_str, bookname_id_str, pos){
				try {
					if(!fs.libExists()){ fs.libCreate(); }
					if(pos == undefined){ pos = 0; }

					str = autor_id_str + "\n";
					str += bookname_id_str + "\n";
					str += pos + "\n";
					str += data;
					kbfs.write(path, str, "UTF-8");

					return true;
				}catch(e){ alert("saving book error: \n"+e); return false; }
			}
			/*
	//	, selbook			: function(par){
	//		pf("CurrentBook", par);
	//	}

*/
			, deltebook			: function (par){
				kbfs.del(par);
				return !fs.exists(par);
			}
		};
		// xml DOM functions

		fs = {
	  sepC			: "/"
			, sep			: "/"
			, path			: KBAPP
			, pathRDF		: KBROOT
			, userFile		: KBROOT + "/user.txt"
			, lib			: function(){
				return KBROOT + "/lib/";
			}
			//, path : "to store where is kbTrainer directory folder"
			, locator		: function(r){
				try{
					var s = fs.sep;
					var p = fs.path;
					if(r){
						if(r.charAt(0) == "/" || r.charAt(0) == "\\"){ r = r.substr(1); }
						return p + s + r;
					}
					else{ return p + s; }
				}catch(e){ alert(e); return false; }
			}
			, filePath 		: function(par){
				//if (navigator.platform.toLowerCase().indexOf('win') > -1) {
				//}
				var filer = "file://"
				return filer + par;
			}
			, open			: function(path){
				try{
					var st = kbfs.exists(path);
					if(st){ return { name: path.split(fs.sep).pop(), path: path, size: st.size }; }
					return false;
				}catch(e){ alert(e); return false; }
			}
			, exists		: function(path){
				try{
					return !!kbfs.exists(path);
				}catch(e){ alert(e); return false; }
			}
			, readDir		: function(path, recursive){
				try{
					// files only, like Enumerator over FSO Folder.files
					var ff = kbfs.readDir(path);
					return ff ? ff : false;
				}catch(e){ alert(e); return false; }
			}
			// the era file picker's listing: directories AND files, flagged
			// (kbfs-listdir); used by bin/_fopn.htm
			, listDir		: function(path){
				try{
					var ff = kbfs.listDir(path);
					return ff ? ff : false;
				}catch(e){ alert(e); return false; }
			}
			, turnObj		: function(obj){ // obj is file obj
				try{
					var oobj = {};
					oobj.name = obj.name;
					oobj.nlc = obj.name.toLowerCase();
					oobj.path = obj.path;
					oobj.filePath = obj.path;
					var st = kbfs.exists(oobj.path);
					if(st){
						oobj.isFile = st.isFile;
						oobj.isDir = st.isDir;
					}
					oobj.fileSize = obj.size;

					oobj.obj = obj;
					return oobj;
				}catch(e){ alert(e); return false; }
			}
			, readFileToString	: function(path, charset){
				try {
					var str = kbfs.read(path, charset);
					return str;
				}catch(e){ alert(e); return false; }
			}
			, openTextFileDlg : function(){
				try{
					var path = kbfs.openTextFileDialog();
					if(path && fs.exists(path)){
						return path;
					}else{
						return false;
					}
				}catch(e){ return false; }
			}
			, libExists: function(){
				try{
					var st = kbfs.exists(fs.lib());
					return !!(st && st.isDir);
				}catch(e){ alert(e); return false; }
			}
			, libCreate: function(){
				try{
					kbfs.mkdir(fs.lib());
					return fs.libExists();
				}catch(e){ alert(e); return false; }
			}
		}
		alf = true;

	}catch(e){ alert(e); }
})();

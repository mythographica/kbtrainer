// layouts.ts — typed port of the era app/bin/layouts.js (stage 4.4).
//
// Same global, same public surface, same behavior — the era string-eval
// timers (ev.t("layouts.resizer_true()", 500)) and app.js/snk.js call sites
// keep working unchanged. The keyboard geometry stays data: layout.*.css
// files under app/layouts/ declare one rule per button (.native_sml_btn_70_0
// etc.) and creator() discovers them by scanning document.styleSheets;
// layout.*.js files attach themselves onto this global (layouts["native"] =
// {...}).
//
// Since stage 4.4 the id.keyboard container itself is rendered by the
// main-window island; objex.js wraps it and evaluator() fills it per
// map/shift as before.

/* eslint-disable @typescript-eslint/no-explicit-any */

// Everything lives in a namespace (like the islands): the renderer TS files
// are compiled together by tsconfig.renderer.json and, being import-free
// scripts, share one global scope — unwrapped declares would collide.
// The era global is published at the bottom: (window).layouts = layouts.
namespace klay {

declare const mix: any;     // bin/mixer.js
declare const kb: any;      // bin/kb.js
declare const user: any;    // bin/user.js (adopted by kbstore)
declare const vars: any;    // bin/kernel.js
declare const objx: any;    // bin/objex.js
declare const fs: any;      // preload shim
declare const ev: any;      // bin/ev.js
declare const api: any;     // preload api
declare const ldr: any;     // bin/loader.js

interface LayoutsPublic {
	[key: string]: any;

	arr: any[];
	selted: any;
	translator_shift: number;

	resizer: (par?: any) => void;
	resizer_true: () => void;

	makeSpace: (currForSpaceKey: string, currForSpaceKeyShift: any) => void;
	makeBackSpace: () => void;
	makeEnter: () => void;
	makeShift: (par: string) => void;
	makeKey: (key: any, tf: boolean, chr?: string) => void;

	cleanerShort: () => void;
	cleaner: () => void;

	creator: (layout: string, map: string, sh: string, kbdiv: string) => boolean;
	hider: () => void;
	translator: (par?: number) => void;
	evaluator: () => void;
	layoutLoad: () => void;
	layoutLoader: () => void;
}

const layouts: LayoutsPublic = {

	  arr				: []
	, selted			: ""
	, translator_shift	: 0

	, resizer		: function(par?: any){
		var sz = user.keybSize;
		if(par && user.keybView){
			objx.keyboard.m.setAttribute("kbs", sz);
		}else{
			objx.keyboard.m.setAttribute("kbs", "no");
		}
		// Electron: the window is freely resizable and kbFit scales the
		// design canvas into it; no more forced window.resizeTo here
		if((window as any).kbFit){ (window as any).kbFit.apply(); }
	}
	, resizer_true 	: function(){ layouts.resizer(true); }

	, makeSpace 		: function(currForSpaceKey: string, currForSpaceKeyShift: any){
		var lout = user.layouts;
		var map = user.currentMap;
		var sh = "s";
		if(layouts.translator_shift == 1){
			sh = "sh";
		}
		var kllmsh = layouts[lout][map][sh];
		var rl;
		switch (currForSpaceKey) {
			case "R" :
				rl = (user.spaceIsShiftSensentive && currForSpaceKeyShift) ? (user.spaceInvert ? "r" : "l") : (user.spaceInvert ? "l" : "r") ; break;
			case "L" :
				rl = (user.spaceIsShiftSensentive && currForSpaceKeyShift) ? (user.spaceInvert ? "l" : "r") : (user.spaceInvert ? "r" : "l") ; break;
			case "C" :
				rl = "c"; break;
			case "" :
				rl = "c"; break;
			default :
				rl = "c"; break;
		}
		kllmsh.space.m.setAttribute("hl", true);
		kllmsh.space.m.setAttribute("rl", rl);
	}

	, makeBackSpace		: function(){
		var lout = user.layouts;
		var map = user.currentMap;
		var sh = "s";
		if(layouts.translator_shift == 1){
			sh = "sh";
		}
		var kllmsh = layouts[lout][map][sh];
		kllmsh.backspace.m.setAttribute("hl", true);
	}

	, makeEnter			: function(){
		var lout = user.layouts;
		var map = user.currentMap;
		var sh = "s";
		if(layouts.translator_shift == 1){
			sh = "sh";
		}
		var kllmsh = layouts[lout][map][sh];
		kllmsh.enter.m.setAttribute("hl", true);
		if(kllmsh.enter_two){
			kllmsh.enter_two.m.setAttribute("hl", true);
		}
	}

	, makeShift			: function(par: string){
		var lout = user.layouts;
		var map = user.currentMap;
		var sh = "s";
		if(layouts.translator_shift == 1){
			sh = "sh";
		}
		var kllmsh = layouts[lout][map][sh];
		if((par == "R") || (par == "C") ){
			kllmsh.rshift.m.setAttribute("hl", true);
		}
		if((par == "L") || (par == "C") ){
			kllmsh.lshift.m.setAttribute("hl", true);
		}
	}

	, makeKey			: function(key: any, tf: boolean, chr?: string){
		key = parseInt(key);
		var lout = user.layouts;
		var map = user.currentMap;
		var sh = "s";
		var bk = "back";
		if(layouts.translator_shift == 1){
			sh = "sh";
			bk = "shback";
		}
		var kllmsh = layouts[lout][map][sh];
		try{
			var mapR = kb.map[map][bk][key][6]; // map Rule name
			if(mapR.indexOf("rule") > -1){
				if(chr){
					if(kb.map[map].ruleChars.indexOf(chr)>-1){
						kllmsh[kb.map[map][mapR].modyfier].m.setAttribute("hl", tf);
						kllmsh[key][0].In(kb.map[map][mapR][bk]);
					}else{
						kllmsh[kb.map[map][mapR].modyfier].m.setAttribute("hl", false);
						kllmsh[key][0].In(kb.map[map][bk][key][5]);
					}
				}
			}
		}catch(e){}

		for(var j in kllmsh[key]){
			kllmsh[key][j].m.setAttribute("hl", tf);
		}
	}

	, cleanerShort		: function(){
		var lout = user.layouts;
		var map = user.currentMap;
		var sh = "s";
		if(layouts.translator_shift == 1){
			sh = "sh";
		}
		var kllmsh = layouts[lout][map][sh];
		kllmsh.lshift.m.setAttribute("hl", false);
		kllmsh.rshift.m.setAttribute("hl", false);
		kllmsh.ralt.m.setAttribute("hl", false);
		kllmsh.lalt.m.setAttribute("hl", false);
		kllmsh.backspace.m.setAttribute("hl", false);
		kllmsh.enter.m.setAttribute("hl", false);
		kllmsh.space.m.setAttribute("hl", false);
		kllmsh.space.m.setAttribute("rl", "c");
		if(kllmsh.enter_two){
			kllmsh.enter_two.m.setAttribute("hl", false);
		}
	}

	, cleaner			: function(){
		var lout = user.layouts;
		var map = user.currentMap;
		var sh = "s";
		var bk = "back";
		if(layouts.translator_shift == 1){
			sh = "sh";
			bk = "shback";
		}
		var kllmsh = layouts[lout][map][sh];
		for(var i in kllmsh){
			if(parseInt(i)){
				for(var j in kllmsh[i]){
					kllmsh[i][j].m.setAttribute("hl", false);
					try{
						var mapK = kb.map[map][bk][i];
						if(mapK[6].indexOf("rule") > -1){
							kllmsh[i][0].In(mapK[5]);
						}
					}catch(e){}
				}
			}
		}
		layouts.cleanerShort();
	}

	, creator			: function(layout: string, map: string, sh: string, kbdiv: string): boolean{
		var kbs = user.keybSize;
		var lkbs = "" + layout + "_" + kbs;
		var shback = "back";
		if(sh == "sh") { shback = "shback"; }

		var cps = layouts[layout].comparsing;
		var compare = "." + lkbs + "_btn_";
		var compare_macro = "." + lkbs + "_spec_macro";
		var compare_menu = "." + lkbs + "_spec_menu";
		var compare_enter = "." + lkbs + "_spec_enter_two";
		var macro_present = false;
		var menu_present = false;
		var enter_present = false;

		var cr_failed = true;

		//[map][sh]
		if(!layouts[layout][map]){
			layouts[layout][map] = [];
		}
		if(!layouts[layout][map][sh]){
			layouts[layout][map][sh] = [];
		}
		var kllmsh = layouts[layout][map][sh];

		for(var i = 0; i < document.styleSheets.length; i++){
			var ss = document.styleSheets[i];
			// Electron: W3C cssRules with index access (IE's callable ss.rules(q) is gone)
			var ssrules = ss.cssRules || (ss as any).rules;
			if(!ssrules){ continue; }
			for(var q = 0; q < ssrules.length; q++){
				var text = (ssrules[q] as any).selectorText as string;
				if(text.substring(0, (lkbs.length + 6)) === compare){
					var str = text.split(compare)[1].split("{")[0].replace(/ /g,"").split("_");
					if(str.length == 2){
						try{
							var btn = parseInt(str[0]);
							var num = parseInt(str[1]);
							var cnm = "" + lkbs + "_btn_" + btn + "_" + num;
							var cpc = "" + btn + "_" + num;
							if(!kllmsh[btn]){
								kllmsh[btn] = [];
							}
							var fm = kllmsh[btn];

							var btn_id = "" + kbdiv + "_keys_" + btn + "_" + num + "_" + map + "_" + sh;
							var obj = fm[num] = mix.addObj(btn_id, kbdiv);
							obj.cn(cnm);

							// for composite buttons to create an array and to select in whish button to write the letter
							// so this will be forming component of layout
							if(cps != ""){
								if(cps.indexOf(cpc) < 0){
									obj.In(kb.map[map][shback][btn][5]);
								}
							}else{
								obj.In(kb.map[map][shback][btn][5]);
							}

							/* FJ */
							if(kb.map[map].FJ){
								if(btn == kb.map[map].FJ[0] || btn == kb.map[map].FJ[1]){
									obj.In("<span class = \"" + layout + "_fj_underline\">&nbsp;" +obj.In()+ "&nbsp;</span>");
								}}
							/* FJ */

						}catch(e){
							cr_failed = false;
							break; // era had a dead alert() after this break
						}
					}
				}
				if(text.substring(0, (lkbs.length+12)) == compare_macro){
					macro_present = true;
				}
				if(text.substring(0, (lkbs.length+11)) == compare_menu){
					menu_present = true;
				}
				if(text.substring(0, (lkbs.length+16)) == compare_enter){
					enter_present = true;
				}
			}
			if(!cr_failed){
				break;
			}
		}

		if(cr_failed){
			try{
				var btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_tab";
				kllmsh.tab = mix.addObj(btn_id, kbdiv);
				kllmsh.tab.cn(lkbs + "_spec_tab");
				kllmsh.tab.In("Tab");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_caps";
				kllmsh.caps = mix.addObj(btn_id, kbdiv);
				kllmsh.caps.cn(lkbs + "_spec_caps");
				kllmsh.caps.In("Caps");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_lshift";
				kllmsh.lshift = mix.addObj(btn_id, kbdiv);
				kllmsh.lshift.cn(lkbs + "_spec_lshift");
				kllmsh.lshift.In("Shift");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_lctrl";
				kllmsh.lctrl = mix.addObj(btn_id, kbdiv);
				kllmsh.lctrl.cn(lkbs + "_spec_lctrl");
				kllmsh.lctrl.In("Ctrl");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_lwin";
				kllmsh.lwin = mix.addObj(btn_id, kbdiv);
				kllmsh.lwin.cn(lkbs + "_spec_lwin");
				kllmsh.lwin.In("Win");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_lalt";
				kllmsh.lalt = mix.addObj(btn_id, kbdiv);
				kllmsh.lalt.cn(lkbs + "_spec_lalt");
				kllmsh.lalt.In("Alt");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_space";
				kllmsh.space = mix.addObj(btn_id, kbdiv);
				kllmsh.space.cn(lkbs + "_spec_space");
				kllmsh.space.In("space");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_ralt";
				kllmsh.ralt = mix.addObj(btn_id, kbdiv);
				kllmsh.ralt.cn(lkbs + "_spec_ralt");
				kllmsh.ralt.In("Alt");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_rwin";
				kllmsh.rwin = mix.addObj(btn_id, kbdiv);
				kllmsh.rwin.cn(lkbs + "_spec_rwin");
				kllmsh.rwin.In("Win");

				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_rctrl";
				kllmsh.rctrl = mix.addObj(btn_id, kbdiv);
				kllmsh.rctrl.cn(lkbs + "_spec_rctrl");
				kllmsh.rctrl.In("Ctrl");

				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_rshift";
				kllmsh.rshift = mix.addObj(btn_id, kbdiv);
				kllmsh.rshift.cn(lkbs + "_spec_rshift");
				kllmsh.rshift.In("Shift");
				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_enter";
				kllmsh.enter = mix.addObj(btn_id, kbdiv);
				kllmsh.enter.cn(lkbs + "_spec_enter");
				kllmsh.enter.In("Enter");

				btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_backspace";
				kllmsh.backspace = mix.addObj(btn_id, kbdiv);
				kllmsh.backspace.cn(lkbs + "_spec_backspace");
				kllmsh.backspace.In("&larr;&nbsp;&nbsp;back");
				if(
					((lkbs + "_spec_backspace") == "such2_sml_spec_backspace") ||
					((lkbs + "_spec_backspace") == "such2_med_spec_backspace") ||
					((lkbs + "_spec_backspace") == "such2_big_spec_backspace")
				){ kllmsh.backspace.In("&nbsp;&larr;&nbsp;"); }

				if(macro_present){
					btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_macro";
					kllmsh.macro = mix.addObj(btn_id, kbdiv);
					kllmsh.macro.cn(lkbs + "_spec_macro");
					kllmsh.macro.In("/");
				}
				if(menu_present){
					btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_menu";
					kllmsh.menu = mix.addObj(btn_id, kbdiv);
					kllmsh.menu.cn(lkbs + "_spec_menu");
					kllmsh.menu.In("mn");
				}
				if(enter_present){
					btn_id = "" + kbdiv + "_keys_" + map + "_" + lkbs + "_enter_two";
					kllmsh.enter_two = mix.addObj(btn_id, kbdiv);
					kllmsh.enter_two.cn(lkbs + "_spec_enter_two");
					kllmsh.enter_two.In("&crarr;");
				}else{
					kllmsh.enter.In("&crarr;&nbsp;&nbsp;Enter");
				}
			}catch(e){
				cr_failed = false;
				alert("Button Special creation failed:\n" + e);
				mix.In(kbdiv, " ");
			}
		}
		return cr_failed;
	}


	, hider				: function(){
		for(var i in user.maps){
			var map = user.maps[i];
			vars.keyboardDiv[map].s.hide();
			vars.keyboardDiv[map].sh.hide();
		}
	}

	, translator		: function(par?: number){
		if(par != 0){ layouts.hider(); }
		var sh = "s";
		if(layouts.translator_shift == 1){
			sh = "sh";
		}
		vars.keyboardDiv[user.currentMap][sh].show();
	}

	, evaluator			: function(){
		objx.keyboard.In(" ");
		var per = user.keybSize;
		var lout = layouts.selted[1];
		var tf = true;

		vars.keyboardDiv = {}; // was kernel.objs.keyboardDiv
		for(var i in user.maps){
			var map = user.maps[i];

			vars.keyboardDiv[map] = {};
			if(!mix("keyboardDiv_"+map+"_s_id")){
				vars.keyboardDiv[map].s = mix.addObj("keyboardDiv_"+map+"_s_id", "id.keyboard");
			}else{
				vars.keyboardDiv[map].s.In(" ");
			}
			vars.keyboardDiv[map].s.cn(lout + "_keyboardDiv_" + per);
			if(!mix("keyboardDiv_"+map+"_sh_id")){
				vars.keyboardDiv[map].sh = mix.addObj("keyboardDiv_"+map+"_sh_id", "id.keyboard");
			}else{
				vars.keyboardDiv[map].sh.In(" ");
			}
			vars.keyboardDiv[map].sh.cn(lout + "_keyboardDiv_" + per);

			if(!layouts.creator(lout, map, "s", vars.keyboardDiv[map].s.obj.id)){
				tf = false;
				break;
			}		// simple
			if(!layouts.creator(lout, map, "sh", vars.keyboardDiv[map].sh.obj.id)){
				tf = false;
				break;
			}		// shifted
		}
		// loading CurrentMap
		if(tf){
			layouts.translator_shift = 0;
			layouts.translator();
		}else{
			ev.t("layouts.evaluator()", 100);
		}
	}

	, layoutLoad		: function(){

		var gonext = true;
		for (var i in layouts.arr){
			if(layouts.arr[i][1] == user.layouts){ // name == name
				var name = layouts.arr[i][1];
				if(layouts.selted[2] == ""){
					layouts.selted[2] = mix.nSCRIPT("id."+name+".layoutMain.js", layouts.selted[0]);
					ev.t("layouts.layoutLoad()", 50);
					gonext = false;
					break;
				}else{
					if(!api.checkLoaded(layouts.selted[2])){
						ev.t("layouts.layoutLoad()", 50);
						gonext = false; break;
					}
				}
				if(layouts.arr[i][5] != ""){
					if(layouts.arr[i][6] == ""){
						layouts.arr[i][6] = mix.nSTYLE("id."+name+".layout.sml.css", layouts.arr[i][5]);
						ev.t("layouts.layoutLoad()", 50);
						gonext = false;
						break;
					}else{
						if(!api.checkLoaded(layouts.arr[i][6])){
							ev.t("layouts.layoutLoad()", 50);
							gonext = false;
							break;
						}
					}
				}
				if(layouts.arr[i][7] != ""){
					if(layouts.arr[i][8] == ""){
						layouts.arr[i][8] = mix.nSTYLE("id."+name+".layout.med.css", layouts.arr[i][7]);
						ev.t("layouts.layoutLoad()", 50);
						gonext = false;
						break;
					}else{
						if(!api.checkLoaded(layouts.arr[i][8])){
							ev.t("layouts.layoutLoad()", 50);
							gonext = false;
							break;
						}
					}
				}
				if(layouts.arr[i][9] != ""){
					if(layouts.arr[i][10] == ""){
						layouts.arr[i][10] = mix.nSTYLE("id."+name+".layout.big.css", layouts.arr[i][9]);
						ev.t("layouts.layoutLoad()", 50);
						gonext = false;
						break;
					}else{
						if(!api.checkLoaded(layouts.arr[i][10])){
							ev.t("layouts.layoutLoad()", 50);
							gonext = false;
							break;
						}
					}
				}
				if(layouts.arr[i][11] != ""){
					if(layouts.arr[i][12] == ""){
						layouts.arr[i][12] = mix.nSTYLE("id."+name+".layout.main.css", layouts.arr[i][11]);
						ev.t("layouts.layoutLoad()", 50);
						gonext = false;
						break;
					}else{
						if(!api.checkLoaded(layouts.arr[i][12])){
							ev.t("layouts.layoutLoad()", 50);
							gonext = false;
							break;
						}
					}
				}
			}
		}

		if(gonext){
			ev.t("layouts.evaluator()", 100);
			ev.t("layouts.resizer_true()", 500);
			ldr.status("layouts", "evaled");
		}
	}

	, layoutLoader		: function(){

		ldr.status("layouts", "loading");
		layouts.arr = [];
		var FolLoc = "" + fs.locator("layouts");
		if (fs.exists(FolLoc)) {
			var ff = fs.readDir(FolLoc, false);
			if (ff) {
				for (var i = 0; i < ff.length; i++) {
					var x = fs.turnObj(ff[i]);
					if (x.isFile) {
						var mkarr = function(name: string){
							if(!layouts.arr[name as any]){
								//(js.path, js.name, js.obj, main.path, main.obj, sml.path, sml.obj, med.path, med.obj, big.path, big.obj, main.path, main.obj)
								// 0		1			2		3		4		5			6		7			8		9			10		11			12
								layouts.arr[name as any] = ["","","","","","","","","","","","",""];
							}
						};
						if((x.nlc.substr(x.name.length-3,3) == ".js") &&
								(x.nlc.substr(0,7) == "layout.")){
							var name = x.nlc.substr(7, x.name.length-10);
							mkarr(name);
							layouts.arr[name as any][0] = fs.filePath(x.path);
							layouts.arr[name as any][1] = name;
						}
						if((x.nlc.substr(x.name.length-8,8)==".sml.css") &&
								(x.nlc.substr(0,7)=="layout.")){
							var name = x.nlc.substr(7, x.name.length-15);
							mkarr(name);
							layouts.arr[name as any][5] = fs.filePath(x.path);
							layouts.arr[name as any][6] = "";
						}
						if((x.nlc.substr(x.name.length-8,8)==".med.css") &&
								(x.nlc.substr(0,7)=="layout.")){
							var name = x.nlc.substr(7, x.name.length-15);
							mkarr(name);
							layouts.arr[name as any][7] = fs.filePath(x.path);
							layouts.arr[name as any][8] = "";
						}
						if((x.nlc.substr(x.name.length-8,8)==".big.css") &&
								(x.nlc.substr(0,7)=="layout.")){
							var name = x.nlc.substr(7, x.name.length-15);
							mkarr(name);
							layouts.arr[name as any][9] = fs.filePath(x.path);
							layouts.arr[name as any][10] = "";
						}
						if((x.nlc.substr(x.name.length-9,9)==".main.css") &&
								(x.nlc.substr(0,7)=="layout.")){
							var name = x.nlc.substr(7, x.name.length-16);
							mkarr(name);
							layouts.arr[name as any][11] = fs.filePath(x.path);
							layouts.arr[name as any][12] = "";
						}
					}}
				layouts.selted = layouts.arr["native" as any];
				if(user.layouts){
					for (var li in layouts.arr){
						if(layouts.arr[li][1] == user.layouts){
							layouts.selted = layouts.arr[li]; break;
						}
					}
				}
				ev.t("layouts.layoutLoad()", 100);
			}
		}
	}
};

// era global contract: layout.*.js data files do layouts["native"] = {...},
// era string timers eval "layouts.resizer_true()" etc.
(window as any).layouts = layouts;

}

// skins.ts — typed port of the era app/bin/skins.js (stage 4.6b).
//
// Skins are DATA now: the six era skin.*.js files only carried metadata
// (name/author/link/mail) plus a geometry table (dbh/dbw) and two engine
// constants (num_of_rows/view_wh_pos) — that is the SKINS manifest below.
// The CSS files stay where they always were (app/skins/skin.<name>.css).
//
// Same global, same public surface: window.skins with the arr/selted
// tuples (the settings island reads them), dbh/dbw (fit.js), the metadata
// objects skins[name] (settings "powered by" line), the HTML helpers
// (engine/snk/fns), applyCurentMode (snk F4), skinLoader (kernel boot
// entry) and skinLoad (settings reselect). Gone: the directory scan, the
// per-skin <script> loading and the ev.t polling — the manifest is bundled
// and the selected skin's CSS is one <link>. Era also loaded only the
// selected skin's CSS and never unloaded the previous one on switch (the
// class namespaces don't collide); same here.
//
// A new skin now means: one manifest entry + one CSS file (era discovered
// skin.*.js/skin.*.css by scanning app/skins; the scan went away with the
// script loading).

/* eslint-disable @typescript-eslint/no-explicit-any */

namespace kskn {

declare const user: any;    // bin/user.js (adopted by kbstore)
declare const vars: any;    // bin/kernel.js
declare const objx: any;    // bin/objex.js
declare const fns: any;     // bin/fns.js
declare const ldr: any;     // bin/loader.js

interface SkinGeometry {
	sml: number;
	med: number;
	big: number;
	non: number;
}

interface SkinEntry {
	name: string;       // display name ("Native Skin")
	author: string;
	link: string;
	mail: string;
	numOfRows: number;  // vars.num_of_rows — engine text windowing
	viewWhPos: number;  // vars.view_wh_pos — engine line lookahead
	dbh: { paragraph: SkinGeometry; native: SkinGeometry }; // design height per mode/size
	dbw: { sml: number; med: number; big: number };         // design width per size
}

// the era geometry, verbatim from the six skin.*.js files
const STD_DBH: { paragraph: SkinGeometry; native: SkinGeometry } = {
	paragraph	: { sml: 350, med: 390, big: 430, non: 220 },
	native		: { sml: 280, med: 325, big: 364, non: 150 }
};
const STD_DBW = { sml: 760, med: 760, big: 760 };

const SKINS: { [key: string]: SkinEntry } = {
	native: {
		name: "Native Skin", author: "system went out", link: "", mail: "went.out@gmail.com",
		numOfRows: 5, viewWhPos: 2, dbh: STD_DBH, dbw: STD_DBW
	},
	nativeprettybuttons: {
		name: "Native Pretty Buttons", author: "system went out", link: "", mail: "went.out@gmail.com",
		numOfRows: 5, viewWhPos: 2, dbh: STD_DBH, dbw: STD_DBW
	},
	native_r9: {
		name: "Native 9 rows Skin", author: "system went out", link: "", mail: "went.out@gmail.com",
		numOfRows: 9, viewWhPos: 6,
		dbh: {
			paragraph	: { sml: 430, med: 470, big: 510, non: 300 },
			native		: { sml: 280, med: 325, big: 364, non: 150 }
		},
		dbw: STD_DBW
	},
	pink: {
		name: "Pink Skin", author: "system went out", link: "", mail: "went.out@gmail.com",
		numOfRows: 5, viewWhPos: 2, dbh: STD_DBH, dbw: STD_DBW
	},
	white: {
		name: "White Skin", author: "system went out", link: "", mail: "went.out@gmail.com",
		numOfRows: 5, viewWhPos: 2, dbh: STD_DBH, dbw: STD_DBW
	},
	whiteprettybuttons: {
		name: "White Pretty Buttons", author: "Klavarog", link: "http://klava.org/", mail: "",
		numOfRows: 5, viewWhPos: 2, dbh: STD_DBH, dbw: STD_DBW
	}
};

interface SkinsPublic {
	[key: string]: any; // skins[name] metadata objects (settings island)

	arr: { [key: string]: string[] };
	selted: any;
	dbh: { [mode: string]: SkinGeometry } | null;
	dbw: { [size: string]: number } | null;

	resizer: () => void;
	doSpeed: (str: string) => string;
	doPerc: (str: string) => string;
	doLether: (str: string) => string;
	doRuEn: (str: string) => string;
	nonErr: (str: string) => string;
	estErr: (str: string) => string;
	enlightEnter: () => string | undefined;
	enlightSpace: () => string;
	applyCurentMode: () => void;
	applyCurrentSkin: () => void;
	skinLoad: () => void;
	skinLoader: () => void;
}

const skins: SkinsPublic = {

	  arr				: {}
	, selted			: ""
	, dbh				: null
	, dbw				: null

	, resizer			: function(){
		var sz = user.keybSize;
		var tm = user.TypingMode;

		var dbw = (skins.dbw as any)[sz];
		var dbh = (skins.dbh as any)[tm][sz];
		if(user.keybView == false){
			dbh = (skins.dbh as any)[tm]["non"];
		}
		if((window as any).kbFit){ (window as any).kbFit.apply(); } // Electron: rescale, don't resize

		if(ldr.status("skins") !== "evaled"){
			var wsL = user.wsL;
			var wsT = user.wsT;

			if((user.wsL > (window.screen.availWidth - (dbw + 5))) || (user.wsL < 0)){
				wsL = 50;
			}
			var ht = window.screen.availHeight - (dbh + 10);
			if(ht < 0){
				wsT = 10;
			}else{
				if((wsT > ht) || (wsT < 0)){
					wsT = (window.screen.availHeight - dbh)/2;
				}
			}
			(window as any).moveTo(wsL, wsT);
		}
	}

	, doSpeed			: function(str: string){
		return "<font class = \"" + user.skin + "_speed_bold\">" + str + "</font>";
	}
	, doPerc			: function(str: string){
		return "<font class = \"" + user.skin + "_txt_perc_hover_perc\">" + str + "</font>";
	}
	, doLether			: function(str: string){
		return "<b class = \"" + user.skin + "_Lether\">" + str + "</b>";
	}
	, doRuEn			: function(str: string){
		return "<b class = \"" + user.skin + "_b_RuEn\">" + str + "</b>";
	}
	, nonErr			: function(str: string){
		return "<font class = \"" + user.skin + "_HL_nonErr\">" + str + "</font>";
	}
	, estErr			: function(str: string){
		return "<font class = \"" + user.skin + "_HL_estErr\">" + str + "</font>";
	}
	, enlightEnter		: function(){
		if(user.TypingMode == "native"){ return "<font class = \"" + user.skin + "_HL_EnterN\">¶</font>";	}
		if(user.TypingMode == "paragraph"){ return "<font class = \"" + user.skin + "_HL_Enter\">&crarr;</font>"; }
		return undefined;
	}
	, enlightSpace		: function(){
		return "<font class = \"" + user.skin + "_HL_spaceErr\">_</font>";
	}

	, applyCurentMode			: function(){
		objx.messager.m.setAttribute("tm", user.TypingMode);
		objx.keyboard.m.setAttribute("tm", user.TypingMode);
		if(user.TypingMode == "native"){
			objx.paragrh.hide();
			objx.to_type.show();
			objx.already.show();
		}else if(user.TypingMode == "paragraph"){
			objx.to_type.hide();
			objx.already.hide();
			objx.paragrh.show();
		}
		// Stupid IE
		objx.keyboard.Fhide();
		objx.keyboard.Fshow();
		// can't do anything with messager...
		// Stupid IE
		try{
			if(ldr.status("skins") == "evaled"){
				skins.resizer();
			}
		}catch(e){}
	}
	, applyCurrentSkin			: function(){
		var name = skins.selted[1];
		var nameU = name + "_";

		// common
		document.body.className = nameU + "bdy";
		objx.full.cn(nameU + "full");

		objx.content.cn(nameU + "content");
		objx.to_type.cn(nameU + "to_type");
		objx.already.cn(nameU + "already");

		objx.paragrh.cn(nameU + "paragrh");

		objx.paragrh.hide();
		objx.to_type.hide();
		objx.already.hide();

		skins.applyCurentMode();

		objx.messager.cn(nameU + "messager");
		objx.keyboard.cn(nameU + "keyboard");

		objx.time.cn(nameU + "time");

		objx.map_name.cn(nameU + "map_name");
		objx.next_key.cn(nameU + "next_key");

		objx.txt_perc.cn(nameU + "txt_perc");
		objx.txt_perc.hover = false;
		objx.err_perc.cn(nameU + "err_perc");
		objx.err_perc.hover = false;

		objx.speed.cn(nameU + "speed");
		objx.speed.hover = false;

		objx.timer.cn(nameU + "timer");
		objx.timer.hover = false;
		objx.timer.In(fns.time_HMS(vars.timerCnt).str + " :: " + vars.cntSess);

		objx.prev.cn(nameU + "prev");
		objx.lang.cn(nameU + "lang");

		// buttons
		objx.zoomout_btn.cn(nameU + "zoomout_btn");
		objx.zoomin_btn.cn(nameU + "zoomin_btn");
		objx.help_btn.cn(nameU + "help_btn");
		objx.lang_btn.cn(nameU + "lang_btn");
		objx.type_btn.cn(nameU + "type_btn");
		objx.mode_btn.cn(nameU + "mode_btn");

		objx.sets_btn.cn(nameU + "sets_btn");
		objx.libr_btn.cn(nameU + "libr_btn");

		// era skins[name].evaluator(): the geometry table + engine constants
		var meta = SKINS[name];
		skins.dbh = meta.dbh;
		skins.dbw = meta.dbw;
		vars.num_of_rows = meta.numOfRows;
		vars.view_wh_pos = meta.viewWhPos;

		skins.resizer();

		ldr.status("skins", "evaled");
	}

	, skinLoad			: function(){
		// era: sequential script/link injection with 50ms polling; only the
		// SELECTED skin's CSS was ever loaded, and applyCurrentSkin ran even
		// when the sheet was not confirmed loaded. Now: one <link> for the
		// selected skin (once per skin — a repeated switch reuses it), then
		// apply, unconditionally.
		var sel = skins.selted;
		if(!sel || !sel[1]){ return; }
		if(sel[4] === ""){
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.type = "text/css";
			link.id = "id." + sel[1] + "skin.css";
			link.href = "skins/skin." + sel[1] + ".css";
			document.getElementsByTagName("head")[0].appendChild(link);
			sel[4] = link.id;
		}
		ldr.loadString_blink_tf = true; // stop blinking "Loading..."
		skins.applyCurrentSkin();
	}

	, skinLoader		: function(){
		ldr.status("skins", "loading");
		skins.arr = {};
		// era scanned app/skins for skin.*.js/css pairs; the manifest is the
		// same list, bundled. Tuple shape kept for the settings island:
		// (js.path, name, js.obj, css.path, css.obj) — js legs stay "bundled".
		for(var key in SKINS){
			var meta = SKINS[key];
			skins.arr[key] = ["bundled", key, "bundled", "skins/skin." + key + ".css", ""];
			skins[key] = { name: meta.name, author: meta.author, link: meta.link, mail: meta.mail };
		}
		skins.selted = skins.arr["native"];
		if(user.skin){
			for(var i in skins.arr){
				if(skins.arr[i][1] == user.skin){
					skins.selted = skins.arr[i];
					break;
				}
			}
		}
		skins.skinLoad();
	}

};

(window as any).skins = skins;

}

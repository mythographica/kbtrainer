// ----------------------------
//* Mix
(function(){

	mix.init = false;

	// jQuery 1.4.2 replacement: the dialogs' only live jQuery usage is
	// $("label[for='X']").html(str) — define $ with exactly that surface
	// (querySelectorAll + innerHTML on every match). Guarded: never
	// clobber a real jQuery if one ever appears.
	if(typeof(window.$) == "undefined"){
		window.$ = function(sel){
			var list = document.querySelectorAll(sel);
			return {
				html : function(s){
					for(var i = 0; i < list.length; i++){ list[i].innerHTML = s; }
				}
			};
		};
	}

	var ag = arguments;

	var pfa = function(el, tf){ //Prepare Function Arguments
		if(tf){
			var ra = el;
			if((el == "i") || (el == "")){ ra = ["id"]; }
			if (el == "p") { ra = ["id", "par"]; }
		}else{
			var ra = [];
			// !!!
			// if (el[0] == "p") { ra = ["par"]; }
			// in FF this construction realy returns p
			// but in IE it turns undefined.
			ra = [];

			if(typeof(el) == "string"){
				if (el == "p") { ra = ["par"]; }
			}else if(typeof(el) == "array"){
				if (el[0] == "p") { ra = ["par"]; }
				if (el[1] !== undefined) { if(ra.length > 0){ ra = [ra, el[1]]; }else{ ra = el[1]; }}
			}
		// if (el[0] == "p") { ra = ["par"]; }
		// if (el[1]) { if(ra.length > 0){ ra = [ra, el[1]]; }else{ ra = el[1]; }}
		}
		return ra;
	}

	var pfb = function(el){ //Prepare Function Body
		var str = el[1].replace(/_tp/g,"_i _m._a_p _e _r _m._a; }")
			.replace(/_ts/g,"_i _s._a_p _e _r _s._a; }")
			.replace(/_tr/g,"_i _s._a_p _e _r _I_s._a); }")
			.replace(/_i/g,"if (par !== undefined){ ")
			.replace(/_I/g," parseInt(")
			.replace(/_e/g," }else{ ")
			.replace(/_r/g," return ")
			.replace(/_p/g," = par; ")
			.replace(/_m\./g,"mix(id).")
			.replace(/_s\./g,"mix.s(id).");
		if(el[2]){ str = str.replace(/_a/g, el[2]); }
		return str;
	}

	mix.ex = function (id) {
		this.id = id;
		this.m = this.mix = this.obj = this.Obj = this.ObJ = this.OBJ = mix(id);
		this.stl = mix.s(this.id);

		// native fade wrapper, see jq() below
		this.q = this.jq();
	}

	mix.ex.prototype = {
	//alert([obj]who());
	  who	: function(){ return "id of this class:  " + this.id; }
		//[obj]tell());
		, tell	: function(){ alert(this.who()); }
		// native fades (stage 4.6): jQuery 1.4.2 left the building; q keeps
		// the exact method surface the app used — fadeIn/fadeTo/hide/html/after
		, q		: false
		, qid	: false
		, jq	: function(){
			try{
				var el = this.m;
				var fade = function(dur, to, cb){
					el.style.transition = "opacity " + dur + "ms";
					void el.offsetHeight; // reflow: the transition must see the start value
					el.style.opacity = to;
					if(cb){
						var done = false;
						var fin = function(){
							if(done){ return; }
							done = true;
							el.removeEventListener("transitionend", fin);
							cb();
						};
						el.addEventListener("transitionend", fin);
						window.setTimeout(fin, dur + 50); // backstop if the event is lost
					}
				};
				this.q = {
					fadeIn	: function(dur, cb){
						if(el.style.display === "none"){ el.style.opacity = 0; el.style.display = ""; }
						fade(dur || 400, 1, cb);
					}
					, fadeTo	: function(dur, op){ fade(dur || 400, op); }
					, hide		: function(){ el.style.display = "none"; }
					, html		: function(s){ if(s === undefined){ return el.innerHTML; } el.innerHTML = s; }
					// jQuery .after(html): insert the markup as the next
					// sibling — the era dialog pages append their <br />s
					// this way
					, after		: function(s){ el.insertAdjacentHTML("afterend", s); }
				};
				this.qid = "#" + this.id;
			}catch(e){ }
			return this.q;
		}
	}

	for(var i in ag[0]){
		(function(){
			try{
				var a = ag[0][i];
				var pf_T = pfa(a[0], true);
				var pf_F = pfa(a[0], false);
				var pf_B = pfb(a);
				mix[i] = new Function(pf_T, pf_B);
				mix.ex.prototype[i] = new Function(pf_F, ""+pf_B.replace(/\(id\)/g, "(this.id)"));
			}catch(e){
				alert(e);
				alert(""+i+"\n"+pf_T+"\n"+pf_F+"\n"+pf_B);
			}finally{}
		})();
	};

	for(var i in ag[1]){ mix[i] = ag[1][i]; };

})(
	{
		  s:  ["","_r _m.style;"]
		, cn: ["p", "_tp", "className"]
		, Pa: ["", "if(_m.tagName == \"DIV\"){ _s.position = \"absolute\"; _e alert(\"mix.Pa is only for DIV\"); }"]
		// ----------------------------
		//* Show / Hide
		, hide:  ["", "_s.visibility = mix.hid;"]
		, show:  ["", "_s.visibility = mix.vis;"]
		, Dhide: ["", "_s.display = mix.Dhid;"]
		, Dshow: ["", "_s.display = mix.Dvis;"]
		, Fhide: ["", "mix.hide(id); mix.Dhide(id);"]
		, Fshow: ["", "mix.show(id); mix.Dshow(id);"]
		, hish:  ["", "if(_s.visibility == mix.vis){ _r true _e _r false; }"]
		, Dhish: ["", "if(_s.display == mix.Dvis){ _r true _e _r false; }"]
		// ----------------------------
		//* style Functions
		, T:  ["p", "_tr", "top"]
		, L:  ["p", "_tr", "left"]
		, W:  ["p", "_tr", "width"]
		, H:  ["p", "_tr", "height"]
		, B:  ["p", "_ts", "border"]
		, Bg: ["p", "_ts", "background"]
		, C:  ["p", "_ts", "color"]
		, FF: ["p", "_ts", "fontFamily"]
		, FW: ["p", "_ts", "fontWeight"]
		, FS: ["p", "_ts", "fontSize"]
		, PF: ["p", "_ts", "padding"]
		, MF: ["p", "_ts", "margin"]
		, Z:  ["p", "_ts", "zIndex"]
		, P:  ["p", "_ts", "position"]
		, Ov: ["p", "_ts", "overflow"]
		, Fill: [["id", ["T", "L", "W", "H"]], "\
		if (T){ mix.T(id, T); }; if (L){ mix.L(id, L); };\
		if (W){ mix.W(id, W); }; if (H){ mix.H(id, H); }"]
		// ----------------------------
		//* Inner
		, In:  ["p", "_tp", "innerHTML"]
		, InP: ["p", "_i _m.innerHTML += par; }"]
		, InT: ["p", "_tp", ((navigator.appName.indexOf("MSIE") > 0) ? "innerText" : "textContent")] // doesn't work in FireFox?
	}
	,{
		  makeEx : function(id){ // for test use [your_obj] = mix.makeEx(id) and then [your_obj].ex.aler()
			mix(id).ex = new mix.ex(id);
			return mix(id);
		}

		, addObj : function(id, parnt, tag, attrs){
			var obj, ObJ;
			if( id == undefined ){ alert("Can't create ObJ with empty ID."); }
			else{
				if( tag == undefined ){ tag = "DIV"; }
				if( (tag != "SCRIPT" ) && ( tag != "IFRAME" ) ){
					obj = document.createElement(tag);
					obj.id = id;
					if(attrs !== undefined){
						if(typeof(attrs) == "object"){
							for(var i in attrs){
								obj[i] = attrs[i];
							}
						}
					}
					if(parnt){ mix(parnt).appendChild(obj); }
					else{ document.body.appendChild(obj); }
					ObJ = new mix.ex(obj.id);
					return ObJ;
				}else{ alert("for IFRAME or SCRIPT creation use mix.nIFRAME or mix.nSCRIPT."); }
			}}


		, nIFRAME : function(id, parnt, frBorder){
			var ObJ;
			ObJ = document.createElement("IFRAME");
			if(frBorder == 1){ ObJ.frameBorder = "1"; }
			else{ ObJ.frameBorder = "0"; }
			ObJ.id = id;
			if(parnt){ mix(parnt).appendChild(ObJ); }
			else{ document.body.appendChild(ObJ); }
			return ObJ;
		}


		, nSCRIPT : function(id, src, parnt){
			var ObJ;
			ObJ = document.createElement("SCRIPT");
			ObJ.id = id;
			ObJ.src = src;
			// Electron: emulate IE's script readyState for api.checkLoaded
			ObJ.readyState = "loading";
			ObJ.onload = function(){ ObJ.readyState = "complete"; };
			ObJ.onerror = function(){ ObJ.readyState = "complete"; };
			//alert(ObJ.parentNode == null);
			if(parnt){ mix(parnt).appendChild(ObJ); }
			else{ document.body.appendChild(ObJ); }
			//alert(ObJ.parentNode == null);
			return ObJ;
		}

		, nSTYLE : function(id, href){
			var ObJ;
			var ObJ = document.createElement("LINK");
			ObJ.rel = "stylesheet";
			ObJ.type = "text/css";
			ObJ.media = "screen";
			ObJ.id = id;
			//ObJ.title = "styleSheet_" + id; // can't apply buttons with this, bug
			// Electron: emulate IE's link readyState for api.checkLoaded
			ObJ.readyState = "loading";
			ObJ.onload = function(){ ObJ.readyState = "complete"; };
			ObJ.onerror = function(){ ObJ.readyState = "complete"; };
			ObJ.href = href;
			document.getElementsByTagName("head")[0].appendChild(ObJ);
			//document.body.appendChild(ObJ);
			return ObJ;
		}

		, vis : "visible"
		, hid : "hidden"
		, Dvis : "block"
		, Dhid : "none"

		, init : true

	}
	//all next becomes a Global variables
	, px = function(par){ return "" + par + "px"; }
	, mix = function(id){ return document.getElementById(id); }
	// next is a tester function, if works -- object is properly created
	//, (function(){ if(true){ alert("this is a tester!"); }})()
);

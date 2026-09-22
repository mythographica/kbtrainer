(function(){
// window.showModalDialog replacement for Electron.
// The HTA version opened bin/_mode.htm, bin/_lib.htm and bin/_sets.htm as
// modal windows sharing live JS objects through window.dialogArguments.
// Here the dialog page takes over the whole main window: the window is
// resized to the dialog's design dimensions (from the original features
// string), the dialog is shown in a full-size overlay iframe with no
// scrollbars, and the previous window size is restored on close.
// The iframe's document reads the same object references from
// window.__kbDialog.args (see bin/kbDialogChild.js), so mutations the dialog
// makes (user settings, selected mode, ...) are instantly visible to the
// main window, exactly like with showModalDialog.

	var kbState = null;
	var kbState_ro = null;

	// main process turns the window's own (x) into "close the dialog"
	try{
		if(window.kbOnCloseDialog){
			window.kbOnCloseDialog(function(){ window.__kbDialog.close(); });
		}
	}catch(e){}

	window.__kbDialog = {
	  args		: null
		, close		: function(){
			if(!kbState){ return; }
			var st = kbState;
			kbState = null;
			try{ window.kbDialogNotify(false); }catch(e){}
			try{ if(kbState_ro){ kbState_ro.disconnect(); kbState_ro = null; } }catch(e){}
			window.__kbDialog.args = null;
			try{ document.body.removeChild(st.wrap); }catch(e){}
			// restore the window size the main UI had before the dialog
			try{
				if(st.prevSize && st.prevSize[0] > 0){
					window.resizeTo(st.prevSize[0], st.prevSize[1]);
				}
			}catch(e){}
			try{ window.focus(); }catch(e){}
			if(st.onClose){ st.onClose(); }
		}
		// Ctrl+/- while a dialog is open (main process routes them here):
		// scale the dialog's CONTENT — fonts and all — around its design
		// dims, then resize the window to the content's both dimensions.
		, zoom		: function(grow){
			if(!kbState || !kbState.refit){ return; }
			var st = kbState;
			var z = st.zoom * (grow ? 1.1 : 1 / 1.1);
			// keep the whole dialog reachable: never zoom past the work area
			try{
				var aw = window.screen.availWidth - 24, ah = window.screen.availHeight - 24;
				if(aw > 0 && ah > 0){ z = Math.min(z, aw / st.design.w, ah / st.design.h); }
			}catch(e){}
			z = Math.max(0.5, Math.min(z, 3));
			st.zoom = Math.round(z * 100) / 100;
			try{
				var doc = st.fr.contentDocument;
				if(doc && doc.body){ doc.body.style.zoom = st.zoom; }
			}catch(e){}
			st.refit(true);
		}
	};

	// kbDialogOpen(url, args, features, onClose)
	// features keeps the original showModalDialog string; dialogWidth and
	// dialogHeight become the new (temporary) window content size.
	window.kbDialogOpen = function(url, args, features, onClose){
		if(kbState){ return; } // one modal dialog at a time, like showModalDialog
		if(typeof features == "function"){ onClose = features; features = ""; }

		var w = 620, h = 420;
		try{
			var mw = /dialogWidth\s*:\s*([0-9]+)px/i.exec(features);
			var mh = /dialogHeight\s*:\s*([0-9]+)px/i.exec(features);
			if(mw){ w = parseInt(mw[1], 10); }
			if(mh){ h = parseInt(mh[1], 10); }
		}catch(e){}

		// dialogs used to be fixed-size HTA windows; here they scale with the
		// user's DELIBERATE zoom only (Ctrl+/- steps on the main UI), never
		// with the passive boot fit — on a big screen that fit is ~2x and it
		// used to blow every dialog up to near-full-screen width.
		var zoom = 1;
		try{
			if(window.kbFit && window.kbFit.zoomScale > 0){ zoom = window.kbFit.zoomScale; }
		}catch(e){}
		// ...but never larger than the screen: shrink the zoom so the dialog
		// fits the work area with a margin. The main process clamps resizeTo
		// anyway, and a clamped window is exactly what shows scrollbars.
		try{
			var aw = window.screen.availWidth - 24, ah = window.screen.availHeight - 24;
			if(aw > 0 && ah > 0){ zoom = Math.min(zoom, aw / w, ah / h); }
		}catch(e){}
		var designW = w, designH = h;   // era design dims, kept for re-zoom
		w = Math.round(w * zoom);
		h = Math.round(h * zoom);

		window.__kbDialog.args = args;

		var prevSize = null;
		try{ prevSize = window.kbWinGetSize ? window.kbWinGetSize() : null; }catch(e){}

		var wrap = document.createElement("div");
		wrap.style.position = "fixed";
		wrap.style.left = "0px";
		wrap.style.top = "0px";
		wrap.style.width = "100%";
		wrap.style.height = "100%";
		wrap.style.zIndex = "99999";
		wrap.style.backgroundColor = "#ffffff";
		wrap.style.overflow = "hidden";

		var fr = document.createElement("iframe");
		fr.src = url;
		fr.style.display = "block";
		fr.style.width = "100%";
		fr.style.height = "100%";
		fr.style.border = "0px none";
		fr.setAttribute("frameborder", "0");

		// the child pages were designed for 2008 font metrics; if the content
		// renders taller than the design height, grow the window to fit so no
		// scrollbar ever appears (grow-only; the main process clamps to the
		// work area). Some dialogs keep growing after load (the settings island
		// re-skins itself asynchronously), so size changes are watched with a
		// ResizeObserver; the beats stay as a backstop for scrollHeight-only
		// overflow, which RO does not fire on. An explicit re-zoom (Ctrl+/-)
		// passes exact=true: both window dims follow the content, shrinking
		// included.
		var fitDialog = function(exact){
			try{
				var doc = fr.contentDocument;
				if(!doc){ return; }
				var cw = Math.max(doc.body ? doc.body.scrollWidth : 0, doc.documentElement ? doc.documentElement.scrollWidth : 0);
				var ch = Math.max(doc.body ? doc.body.scrollHeight : 0, doc.documentElement ? doc.documentElement.scrollHeight : 0);
				if(exact || cw > w || ch > h){
					w = exact ? cw : Math.max(w, cw);
					h = exact ? ch : Math.max(h, ch);
					window.resizeTo(w, h);
				}
			}catch(e){}
		};
		fr.onload = function(){
			try{
				var zdoc = fr.contentDocument;
				if(zdoc && zdoc.body){ zdoc.body.style.zoom = zoom; }
			}catch(e){}
			fitDialog();
			try{
				var RO = fr.contentWindow.ResizeObserver;
				if(RO){
					kbState_ro = new RO(function(){ fitDialog(); });
					var doc0 = fr.contentDocument;
					if(doc0.body){ kbState_ro.observe(doc0.body); }
					if(doc0.documentElement){ kbState_ro.observe(doc0.documentElement); }
				}
			}catch(e){}
			var beats = 0;
			var beatTimer = window.setInterval(function(){
				if(!kbState){ window.clearInterval(beatTimer); return; }
				fitDialog();
				if(++beats > 20){ window.clearInterval(beatTimer); }
			}, 300);
		};

		wrap.appendChild(fr);
		document.body.appendChild(wrap);

		// the dialog becomes the window: no overlay, no scrollbars
		window.resizeTo(w, h);

		kbState = { wrap: wrap, onClose: onClose, prevSize: prevSize, zoom: zoom, design: { w: designW, h: designH }, fr: fr, refit: fitDialog };
		try{ window.kbDialogNotify(true); }catch(e){}
		try{ fr.focus(); }catch(e){}
	};

})();

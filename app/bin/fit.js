(function(){
// Scale-to-fit for the resizable Electron window.
// The skins lay everything out in a fixed design space (skins.dbw x
// skins.dbh, e.g. 760x280 for native/sml) with absolute px coordinates,
// and the HTA used to resize the window to those exact dimensions.
// Instead of rewriting every skin to fluid CSS, the whole design canvas
// (#id.full, already position:absolute) is scaled to the window content
// size with a CSS transform. Text and borders scale crisply, every skin
// works unchanged, and no scrollbars ever appear (transforms do not
// affect layout overflow).
	var bootSized = false;

	window.kbFit = {
	  apply		: function(){
			try{
				if(typeof skins == "undefined" || !skins.dbw || !skins.dbh){ return; }
				if(typeof user == "undefined" || typeof objx == "undefined"){ return; }
				var el = document.getElementById("id.full");
				if(!el){ return; }

				var sz = user.keybSize;
				var tm = user.TypingMode;
				if(!skins.dbw[sz] || !skins.dbh[tm]){ return; }
				var dw = skins.dbw[sz];
				var dh = skins.dbh[tm][sz];
				if(!user.keybView){ dh = skins.dbh[tm]["non"]; }
				if(!dw || !dh){ return; }

				var iw = window.innerWidth;
				var ih = window.innerHeight;
				if(iw <= 0 || ih <= 0){ return; }

				if(!bootSized){
					bootSized = true;
					if(iw < dw * 0.9 || ih < dh * 0.9){
					// one-time: grow the tiny boot window (270x75) to the
					// design size; the resize event re-triggers apply()
						window.resizeTo(dw, dh);
						return;
					}
				}

				if(!window.kblib || !window.kblib.fitScale){ return; }
				var fit = window.kblib.fitScale(iw, ih, dw, dh); // src/lib/fit.ts (vitest-covered)
				var s = fit.s, ox = fit.ox, oy = fit.oy;

				el.style.width = dw + "px";
				el.style.height = dh + "px";
				el.style.left = ox + "px";
				el.style.top = oy + "px";
				el.style.transformOrigin = "0 0";
				el.style.transform = fit.transform;
				// publish the live fit factor. Dialog overlays must NOT inherit
				// it wholesale: on a big screen the boot fit alone is ~2x, which
				// used to blow dialog windows up to near-full-screen width.
				// kbDialog.js scales its design dims by zoomScale only — the
				// user's deliberate Ctrl+/- zoom on top of the boot fit.
				if(!window.kbFit.bootScale){ window.kbFit.bootScale = s; }
				window.kbFit.scale = s;
				window.kbFit.zoomScale = s / window.kbFit.bootScale;
				document.body.style.overflow = "hidden";
			}catch(e){}
		}
	};

	window.addEventListener("resize", function(){ window.kbFit.apply(); });
	// skins evaluate and layouts resize during boot; refit on a slow beat
	// until the app is up (cheap no-op afterwards)
	var bootTicks = 0;
	var bootTimer = window.setInterval(function(){
		window.kbFit.apply();
		if(++bootTicks > 40){ window.clearInterval(bootTimer); }
	}, 250);

})();

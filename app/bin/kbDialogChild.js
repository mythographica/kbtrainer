(function(){
// Shim for the dialog pages (bin/_mode.htm, bin/_lib.htm, bin/_sets.htm).
// Must be the FIRST script of the page. It recreates the two things those
// pages expect from IE's showModalDialog:
//   window.dialogArguments -- the live object passed by the main window
//   window.close()         -- closes the modal overlay in the parent
// The pages also write results back through window.onbeforeunload; iframe
// teardown fires no events, so close() runs that handler manually first.
	if(window.parent && window.parent.__kbDialog){
		window.dialogArguments = window.parent.__kbDialog.args || {};
		// diagnostics: era pages fail silently inside the overlay iframe;
		// keep the last script error inspectable (the smoke reports it)
		window.onerror = function(msg, src, line, col){
			try{ window.__kbDlgErr = String(msg) + " @" + String(src).split("/").pop() + ":" + line + ":" + col; }catch(e){}
		};
		window.close = function(){
			try{
				if(window.onbeforeunload){ window.onbeforeunload(); }
			}catch(e){}
			window.parent.__kbDialog.close();
		};
	}
})();

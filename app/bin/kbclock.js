/* Top bar clock: the chrome markup lives statically in kb.html (the kb.hta
   shape); this stage — loaded by the "topbar" loader
   entry between "functions" and "objects", so fns exists and objex.js
   still finds every node already in the DOM — only starts the wall clock:
   fns.time() with nbsp-filled spaces (the era snk.time format), once a
   second into id.time. */
try{

	var kbClock = function(){
		var el = document.getElementById("id.time");
		if(!el){ return; }
		var tick = function(){
			el.innerHTML = fns.time().replace(/ /g, "&nbsp;");
		};
		tick();
		window.setInterval(tick, 1000);
	};

	kbClock();

}catch(e){
	alert(e);
}finally{}

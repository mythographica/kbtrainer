kbEscEr = function(event){
	if((event.keyCode == 27) && !kbEscEr.cancel){ window.close(); }
	kbEscEr.cancel = false;
}
kbEscEr.cancel = false;

ev.WinEvent("onkeydown", "kbEscEr");

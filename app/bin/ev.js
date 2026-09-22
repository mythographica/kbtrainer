(function(){
	ev = {
	  init: false

		, t: function(fnm, tm){
			window.setTimeout(fnm, tm);
		}

		, i: function(fnm, tm){
			return window.setInterval(fnm, tm);
		}

		, RA: function(fnm){
			return new Function("evt", ""+fnm+"(evt);");
		}

		, WinEvent: function(evWereAdd, fnToAdd){
			if(ev.WinEvent[evWereAdd]){
				ev.WinEvent[evWereAdd][fnToAdd] = ev.RA(fnToAdd);
			}else{
				document.body[evWereAdd] = function(){
					for(var i in ev.WinEvent[evWereAdd]){
						try{
							ev.WinEvent[evWereAdd][i](event);
						}catch(e){ /* document.title = e; */ }finally{}
					}
				}
				ev.WinEvent[evWereAdd] = {};
				ev.WinEvent[evWereAdd][fnToAdd] = ev.RA(fnToAdd);
			}
		}
		, WinEventDelete: function(evWereDelete, fnForDelete){
			try{
				var ef = ev.WinEvent[evWereDelete];
				if(ef[fnForDelete] !== undefined){ delete ef[fnForDelete]; }
			}catch(e){ }
		}
		, WinEventReplace: function(evWereRep, fnForRep, fnToRep){
			try{
				ev.WinEventDelete(evWereRep, fnForRep);
				ev.WinEvent(evWereRep, fnToRep);
			}catch(e){ }
		}
	}
	ev.init = true;

})();

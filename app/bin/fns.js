//ldr.ll("loading", "FNS", "", "");

//alert(kb.map.uk.shback[32]);

fns = {
	  time_HMS		: function(par){
		// pure core: src/lib/stats.ts (vitest-covered); the strings.nt
		// label lookup stays era-side, read at call time
		return window.kblib.timeHMS(par, strings.nt);
	}
	, lz 			: function(str){ // leading zero
		return window.kblib.lz(str); // src/lib/stats.ts (vitest-covered)
	}
	, time			: function(){

		var mth = function(par){ // month
			var arr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			return arr[par];
		}
		var dow = function(par){ // day of week
			var arr = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
			return arr[par];
		}
		var dt = new Date();
		var yy = new String(dt.getFullYear());
		var mt = mth(dt.getMonth());
		var da = fns.lz(new String(dt.getDate()));
		var dw = dow(dt.getDay());
		var hh = fns.lz(new String(dt.getHours()));
		var mm = fns.lz(new String(dt.getMinutes()));
		var ss = fns.lz(new String(dt.getSeconds()));
		var tm = "" + yy + " " + mt + " " + da + " " + dw + "  " + hh + ":" + mm + ":" + ss;
		return tm;
	}
	, cancl			: function(evt){ return false; }
	, count_perc	: function(parCh, parZn){
		// pure core: src/lib/stats.ts (vitest-covered); strings.division
		// and the skins.doPerc hook stay era-side
		var divs = ".";
		if(strings.division !== undefined){
			divs = strings.division;
		}
		var str = window.kblib.countPerc(parCh, parZn, divs);
		if(skins.doPerc !== undefined){
			str = skins.doPerc(str);
		}
		return str;
	}
	, lesson_load			: function(){
		var l = user.LessonNum;
		var klm = l[0];
		var klb = l[1];
		var kll = l[2];
		var currLess = lessons.arr[klm][klb].les[l[2]];
		vars.strArr = { name : currLess.name,  size : currLess.str.length,  data : currLess.str,  pos : 0, err : "" };
		//for (var i in lessons.arr[klm][klb].les){ }
	}
	, book_load			: function(){
		try{
			var data, autor, book, size, pos, path, err;
			err = "";

			var str = new String();
			var books = api.books(true);
			if(books.length > 0){
				if(user.CurrentBook != ""){
					if(fs.exists(user.CurrentBook)){
						var f = fs.turnObj(fs.open(user.CurrentBook));
						if(f.isFile){
							var str = fs.readFileToString(f.path, "UTF-8");
							if(str){
								try{
									var str = str.split("\n");
									autor	= str[0];
									book	= str[1];
									pos		= parseInt(str[2]);
									data	= str[3];
									size = data.length;
									vars.bookWasRead = true;
								}catch(e){ err = "Unexpected error. Can't read book."; }
							}else{
								err = "Unexpected error. Can't read book.";
							}
						}else{
							err = "Unexpected error. Book file does not exists.";
						}
					}else{ err = strings.s15; }
				}else{ err = strings.s9; }
			}else{
				err = strings.s10;
			}
			if(vars.bookWasRead == true){
				vars.strArr = { size : size, data : data, autor : autor, book : book, pos : pos, path : user.CurrentBook, err : err };
			}else{
				vars.strArr = { size : 0, data : "", autor : "", book : "", pos : -1, path : user.CurrentBook, err : err };
			}
		}catch(e){ alert("mmm"+e); }
	}

}

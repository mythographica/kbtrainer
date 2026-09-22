try{
	var lessons = {
		arr 			: {}
		, lessonChecker	: function(){
			var needIteration = false;

			for(var i in lessons.arr){
				for(var j in lessons.arr[i]){
					//document.title = ""+lessons.arr[i][j].obj.id+" "+api.checkLoaded(lessons.arr[i][j].obj)
					if(api.checkLoaded(lessons.arr[i][j].obj)){
						try{
							lessons.arr[i][j].evaluator();
							if(lessons.arr[i][j].completed == false){
								lessons.arr[i][j].completTimes++;
								if(lessons.arr[i][j].completTimes < 4){
									needIteration = true;
								}
							}
						}catch(e){
							needIteration = true;
						}
					}else{
						needIteration = true;
					}
				}
			}
			if(needIteration){
				ev.t("lessons.lessonChecker()", 20);
			}else{
				var cc = lessons.arr;
				lessons.arr = new Array();
				for(var i in cc){
					lessons.arr[i] = [];
					for(var j in cc[i]){
						if(cc[i][j].completed){
							lessons.arr[i][j] = {
						  path : cc[i][j].path
								, obj  : cc[i][j].obj
								, name : cc[i][j].name
								, les  : cc[i][j].les
							};
						}
					}}
				ldr.status("lessons", "evaled");
			}
		}
		, lessonsLoader	: function(){
			ldr.status("lessons", "loading");
			var FolLoc = "" + fs.locator("lessons");
			if (fs.exists(FolLoc)) {
				var ff = fs.readDir(FolLoc, false);
				if (ff) {
					for (var i = 0; i < ff.length; i++) {
						var x = fs.turnObj(ff[i]);
						if (x.isFile) {
							var sstr1 = x.nlc.substr(x.name.length-3,3);
							var sstr2 = x.nlc.substr(0,8);
							if((sstr1 == ".js") && (sstr2=="lessons.")){
								var name = x.nlc.substr(8, x.name.length-11).split(".");
								var found = false;
								for(var j in kb.map){
									if(j == name[1]){
										var found = true;
										break;
									}
								}
								if(found){
									if(!lessons.arr[name[1]]){
										lessons.arr[name[1]] = {};
									}
									if(!lessons.arr[name[1]][name[0]]){
										lessons.arr[name[1]][name[0]] = {
								  path			: x.path
											, completed		: false
											, completTimes	: 0
										};
										lessons.arr[name[1]][name[0]].obj = mix.nSCRIPT("less_id_"+name[1]+"."+name[0], x.filePath)
									}
								}
							}
						}}
				}
			}
			ev.t("lessons.lessonChecker()", 50);
		}
	}
}catch(e){
	alert(e);
}finally{}

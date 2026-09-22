// all operations with user variables &
try{

	user = {
	  wsT						: 200
		, wsL						: 50
		, cntFull					: 0 // how much symbols was typed at all after installation of kbTrainer
		, skin						: "native"
		, layouts					: "native"
		, maps						: ["ru", "en"]
		, currentMap				: strings.locale
		, mapChanger				: [0, 1, 1]
		, LessonsMode				: "lesson" // can be:	lesson | vocabulary | book
		, LessonNum					: [strings.locale, "base0", 0]
		, errMode					: true
		, shiftControl				: false
		, keybView					: true
		, keybSize					: "sml"

		, hider						: true
		, hiderInterval				: 200
		, ErrAlwaysCount			: false
		, oneErrOnly				: true
		, spaceInvert				: false // means to enlight other hand or current hand for space pressing
		, spaceIsShiftSensentive	: true
		, selectedMaps				: ["ru.standard", "en.standard"]
		, skipNonTypedCharacters	: false
		, hideStatsOnPause			: false

		, Sound						: true
		, SoundVolume				: 50

		, CurrentBook				: ""

		, TypingMode				: "native" // can be:	native | paragraph // much more farther maybe I will present page mode

		, mda						: false // user settings complete, we May Do Application

		, save 						: function(){
		// !!!********** USER SAVING !!! !!! Chek IF user have no uncompleted lessons -- than delete ...
			try{
				with(user){
					pf("wsT", wsT);
					pf("wsL", wsL);
					pf("cntFull", cntFull);
					pf("skin", skin);
					pf("layouts", layouts);
					pf("maps", "" + maps[0] + "," + maps[1]);
					pf("currentMap", currentMap);
					pf("mapChanger", "" + mapChanger[0] + "," + mapChanger[1] + "," + mapChanger[2]);
					pf("LessonsMode", LessonsMode);
					pf("LessonNum", "" + LessonNum[0] + "," + LessonNum[1] + "," + LessonNum[2]);
					pf("errMode", errMode);
					pf("shiftControl", shiftControl);
					pf("keybView", keybView);
					pf("keybSize", keybSize);

					pf("hider", hider);
					pf("hiderInterval", hiderInterval);
					pf("ErrAlwaysCount", ErrAlwaysCount);
					pf("oneErrOnly", oneErrOnly);
					pf("spaceInvert", spaceInvert);
					pf("spaceIsShiftSensentive", spaceIsShiftSensentive);
					pf("selectedMaps", "" + selectedMaps[0] + "," + selectedMaps[1]);
					pf("skipNonTypedCharacters", skipNonTypedCharacters);
					pf("hideStatsOnPause", hideStatsOnPause);

					pf("Sound", Sound);
					pf("SoundVolume", SoundVolume);

					pf("CurrentBook", CurrentBook);

					pf("TypingMode", TypingMode);
				}
				pf("PrefsCleared", 0);
				pf("DefaultSettings", false);
			}catch(e){ alert(e); }
		}
		, load						: function(){
			try{
				if(pf("DefaultSettings") == "true"){ user.save(); pf.storeLastFolderNameHF(); }
				with(user){
					wsT 						= parseInt(pf("wsT"));
					wsL							= parseInt(pf("wsL"));
					cntFull						= parseInt(pf("cntFull")); // how much symbols was typed at all after installation of kbTrainer
					skin						= pf("skin");
					layouts						= pf("layouts");
					maps 						= pf("maps");
					try{
						if(maps !== ""){ maps = maps.split(","); }
						else{ maps = ["ru","en"]; }
					}catch(e){ maps = ["ru","en"]; }
					currentMap					= pf("currentMap");
					mapChanger 					= pf("mapChanger");
					try{
						if(mapChanger !== ""){
							mapChanger = mapChanger.split(",");
							for(var i in mapChanger){ mapChanger[i] = parseInt(mapChanger[i]); }
						}else{ mapChanger = [0, 1, 1]; }
					}catch(e){ mapChanger = [0, 1, 1]; }
					LessonsMode					= pf("LessonsMode");
					LessonNum					= pf("LessonNum");
					try{
						if(LessonNum !== ""){
							LessonNum = LessonNum.split(",");
							LessonNum[2] = parseInt(LessonNum[i]);
						}else{ LessonNum = [strings.locale, "base0", 0]; }
					}catch(e){ LessonNum = [strings.locale, "base0", 0]; }
					errMode						= pf("errMode");
					if(errMode == "true"){ errMode = true; }else{ errMode = false; }
					shiftControl				= pf("shiftControl");
					if(shiftControl == "true"){ shiftControl = true; }else{ shiftControl = false; }
					keybView					= pf("keybView");
					if(keybView == "true"){ keybView = true; }else{ keybView = false; }
					keybSize					= pf("keybSize");

					hider						= pf("hider");
					if(hider == "true"){ hider = true; }else{ hider = false; }
					hiderInterval				= parseInt(pf("hiderInterval"));
					ErrAlwaysCount				= pf("ErrAlwaysCount");
					if(ErrAlwaysCount == "true"){ ErrAlwaysCount = true; }else{ ErrAlwaysCount = false; }
					oneErrOnly					= pf("oneErrOnly");
					if(oneErrOnly == "true"){ oneErrOnly = true; }else{ oneErrOnly = false; }
					spaceInvert					= pf("spaceInvert");
					if(spaceInvert == "true"){ spaceInvert = true; }else{ spaceInvert = false; }
					spaceIsShiftSensentive		= pf("spaceIsShiftSensentive");
					if(spaceIsShiftSensentive == "true"){ spaceIsShiftSensentive = true; }else{ spaceIsShiftSensentive = false; }
					selectedMaps				= pf("selectedMaps");
					try{
						if(selectedMaps !== ""){ selectedMaps = selectedMaps.split(","); }
						else{ selectedMaps = ["ru.standard","en.standard"]; }
					}catch(e){ maps = ["ru.standard","en.standard"]; }
					skipNonTypedCharacters		= pf("skipNonTypedCharacters");
					hideStatsOnPause			= pf("hideStatsOnPause");
					if(hideStatsOnPause == "true"){ hideStatsOnPause = true; }else{ hideStatsOnPause = false; }

					Sound						= pf("Sound");
					if(Sound == "true"){ Sound = true; }else{ Sound = false; }
					SoundVolume					= parseInt(pf("SoundVolume"));

					CurrentBook					= pf("CurrentBook");

					TypingMode					= pf("TypingMode");
				}
			}catch(e){
				alert(e);
			}finally{}
		}
	}

}catch(e){
	alert(e);
}finally{}

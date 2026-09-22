try{
	//***!!!*** Visual Components of kbTrainer == objx (Objects)

	// stage 4.2/4.3: the top rows (clock, info boxes, stats, buttons) and
	// the typing area (content/already/to_type/paragrh, the messager pause
	// overlay) are rendered by the main-window Vue island (bin/topIsland.js,
	// mounted via the
	// "topbar" loader entry) before this script runs — wrap the existing
	// nodes instead of creating them. Everything is island-rendered now.
	var wrap = function(id){ return new mix.ex(id); };

	var objx = { // objects
		  full				: wrap("id.full")
		// content strings
		, content			: wrap("id.content")
		, already			: wrap("id.already")
		, to_type			: wrap("id.to_type")

		, paragrh			: wrap("id.paragrh")
		// content strings

		// other visualisation
		, messager			: wrap("id.messager")							// to pause application
		, keyboard			: wrap("id.keyboard")							// to view keyboard
		, time				: wrap("id.time")								// to view just current time
		, map_name			: wrap("id.map_name")							// to view map name
		, next_key			: wrap("id.next_key")							// next needed key to type
		, lang				: wrap("id.lang")								// to view text language
		, prev				: wrap("id.prev")								// what did user just type last
		, timer				: wrap("id.timer")								// timer

		, txt_perc			: wrap("id.txt_perc")							// % of typed text
		, err_perc			: wrap("id.err_perc")							// % of error typed in session

		, speed				: wrap("id.velocity")							// current speed of typing
		// other visualisation

		// buttons
		, zoomout_btn		: wrap("id.zoomout_btn")	// smaller window (Ctrl -)
		, zoomin_btn		: wrap("id.zoomin_btn")		// bigger window (Ctrl +)
		, help_btn			: wrap("id.help_btn")		// F1 help
		, lang_btn			: wrap("id.lang_btn")		// F2 language force change
		, type_btn			: wrap("id.type_btn")		// F3 mode : as string or as text
		, mode_btn			: wrap("id.mode_btn")		// F4 lessons / vocabularies / library
		, sets_btn			: wrap("id.sets_btn")		// F5 settings
		, libr_btn			: wrap("id.libr_btn")		// F8 library
		// buttons
	};
	objx.full.q.hide();
	objx.messager.q.hide();

}catch(e){ alert(e); }finally{}

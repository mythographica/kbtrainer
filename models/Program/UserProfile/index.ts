'use strict';

// UserProfile — persisted preferences (the era kbTrainer.cfg shape).
// Lives under Program: prefs survive sittings, sessions don't.
//
// Field names follow the era `user` object where the meaning matches
// (selectedMaps, cntFull, hiderInterval, hideStatsOnPause, bookmarks) so
// kbstore.adoptUser delegates them by name; the four era names that
// differ (errMode, oneErrOnly, ErrAlwaysCount, skipNonTypedCharacters)
// reach these canonical fields through adoptUser's alias map.
// NB: era user.layouts (the keyboard layout name) is NOT this
// selectedMaps (the active map pair) — different things, era keeps its
// own layouts as a plain delegated field.

interface UserProfileSelf {
	hiderInterval     : number;   // hide keyboard over this speed; valid 51..998
	errorControl      : boolean;
	oneErrorOnly      : boolean;
	countErrorsAlways : boolean;
	skipNonTypable    : boolean;
	selectedMaps      : string[];
	keyboardType      : string;
	skin              : string;
	hideStatsOnPause  : boolean;
	bookmarks         : unknown[];
	cntFull           : number;   // symbols typed at all since installation
}

module.exports = function UserProfile(this: UserProfileSelf) {
	this.hiderInterval = 200;   // hide keyboard over this speed; valid 51..998
	this.errorControl = true;
	this.oneErrorOnly = true;
	this.countErrorsAlways = false;
	this.skipNonTypable = true;
	this.selectedMaps = [ 'en.standard', 'ru.standard' ];
	this.keyboardType = 'simple';
	this.skin = 'Native Skin';
	this.hideStatsOnPause = false;
	this.bookmarks = [];
	this.cntFull = 0;           // symbols typed at all since installation
};

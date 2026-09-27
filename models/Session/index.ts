'use strict';

// Session — pressed keys + stats, nothing else. Sibling of Program and
// Timer; born knowing its program (a data link, not a chain) and produces
// events there: KeyLight/KeyFlash, dialog openings, zoom.
//
//   const session = utils.parent(this, 'Session');
//   const keystroke = new session.KeyStroke(key);

// The session only STORES the program link at birth; descendants reach the
// window level through the chain views (../chain). The structural minimum
// is declared here as a file-local alias so tactica expands it inline and
// the generated registry stays self-contained — models never read .tactica.
type ProgramLink = {
	profile : unknown;   // UserProfile — the prefs store
};

interface SessionSelf {
	program       : ProgramLink | null;
	mode          : string;
	paused        : boolean;
	quitRequested : boolean;
	layoutIndex   : number;   // active layout inside program.profile.selectedMaps
	run           : unknown;  // current Run instance (data link, not prototype)
	expectedChar  : string;
	stats         : {
		typed     : number;
		correct   : number;
		errors    : number;
		timerCnt  : number;
		startedAt : number;
	};
	handler      : unknown;   // the EventHandler (the router), born with the session
	EventHandler : new () => unknown;
}

module.exports = function Session(this: SessionSelf, program: ProgramLink) {
	this.program = program || null;
	this.mode = 'lesson';       // 'lesson' | 'book'
	this.paused = false;
	this.quitRequested = false;
	this.layoutIndex = 0;
	this.run = null;
	this.expectedChar = '';
	this.stats = {
		typed     : 0,
		correct   : 0,
		errors    : 0,
		timerCnt  : 0,            // seconds, fed by Timer.Tick
		startedAt : 0
	};
	this.handler = new this.EventHandler();
};

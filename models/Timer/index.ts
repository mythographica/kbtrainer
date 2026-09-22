'use strict';

// Timer — the wall clock root. Sibling of Session and Program; born
// knowing which session to feed (data link, not a chain).

// The timer only STORES the session link at birth; Tick reads it through
// the chain views (../chain). File-local alias — see Session/index.ts.
type SessionLink = {
	stats : unknown;   // the stats cells Tick feeds
};

interface TimerSelf {
	session : SessionLink | null;
	ticks   : number;
}

module.exports = function Timer(this: TimerSelf, session: SessionLink) {
	this.session = session || null;
	this.ticks = 0;
};

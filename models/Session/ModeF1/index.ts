'use strict';

// Session.ModeF1 — help. The help page opens as its own, non-modal window
// (snk.open_help) and has no data flow; we only record that it was opened.
// It claims no program.dialog: nothing modal is open while help shows.

interface ModeF1Self {
	openedAt : number;
}

module.exports = function ModeF1(this: ModeF1Self) {
	this.openedAt = Date.now();
};

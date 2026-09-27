'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF12 — loader log viewer. The era shows loader_log in its own
// window (loader_log_view); every line of it is a Program.Log record, so
// the entry count is the log the user is looking at. It claims no
// program.dialog: the viewer is not modal.

interface ModeF12Self {
	entries : number;
}

module.exports = function ModeF12(this: ModeF12Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const program = session.program!;
	this.entries = program.logs.length;
};

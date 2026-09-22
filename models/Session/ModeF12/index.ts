'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF12 — loader log viewer (the program's Log records).

interface ModeF12Self {
	entries : number;
}

module.exports = function ModeF12(this: ModeF12Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const program = session.program!;
	program.dialog = 'loaderlog';
	this.entries = program.logs.length;
};

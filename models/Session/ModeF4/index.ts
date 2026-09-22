'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF4 — mode dialog (lesson/book picker), a Program window.

interface ModeF4Self {
	dialogInstance : unknown;
}

module.exports = function ModeF4(this: ModeF4Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.dialogInstance = new session.program!.ModeDialog();
};

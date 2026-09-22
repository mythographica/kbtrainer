'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF8 — library dialog, a Program window.

interface ModeF8Self {
	dialogInstance : unknown;
}

module.exports = function ModeF8(this: ModeF8Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.dialogInstance = new session.program!.LibDialog();
};

'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF5 — settings dialog, a Program window.

interface ModeF5Self {
	dialogInstance : unknown;
}

module.exports = function ModeF5(this: ModeF5Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.dialogInstance = new session.program!.SettingsDialog();
};

'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.SettingsDialog — the settings window as a program-level
// sub-chain: every control change is an endpoint under the dialog
// instance, writing the prefs store through the program link.

interface SettingsDialogSelf {
	openedAt : number;
	closed   : boolean;
	close    : () => void;
}

module.exports = function SettingsDialog(this: SettingsDialogSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.dialog = 'settings';
	this.openedAt = Date.now();
	this.closed = false;
	this.close = () => {
		this.closed = true;
		if (program.dialog === 'settings') {
			program.dialog = null;
		}
	};
};

'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.LibDialog — the book library window; the library itself is
// program-level data (persisted, outlives sessions).

interface LibDialogSelf {
	openedAt : number;
	close    : () => void;
}

module.exports = function LibDialog(this: LibDialogSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.dialog = 'lib';
	this.openedAt = Date.now();
	this.close = () => {
		if (program.dialog === 'lib') {
			program.dialog = null;
		}
	};
};

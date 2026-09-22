'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.ModeDialog.ModeSet — lesson/book mode chosen.

interface ModeSetSelf {
	mode : string;
}

module.exports = function ModeSet(this: ModeSetSelf, mode: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	if (mode !== 'lesson' && mode !== 'book') {
		throw new RangeError('unknown mode: ' + mode);
	}
	if (program.session) {
		program.session.mode = mode;
	}
	this.mode = mode;
};

'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.ModeDialog — the mode/lesson/book picker window. LessonPick and
// BookPick are RunStart: they construct the Session's Run sub-chain
// through the data link (program.session).

interface ModeDialogSelf {
	openedAt : number;
	close    : () => void;
}

module.exports = function ModeDialog(this: ModeDialogSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.dialog = 'mode';
	this.openedAt = Date.now();
	this.close = () => {
		if (program.dialog === 'mode') {
			program.dialog = null;
		}
	};
};

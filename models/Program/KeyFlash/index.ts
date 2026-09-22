'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.KeyFlash — the wrong key flashed on a Mistake. Produced by
// Session's Mistake.StatUpdate — a cross-root event.

interface KeyFlashSelf {
	key : string;
}

module.exports = function KeyFlash(this: KeyFlashSelf, key: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	this.key = key;
	program.flashKey = key;
};

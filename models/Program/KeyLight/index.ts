'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.KeyLight — keyboard button state: the next expected key is lit
// (finger-hint resolution is app wiring). Produced by Session's
// LetterPick/WordPick chains — a cross-root event.

interface KeyLightSelf {
	char : string;
}

module.exports = function KeyLight(this: KeyLightSelf, char: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	this.char = char;
	program.litKey = char;
	program.flashKey = '';
};

'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.LibDialog.BookSelect — a library book chosen.

interface BookSelectSelf {
	name : string;
}

module.exports = function BookSelect(this: BookSelectSelf, name: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	if (!program.library.includes(name)) {
		throw new Error('book not in library: ' + name);
	}
	this.name = name;
};

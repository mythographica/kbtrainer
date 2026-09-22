'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.LibDialog.BookImport — a book added to the library.

interface BookImportSelf {
	name : string;
}

module.exports = function BookImport(this: BookImportSelf, name: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	if (!program.library.includes(name)) {
		program.library.push(name);
	}
	this.name = name;
};

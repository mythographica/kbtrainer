'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.LibDialog.BookDeleteRequest — deletion is a two-step chain:
// request first, then BookDeleted confirms.

interface BookDeleteRequestSelf {
	name    : string;
	pending : boolean;
}

module.exports = function BookDeleteRequest(this: BookDeleteRequestSelf, name: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	this.name = name;
	this.pending = program.library.includes(name);
};

'use strict';

const { utils } = require('mnemonica');

import type { BookDeleteRequestChain, ProgramChain } from '../../../../chain';

// Program.LibDialog.BookDeleteRequest.BookDeleted — confirmation removes
// the book from the library.

interface BookDeletedSelf {
	name : string;
}

module.exports = function BookDeleted(this: BookDeletedSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	const request = utils.parent(this, 'BookDeleteRequest') as BookDeleteRequestChain;
	const idx = program.library.indexOf(request.name);
	if (idx !== -1) {
		program.library.splice(idx, 1);
	}
	request.pending = false;
	this.name = request.name;
};

'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.LibDialog.BookMark — bookmark toggled on a book.

interface BookMarkSelf {
	marked : boolean;
	name   : string;
}

module.exports = function BookMark(this: BookMarkSelf, name: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	const { bookmarks } = program.profile;
	const idx = bookmarks.indexOf(name);
	if (idx === -1) {
		bookmarks.push(name);
		this.marked = true;
	} else {
		bookmarks.splice(idx, 1);
		this.marked = false;
	}
	program.prefsDirty = true;
	this.name = name;
};

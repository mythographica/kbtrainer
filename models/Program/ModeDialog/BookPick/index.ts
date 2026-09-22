'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.ModeDialog.BookPick — a book chosen: RunStart (a book IS a
// lesson). Constructs Run → Book → Native through the data link.

interface BookPickSelf {
	run : unknown;
}

module.exports = function BookPick(this: BookPickSelf, name: string, text: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	const session = program.session!;
	session.mode = 'book';
	const run = new session.Run(name, text);
	const book = new run.Book();
	this.run = new book.Native(name);
};

'use strict';

const { utils } = require('mnemonica');

import type { RunChain } from '../../../../chain';

// Run.Book.Paragraph — reading a book with the word window.

interface ParagraphSelf {
	book : string;
}

module.exports = function Paragraph(this: ParagraphSelf, name: string) {
	const run = utils.parent(this, 'Run') as RunChain;
	run.pick = 'word';
	this.book = name;
};

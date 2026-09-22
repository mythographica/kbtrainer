'use strict';

const { utils } = require('mnemonica');

import type { RunChain } from '../../../../chain';

// Run.Book.Native — reading a book letter by letter.

interface NativeSelf {
	book : string;
}

module.exports = function Native(this: NativeSelf, name: string) {
	const run = utils.parent(this, 'Run') as RunChain;
	run.pick = 'letter';
	this.book = name;
};

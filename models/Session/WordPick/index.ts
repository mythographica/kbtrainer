'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// WordPick — picking the next word is its own chain (paragraph modes).
// The char cursor still moves letter by letter (spaces included); the word
// window is derived from it. Lights the next key (a Program event).
// Running off the text terminates via Run.Finish.

interface WordPickSelf {
	char : string;
	word : string;
}

module.exports = function WordPick(this: WordPickSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const { run } = session;
	if (!run) {
		this.word = '';
		return;
	}
	run.pos += 1;
	this.char = run.text.charAt(run.pos);
	session.expectedChar = this.char;
	run.wordIndex = run.text.slice(0, run.pos).split(' ').length - 1;
	this.word = (run.words || [])[ run.wordIndex ] || '';
	if (run.pos >= run.text.length) {
		new run.Finish();
	} else if (session.program) {
		new session.program.KeyLight(this.char);
	}
};

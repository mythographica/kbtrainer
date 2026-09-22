'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// LetterPick — picking the next letter is its own chain (native modes).
// Advances the run cursor, publishes session.expectedChar, and lights the
// next key on the keyboard (a Program event). Running off the end of the
// text terminates the run through Run.Finish.

interface LetterPickSelf {
	char : string;
}

module.exports = function LetterPick(this: LetterPickSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const { run } = session;
	if (!run) {
		this.char = '';
		return;
	}
	run.pos += 1;
	this.char = run.text.charAt(run.pos);
	session.expectedChar = this.char;
	if (run.pos >= run.text.length) {
		new run.Finish();
	} else if (session.program) {
		new session.program.KeyLight(this.char);
	}
};

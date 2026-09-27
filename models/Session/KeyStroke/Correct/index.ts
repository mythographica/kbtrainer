'use strict';

const { utils } = require('mnemonica');

import type { KeyStrokeChain } from '../../../chain';

// KeyStroke.Correct — the pressed key matched session.expectedChar.
//
// The stat update runs on COMMITTED data: queued as a microtask, it is
// constructed after Correct has finished, so dive parents it on Correct's
// own edge (built inside the constructor it would have no parent edge
// yet). Microtasks drain before the next key event, so the per-key order
// stays fixed: Correct -> StatUpdate -> LetterPick|WordPick -> the redraw
// (the engine redraws on StatUpdate's postCreation).

interface CorrectSelf {
	key        : string;
	statUpdate : unknown;
	StatUpdate : new () => unknown;
}

const Correct = function (this: CorrectSelf) {
	const keystroke = utils.parent(this, 'KeyStroke') as KeyStrokeChain;
	this.key = keystroke.key;
	this.statUpdate = null;
	queueMicrotask(() => {
		this.statUpdate = new this.StatUpdate();
	});
};

module.exports = Correct;

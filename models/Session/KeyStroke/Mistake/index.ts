'use strict';

const { utils } = require('mnemonica');

import type { KeyStrokeChain } from '../../../chain';

// KeyStroke.Mistake — the pressed key did not match session.expectedChar.
// Error control: the cursor does NOT advance; the same letter is expected
// again, so no LetterPick/WordPick follows.

interface MistakeSelf {
	key        : string;
	expected   : string;
	statUpdate : unknown;
	StatUpdate : new () => unknown;
}

const Mistake = function (this: MistakeSelf) {
	const keystroke = utils.parent(this, 'KeyStroke') as KeyStrokeChain;
	this.key = keystroke.key;
	// KeyStroke carries the expectation as .expected — the era name
	// (keystroke.expectedChar) was a misread and always gave undefined.
	this.expected = keystroke.expected;
	this.statUpdate = new this.StatUpdate();
};

module.exports = Mistake;

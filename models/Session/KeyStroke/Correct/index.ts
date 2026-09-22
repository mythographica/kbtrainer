'use strict';

const { utils } = require('mnemonica');

import type { KeyStrokeChain } from '../../../chain';

// KeyStroke.Correct — the pressed key matched session.expectedChar.

interface CorrectSelf {
	key        : string;
	statUpdate : unknown;
	StatUpdate : new () => unknown;
}

const Correct = function (this: CorrectSelf) {
	const keystroke = utils.parent(this, 'KeyStroke') as KeyStrokeChain;
	this.key = keystroke.key;
	this.statUpdate = new this.StatUpdate();
};

module.exports = Correct;

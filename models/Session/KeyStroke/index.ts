'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// KeyStroke — one key pressed during a lesson run.
// Ancestors depend on the active mode: in lesson mode they are
// Correct | Mistake (-> StatUpdate); in other modes it stays a plain
// KeyStroke — the router simply never branches.

interface KeyStrokeSelf {
	key      : string;
	expected : string;
	at       : number;
}

module.exports = function KeyStroke(this: KeyStrokeSelf, key: string) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.key = key;
	this.expected = session.expectedChar;
	this.at = Date.now();
};

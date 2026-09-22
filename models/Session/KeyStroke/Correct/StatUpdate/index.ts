'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../../../chain';

// KeyStroke.Correct.StatUpdate — the era counting rules, moved into the
// chain (stage 4.5): a correct keystroke bumps typed (era vars.cntSess)
// and the lifetime counter (era user.cntFull — the same cell through the
// adoptUser accessor). correct is a domain-only extra, invisible to era.

interface StatUpdateSelf {
	next? : unknown;
}

const StatUpdate = function (this: StatUpdateSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	session.stats.typed += 1;
	session.stats.correct += 1;
	if (session.program) {
		session.program.profile.cntFull += 1;
	}
	const { run } = session;
	if (run) {
		// A correct keystroke continues the chain: pick the next symbol.
		// NB: never RETURN the pick — a constructor returning a foreign
		// instance breaks the mnemonica inheritance check.
		this.next = run.pick === 'word' ?
			new session.WordPick() :
			new session.LetterPick();
	}
};

module.exports = StatUpdate;

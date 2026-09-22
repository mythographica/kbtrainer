'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF7 — stats reset.

interface ModeF7Self {}

module.exports = function ModeF7(this: ModeF7Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	session.stats.typed = 0;
	session.stats.correct = 0;
	session.stats.errors = 0;
	session.stats.timerCnt = 0;
};

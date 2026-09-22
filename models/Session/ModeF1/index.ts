'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF1 — help. The help page itself has no data flow; we only
// record the window switch.

interface ModeF1Self {}

module.exports = function ModeF1(this: ModeF1Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	if (session.program) {
		session.program.dialog = 'help';
	}
};

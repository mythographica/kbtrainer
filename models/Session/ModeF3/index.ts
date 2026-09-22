'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF3 — keyboard type switch (visual: lives in the program's
// prefs).

interface ModeF3Self {
	keyboardType : string;
}

module.exports = function ModeF3(this: ModeF3Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const program = session.program!;
	const types = [ 'simple', 'full', 'compact' ];
	const idx = (types.indexOf(program.profile.keyboardType) + 1) % types.length;
	program.profile.keyboardType = types[ idx ];
	program.prefsDirty = true;
	this.keyboardType = types[ idx ];
};

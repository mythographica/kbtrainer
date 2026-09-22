'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF2 — layout switch. Also reached by Alt+Shift / Ctrl+Shift.

interface ModeF2Self {
	layout : string;
}

module.exports = function ModeF2(this: ModeF2Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const { selectedMaps } = session.program!.profile;
	session.layoutIndex = (session.layoutIndex + 1) % selectedMaps.length;
	this.layout = selectedMaps[ session.layoutIndex ];
};

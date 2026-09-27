'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF2 — keyboard map switch (F2, the language button,
// Alt+Shift / Ctrl+Shift). The era switch (kb.changeMap) cycles
// profile.currentMap through the languages of the selected maps; this
// records the switch that happened and points the session's layout index
// at it — it keeps no counter of its own, so it cannot drift from the era.

interface ModeF2Self {
	layout : string;
}

module.exports = function ModeF2(this: ModeF2Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const { selectedMaps, currentMap } = session.program!.profile;
	const idx = selectedMaps.findIndex((map) => map.split('.')[ 0 ] === currentMap);
	session.layoutIndex = idx === -1 ? 0 : idx;
	this.layout = currentMap;
};

'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.RunControl — pause/resume/quit and lesson-base navigation.
// Esc and Space start this data flow (the router decides which subtype).

interface RunControlSelf {
	wasPaused : boolean;
}

module.exports = function RunControl(this: RunControlSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.wasPaused = session.paused;
};

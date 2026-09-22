'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../../chain';

// Session.RunControl.Pause — Esc while a run is active.

interface PauseSelf {}

module.exports = function Pause(this: PauseSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	session.paused = true;
};

'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../../chain';

// Session.RunControl.Resume — Space while paused.

interface ResumeSelf {}

module.exports = function Resume(this: ResumeSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	session.paused = false;
};

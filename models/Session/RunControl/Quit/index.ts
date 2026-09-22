'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../../chain';

// Session.RunControl.Quit — Esc while paused or idle.
// OPEN QUESTION: era snk.js:111 closes the window on Esc when not typing.

interface QuitSelf {}

module.exports = function Quit(this: QuitSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	session.quitRequested = true;
};

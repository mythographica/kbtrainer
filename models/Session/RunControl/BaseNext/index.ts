'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../../chain';

// Session.RunControl.BaseNext — Ctrl + left/right/down: walk the lesson
// base.

interface BaseNextSelf {
	direction : string;
}

module.exports = function BaseNext(this: BaseNextSelf, direction: string) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.direction = direction;
	if (direction === 'left') {
		session.lessonIndex = Math.max(0, session.lessonIndex - 1);
	} else {
		session.lessonIndex += 1;
	}
};

'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../../chain';

// Session.RunControl.LessonNext — next lesson in the base.

interface LessonNextSelf {}

module.exports = function LessonNext(this: LessonNextSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	session.lessonIndex += 1;
};

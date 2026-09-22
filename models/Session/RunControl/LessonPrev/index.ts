'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../../chain';

// Session.RunControl.LessonPrev — previous lesson in the base.

interface LessonPrevSelf {}

module.exports = function LessonPrev(this: LessonPrevSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	session.lessonIndex = Math.max(0, session.lessonIndex - 1);
};

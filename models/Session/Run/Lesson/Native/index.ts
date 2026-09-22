'use strict';

const { utils } = require('mnemonica');

import type { RunChain } from '../../../../chain';

// Run.Lesson.Native — a plain lesson: letters picked one by one.

interface NativeSelf {
	lessonId : string;
}

module.exports = function Native(this: NativeSelf, lessonId: string) {
	const run = utils.parent(this, 'Run') as RunChain;
	run.pick = 'letter';
	this.lessonId = lessonId;
};

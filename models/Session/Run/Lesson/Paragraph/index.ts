'use strict';

const { utils } = require('mnemonica');

import type { RunChain } from '../../../../chain';

// Run.Lesson.Paragraph — a paragraph lesson: letters plus the word window.

interface ParagraphSelf {
	lessonId : string;
}

module.exports = function Paragraph(this: ParagraphSelf, lessonId: string) {
	const run = utils.parent(this, 'Run') as RunChain;
	run.pick = 'word';
	this.lessonId = lessonId;
};

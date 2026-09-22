'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.ModeDialog.LessonPick — a lesson chosen: RunStart. Constructs
// the Session's Run → Lesson → Native chain through the data link.

interface LessonPickSelf {
	run : unknown;
}

module.exports = function LessonPick(this: LessonPickSelf, lessonId: string, title: string, text: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	const session = program.session!;
	session.mode = 'lesson';
	const run = new session.Run(title, text);
	const lesson = new run.Lesson();
	this.run = new lesson.Native(lessonId);
};

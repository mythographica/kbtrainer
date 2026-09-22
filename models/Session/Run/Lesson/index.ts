'use strict';

// Run.Lesson — the lesson branch of a run.

interface LessonSelf {
	kind : string;
}

module.exports = function Lesson(this: LessonSelf) {
	this.kind = 'lesson';
};

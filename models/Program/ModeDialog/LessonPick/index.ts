'use strict';

// Program.ModeDialog.LessonPick — a lesson selected in the mode dialog.
// In the era a click only SELECTS (user.LessonNum); the run starts when
// the dialog closes (app.restart -> the engine builds Session.Run), so
// this records the selection and constructs nothing. Clicking through
// several lessons records each one.

interface LessonPickSelf {
	lessonId : string;
}

module.exports = function LessonPick(this: LessonPickSelf, lessonId: string) {
	this.lessonId = lessonId;
};

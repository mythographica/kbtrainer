'use strict';

// Program.ModeDialog.BookPick — a book selected in the mode dialog. As with
// LessonPick, the era click only selects (user.CurrentBook); the run starts
// at app.restart when the dialog closes, resuming at the book's bookmark.

interface BookPickSelf {
	path : string;
}

module.exports = function BookPick(this: BookPickSelf, path: string) {
	this.path = path;
};

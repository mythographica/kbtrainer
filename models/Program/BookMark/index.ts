'use strict';

// Program.BookMark — a bookmark: the typing position saved into a book.
// The era saves it in kernel.saveCurrentBookPosition — before the mode and
// library dialogs open, and when the window closes — and only for a book
// run, never for a lesson. The era writes the position into the book file
// and makes the book current; this records which book and where.

interface BookMarkSelf {
	path     : string;
	position : number;
}

module.exports = function BookMark(this: BookMarkSelf, path: string, position: number) {
	this.path = path;
	this.position = position;
};

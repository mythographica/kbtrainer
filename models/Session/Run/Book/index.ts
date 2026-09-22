'use strict';

// Run.Book — the book branch of a run: a book IS a lesson.

interface BookSelf {
	kind : string;
}

module.exports = function Book(this: BookSelf) {
	this.kind = 'book';
};

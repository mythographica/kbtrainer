'use strict';

// Run.Vocabulary — the vocabulary trainer mode, resurrected 2026-09-27.
// Viktor: it predates lib/books — Ctrl+3 opened a textarea, you pasted
// text, typed it, nothing more. 2.1 dropped it mid-migration (the fossil
// constructor threw); the mode is back as: paste (Ctrl+3) → type once.
// The run records the pasted length; the raw text is persisted next to the
// books as lib/vocabulary.txt (2026-09-28) and also kept in memory as
// window.__vocabText for the current session.

interface VocabularySelf {
	chars : number;
}

module.exports = function Vocabulary(this: VocabularySelf, chars?: number) {
	this.chars = chars || 0;
};

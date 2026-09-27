'use strict';

const { utils } = require('mnemonica');

import type { RunChain, SessionChain } from '../../chain';

// Run — an active run of a lesson or a book: the text and its cursor. The
// root of the Run sub-chain: Run -> Lesson|Book -> Native|Paragraph,
// terminated by Run.Finish. Constructed stepwise (each step is a trace
// event) when the era engine starts a lesson or a book:
//   const run = new session.Run(title, text, startPos);
//   const lesson = new run.Lesson();
//   const native = new lesson.Native(lessonId);
//
// run.pos IS the cursor (stage 4.7): the engine adopts its
// vars.strArr.pos onto it, LetterPick/WordPick advance it. A book resumes
// at its saved position (startPos). The session stats are NOT reset here:
// the era keeps them across restarts and lesson repeats — only the first
// start and F7 (ModeF7) zero them.

interface RunSelf extends RunChain {
	startedAt : number;
}

module.exports = function Run(this: RunSelf, title: string, text: string, startPos?: number) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.title = title;
	this.text = typeof text === 'string' ? text : '';
	this.words = this.text.split(' ');
	this.pos = typeof startPos === 'number' && startPos > 0 ? startPos : 0;
	this.wordIndex = 0;
	this.pick = 'letter';       // 'letter' (native) | 'word' (paragraph)
	this.startedAt = Date.now();
	session.run = this;
	session.paused = false;
	session.stats.startedAt = this.startedAt;
	session.expectedChar = this.text.charAt(this.pos);
	if (session.program && session.expectedChar) {
		new session.program.KeyLight(session.expectedChar);
	}
};

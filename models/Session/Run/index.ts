'use strict';

const { utils } = require('mnemonica');

import type { RunChain, SessionChain } from '../../chain';

// Run — an active run of a lesson or a book. The root of the Run sub-chain:
// Run -> Lesson|Book -> Native|Paragraph, terminated by Run.Finish.
// Constructed stepwise (each step is a trace event):
//   const run = new session.Run(title, text);
//   const lesson = new run.Lesson();
//   const native = new lesson.Native(lessonId);

interface RunSelf extends RunChain {
	startedAt : number;
}

module.exports = function Run(this: RunSelf, title: string, text: string) {
	const session = utils.parent(this, 'Session') as SessionChain;
	this.title = title;
	this.text = typeof text === 'string' ? text : '';
	this.words = this.text.split(' ');
	this.pos = 0;
	this.wordIndex = 0;
	this.pick = 'letter';       // 'letter' (native) | 'word' (paragraph)
	this.startedAt = Date.now();
	session.run = this;
	session.paused = false;
	session.stats.typed = 0;
	session.stats.correct = 0;
	session.stats.errors = 0;
	session.stats.timerCnt = 0;
	session.stats.startedAt = this.startedAt;
	session.expectedChar = this.text.charAt(0);
	if (session.program && session.expectedChar) {
		new session.program.KeyLight(session.expectedChar);
	}
};

'use strict';

const { utils } = require('mnemonica');

import type { RunChain, SessionChain } from '../../../chain';

// Run.Finish — the terminal of every run: a finished lesson/book enriched
// with the aggregated session stats snapshot.

interface FinishSelf {
	title      : string;
	typed      : number;
	correct    : number;
	errors     : number;
	timerCnt   : number;
	speed      : number;
	accuracy   : number;
	finishedAt : number;
}

module.exports = function Finish(this: FinishSelf) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const run = utils.parent(this, 'Run') as RunChain;
	const { stats } = session;
	this.title = run.title;
	this.typed = stats.typed;
	this.correct = stats.correct;
	this.errors = stats.errors;
	this.timerCnt = stats.timerCnt;
	this.speed = stats.timerCnt > 0 ?
		Math.round(stats.typed / stats.timerCnt * 60) :
		0;
	this.accuracy = stats.typed > 0 ?
		Math.round(stats.correct / stats.typed * 10000) / 100 :
		100;
	this.finishedAt = Date.now();
	if (session.run === run) {
		session.run = null;
		session.expectedChar = '';
	}
};

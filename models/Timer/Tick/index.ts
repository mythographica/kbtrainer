'use strict';

const { utils } = require('mnemonica');

import type { TimerChain } from '../../chain';

// Timer.Tick — a fresh instance every second, never reused. The wall clock
// is just the tick's timestamp; the lesson counter (era tick-based timing)
// bumps only while a run is active and not paused. Speed follows the era
// formula: typed / timerCnt * 60, 0 until the first tick.

interface TickSelf {
	n     : number;
	at    : number;
	speed : number;
}

module.exports = function Tick(this: TickSelf) {
	const timer = utils.parent(this, 'Timer') as TimerChain;
	const { session } = timer;
	timer.ticks += 1;
	this.n = timer.ticks;
	this.at = Date.now();
	if (session && session.run && !session.paused) {
		session.stats.timerCnt += 1;
	}
	this.speed = session && session.stats.timerCnt > 0 ?
		Math.round(session.stats.typed / session.stats.timerCnt * 60) :
		0;
};

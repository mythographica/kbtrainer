'use strict';

const { utils } = require('mnemonica');

import type { TimerChain } from '../../chain';

// Timer.Tick — a fresh instance every second, never reused: the wall clock
// and a speed snapshot (era formula: typed / timerCnt * 60, 0 until the
// lesson counter runs). The lesson counter itself (stats.timerCnt) is the
// era engine's: app.counter() bumps it only while typing is really going
// on (app.started — false on every pause, focus loss and dialog, which the
// session does not see), so Tick reads it and never bumps it.

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
	this.speed = session && session.stats.timerCnt > 0 ?
		Math.round(session.stats.typed / session.stats.timerCnt * 60) :
		0;
};

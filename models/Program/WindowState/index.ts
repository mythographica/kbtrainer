'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.WindowState — window geometry records: size/pos/center changes.

type WindowRect = {
	width  : number;
	height : number;
	x?     : number;
	y?     : number;
};

interface WindowStateSelf {
	width  : number;
	height : number;
	x      : number | null;
	y      : number | null;
	at     : number;
}

module.exports = function WindowState(this: WindowStateSelf, rect: WindowRect) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	this.width = rect.width;
	this.height = rect.height;
	this.x = rect.x === undefined ? null : rect.x;
	this.y = rect.y === undefined ? null : rect.y;
	this.at = Date.now();
	program.windowState = this;
};

'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.Log — one log record. Bootstrap seeds these from the topologica
// loader logs; F12 views them.

interface LogSelf {
	text   : string;
	source : string;
	at     : number;
}

module.exports = function Log(this: LogSelf, text: string, source: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	this.text = String(text);
	this.source = source || 'app';
	this.at = Date.now();
	program.logs.push(this);
};

'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.ViewControl — Ctrl+'+' / Ctrl+'-'. It resizes the window, so it
// lives at program level; the dirty flag drives persistence to disk
// (app wiring).

interface ViewControlSelf {
	from : number;
}

module.exports = function ViewControl(this: ViewControlSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	this.from = program.zoom;
};

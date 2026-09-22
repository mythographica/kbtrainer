'use strict';

const { utils } = require('mnemonica');
const { MAX_ZOOM, ZOOM_STEP } = require('../../helpers.js');

import type { ProgramChain } from '../../../chain';

// Program.ViewControl.ZoomIn — Ctrl+'+'.

interface ZoomInSelf {
	zoom : number;
}

module.exports = function ZoomIn(this: ZoomInSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.zoom = Math.min(MAX_ZOOM, Math.round((program.zoom + ZOOM_STEP) * 100) / 100);
	program.prefsDirty = true;
	this.zoom = program.zoom;
};

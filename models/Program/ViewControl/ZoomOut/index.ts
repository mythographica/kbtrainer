'use strict';

const { utils } = require('mnemonica');
const { MIN_ZOOM, ZOOM_STEP } = require('../../helpers.js');

import type { ProgramChain } from '../../../chain';

// Program.ViewControl.ZoomOut — Ctrl+'-'.

interface ZoomOutSelf {
	zoom : number;
}

module.exports = function ZoomOut(this: ZoomOutSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.zoom = Math.max(MIN_ZOOM, Math.round((program.zoom - ZOOM_STEP) * 100) / 100);
	program.prefsDirty = true;
	this.zoom = program.zoom;
};

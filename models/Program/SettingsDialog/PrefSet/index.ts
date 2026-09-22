'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.SettingsDialog.PrefSet — one preference changed.
// One real endpoint validation: the era keyboard-hider accepts 51..998.

interface PrefSetSelf {
	name  : string;
	value : unknown;
}

module.exports = function PrefSet(this: PrefSetSelf, name: string, value: unknown) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	if (name === 'hiderInterval') {
		const n = Number(value);
		if (!Number.isFinite(n) || n < 51 || n > 998) {
			throw new RangeError('hiderInterval must be within 51..998, got: ' + value);
		}
		value = n;
	}
	program.profile[ name ] = value;
	program.prefsDirty = true;
	this.name = name;
	this.value = value;
};

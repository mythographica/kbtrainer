'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.SettingsDialog.MapsPairSet — the maps pair changed.

interface MapsPairSetSelf {
	selectedMaps : string[];
}

module.exports = function MapsPairSet(this: MapsPairSetSelf, layoutA: string, layoutB: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.profile.selectedMaps = [ layoutA, layoutB ];
	if (program.session) {
		program.session.layoutIndex = 0;
	}
	program.prefsDirty = true;
	this.selectedMaps = program.profile.selectedMaps.slice();
};

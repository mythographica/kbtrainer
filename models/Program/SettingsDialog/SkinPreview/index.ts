'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../../chain';

// Program.SettingsDialog.SkinPreview — skin previewed (live, uncommitted).

interface SkinPreviewSelf {
	skin : string;
}

module.exports = function SkinPreview(this: SkinPreviewSelf, skinName: string) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.profile.skin = skinName;
	program.prefsDirty = true;
	this.skin = skinName;
};

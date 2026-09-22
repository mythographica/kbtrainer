'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.FileDialog — the file selector window. The app wiring feeds
// directory entries in (models never touch fs themselves).

interface FileDialogSelf {
	close : () => void;
}

module.exports = function FileDialog(this: FileDialogSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	program.dialog = 'file';
	this.close = () => {
		if (program.dialog === 'file') {
			program.dialog = null;
		}
	};
};

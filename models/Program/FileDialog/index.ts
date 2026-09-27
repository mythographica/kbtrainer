'use strict';

const { utils } = require('mnemonica');

import type { ProgramChain } from '../../chain';

// Program.FileDialog — the native file selector (kbfs.openTextFileDialog),
// opened on top of whatever dialog is showing (the library). The app
// wiring feeds the result in as FilePick (models never touch fs
// themselves). close() hands program.dialog back to the dialog underneath.

interface FileDialogSelf {
	close : () => void;
}

module.exports = function FileDialog(this: FileDialogSelf) {
	const program = utils.parent(this, 'Program') as ProgramChain;
	const underneath = program.dialog;
	program.dialog = 'file';
	this.close = () => {
		if (program.dialog === 'file') {
			program.dialog = underneath;
		}
	};
};

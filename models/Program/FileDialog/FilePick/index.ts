'use strict';

// Program.FileDialog.FilePick — a file chosen.

interface FilePickSelf {
	filePath : string;
}

module.exports = function FilePick(this: FilePickSelf, filePath: string) {
	this.filePath = filePath;
};

'use strict';

// Program.FileDialog.DirList — a directory listing shown (entries are fed
// in by the app wiring).

interface DirListSelf {
	dirPath : string;
	entries : unknown[];
}

module.exports = function DirList(this: DirListSelf, dirPath: string, entries: unknown) {
	this.dirPath = dirPath;
	this.entries = Array.isArray(entries) ? entries.slice() : [];
};

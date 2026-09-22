'use strict';

// Program — the visual/window-level root. Sibling of Session and Timer.
// Owns everything that touches the window itself: the prefs store,
// keyboard lights, dialogs, zoom, window state, logs. The session is a
// data link (program.session, wired at bootstrap) and produces events
// here — KeyLight, KeyFlash, dialog openings.

import type { SessionChain } from '../chain';

type ProgramOpts = {
	version? : string;
	screen?  : { width : number; height : number } | null;
};

interface ProgramSelf {
	version     : string;
	screen      : { width : number; height : number } | null;
	startedAt   : number;
	zoom        : number;
	prefsDirty  : boolean;
	dialog      : string | null;
	litKey      : string;
	flashKey    : string;
	windowState : unknown;
	library     : string[];
	logs        : unknown[];
	session     : SessionChain | null;
	profile     : unknown;   // the UserProfile instance, set below
	UserProfile : new () => unknown;
}

module.exports = function Program(this: ProgramSelf, opts?: ProgramOpts) {
	const options = opts || {};
	this.version = options.version || '';
	this.screen = options.screen || null; // { width, height }, measured pre-window
	this.startedAt = Date.now();
	this.zoom = 1;
	this.prefsDirty = false;
	this.dialog = null;         // null | 'settings' | 'mode' | 'lib' | 'file' | 'help' | 'loaderlog'
	this.litKey = '';           // currently highlighted keyboard key
	this.flashKey = '';         // currently flashed (mistake) key
	this.windowState = null;    // last WindowState record
	this.library = [];          // book names known to the library
	this.logs = [];             // Log records (loader logs seeded at bootstrap)
	this.session = null;        // data link, wired at bootstrap
	this.profile = new this.UserProfile();
};

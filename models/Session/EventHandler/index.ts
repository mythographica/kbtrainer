'use strict';

const { utils } = require('mnemonica');

import type { KeyMods, SessionChain } from '../../chain';

// EventHandler — the router; a Controller made from DataFlow.
// It starts the Session's chains from the existing session instance;
// window-level effects are produced on the Program through the data link.
//
// Key surface (era keyCodes):
//   F1..F12        -> Session.ModeF*        (independent Session paths)
//   Alt+Shift / Ctrl+Shift -> ModeF2        (layout switch, same path as F2)
//   Ctrl+'+'/'-'   -> Program.ViewControl.ZoomIn/ZoomOut
//   Ctrl+←/→       -> RunControl.LessonPrev/LessonNext (lesson in the base)
//   Ctrl+↑/↓       -> RunControl.BaseNext('prev'|'next') (the lesson base)
//   Esc            -> RunControl.Pause      (Quit when already paused/idle)
//   Space          -> RunControl.Resume     (typable char when not paused)
//   printable      -> KeyStroke -> Correct | Mistake -> StatUpdate

type ModeKey =
	'ModeF1' | 'ModeF2' | 'ModeF3' | 'ModeF4' |
	'ModeF5' | 'ModeF7' | 'ModeF8' | 'ModeF12';

const MODE_KEYS : Record<number, ModeKey> = {
	112 : 'ModeF1',    // help (the help page itself has no data flow)
	113 : 'ModeF2',    // layout switch
	114 : 'ModeF3',    // keyboard type switch
	115 : 'ModeF4',    // mode dialog
	116 : 'ModeF5',    // settings dialog
	118 : 'ModeF7',    // stats reset
	119 : 'ModeF8',    // library dialog
	123 : 'ModeF12'    // loader log
};

// Ctrl+arrows, the era's lesson navigation (engine mooving_keys)
type NavKey = 'LessonPrev' | 'LessonNext' | 'BasePrev' | 'BaseNext';
const NAV_KEYS : Record<number, NavKey> = {
	37 : 'LessonPrev',   // ←
	39 : 'LessonNext',   // →
	38 : 'BasePrev',     // ↑
	40 : 'BaseNext'      // ↓
};

interface EventHandlerSelf {
	dispatchKey : (key : string | number, mods? : KeyMods, navId? : string) => unknown;
}

module.exports = function EventHandler(this: EventHandlerSelf) {

	// Params stay unannotated: EventHandlerSelf.dispatchKey types them
	// contextually, and tactica's param extractor skips untyped arrows —
	// EventHandler itself takes no constructor args.
	// navId: the era's "map_base_lesson" id AFTER its LessonNum move, handed
	// through for the nav records (LessonPrev/LessonNext/BaseNext carry it).
	this.dispatchKey = (key, mods = {}, navId) => {
		const session = utils.parent(this, 'Session') as SessionChain;
		const program = session.program;

		// F-keys: each an independent Session path. The table is explicit
		// (not session[name]) so every mode constructor stays a visible,
		// statically known reference.
		const modeCtors = {
			ModeF1  : session.ModeF1,
			ModeF2  : session.ModeF2,
			ModeF3  : session.ModeF3,
			ModeF4  : session.ModeF4,
			ModeF5  : session.ModeF5,
			ModeF7  : session.ModeF7,
			ModeF8  : session.ModeF8,
			ModeF12 : session.ModeF12
		};
		if (typeof key === 'number' && MODE_KEYS[ key ]) {
			return new (modeCtors[ MODE_KEYS[ key ] ])();
		}

		// Layout switch by pressing Alt+Shift / Ctrl+Shift — same path as F2.
		if ((mods.alt && mods.shift) || (mods.ctrl && mods.shift)) {
			return new session.ModeF2();
		}

		// View control: Ctrl+'+' / Ctrl+'-' — window-level, so Program.
		if (mods.ctrl && (key === '=' || key === '+' || key === 61 || key === 187)) {
			const view = new program!.ViewControl();
			return new view.ZoomIn();
		}
		if (mods.ctrl && (key === '-' || key === 173 || key === 189)) {
			const view = new program!.ViewControl();
			return new view.ZoomOut();
		}

		// Run control: Ctrl+arrows navigate lessons (←/→) and bases (↑/↓).
		const nav = typeof key === 'number' ? NAV_KEYS[ key ] : undefined;
		if (mods.ctrl && nav) {
			const runctl = new session.RunControl();
			if (nav === 'LessonPrev') { return new runctl.LessonPrev(navId); }
			if (nav === 'LessonNext') { return new runctl.LessonNext(navId); }
			return new runctl.BaseNext(nav === 'BasePrev' ? 'prev' : 'next', navId);
		}

		// Esc pauses a running lesson; when paused (or idle) it requests quit.
		// OPEN QUESTION: era snk.js:111 closes the window on Esc when not typing.
		if (key === 27 || key === 'Escape') {
			const runctl = new session.RunControl();
			return (session.run && !session.paused) ? new runctl.Pause() : new runctl.Quit();
		}

		// Space resumes a paused run; otherwise it is a typable character.
		if ((key === ' ' || key === 32) && session.paused) {
			const runctl = new session.RunControl();
			return new runctl.Resume();
		}

		// Typing: Session -> KeyStroke -> Correct | Mistake -> StatUpdate.
		// Modal dialogs (program-level windows) swallow keystrokes first.
		if (session.run && !session.paused &&
			(!program || !program.dialog) &&
			typeof key === 'string' && key.length === 1) {
			const keystroke = new session.KeyStroke(key);
			return key === session.expectedChar ?
				new keystroke.Correct() :
				new keystroke.Mistake();
		}

		return null;
	};
};

'use strict';

const { utils } = require('mnemonica');

import type { SessionChain } from '../../chain';

// Session.ModeF3 — typing mode switch. The era F3 (snk.changeTypingMode)
// toggles profile.TypingMode between 'native' (letter by letter) and
// 'paragraph' (by paragraph) — the same split as Run.Lesson/Book.Native
// and .Paragraph. This records the mode the switch produced.

interface ModeF3Self {
	typingMode : string;
}

module.exports = function ModeF3(this: ModeF3Self) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const program = session.program!;
	program.prefsDirty = true;
	this.typingMode = program.profile.TypingMode;
	// a run in progress switches its picking with it (same cursor)
	if (session.run) {
		session.run.pick = this.typingMode === 'paragraph' ? 'word' : 'letter';
	}
};

'use strict';

const { utils } = require('mnemonica');

import type { KeyStrokeChain, SessionChain } from '../../../../chain';

// KeyStroke.Mistake.StatUpdate — the era counting rules, moved into the
// chain (stage 4.5). Era app.js: errMode on -> just the error counter;
// errMode off -> count nothing, unless ErrAlwaysCount (then the mistake
// also counts as typed). The cursor does NOT advance on a mistake, so no
// LetterPick/WordPick follows — the same letter is expected again.

const StatUpdate = function (this: object) {
	const session = utils.parent(this, 'Session') as SessionChain;
	const keystroke = utils.parent(this, 'KeyStroke') as KeyStrokeChain;
	const profile = session.program ? session.program.profile : null;
	const errorControl = profile ? profile.errorControl : true;
	const countAlways = profile ? profile.countErrorsAlways : false;
	if (errorControl) {
		session.stats.errors += 1;
	} else if (countAlways) {
		session.stats.errors += 1;
		session.stats.typed += 1;
	}
	if (session.program) {
		new session.program.KeyFlash(keystroke.key);
	}
};

module.exports = StatUpdate;

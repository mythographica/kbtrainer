// chain.ts — the chain views.
//
// Handlers walk their ancestry with utils.parent(this, 'X') and then act
// on what the ancestor carries. mnemonica's static typing can only answer
// `object | undefined` for a hand-written handler `this`, so each handler
// narrows the answer to the views below — the DATA LINK contract of the
// graph, in the terms the models were designed around:
//
//   Session serves pressed keys + stats (and nothing else).
//   Program owns the window level: zoom, dialog, lights, logs, profile.
//   Timer  is the wall clock; Tick feeds the session it was born under.
//   Run    is the active lesson/book text cursor.
//
// Lowercase file name on purpose: topologica and tactica both skip it —
// it is not a type, it is the description of the links between types.

export interface StatsCells {
	typed     : number;
	correct   : number;
	errors    : number;
	timerCnt  : number;   // seconds, fed by Timer.Tick
	startedAt : number;
}

export interface ProfileCells {
	cntFull            : number;   // symbols typed at all since installation
	selectedMaps       : string[];
	currentMap         : string;   // era user.currentMap: the active language ('en', 'ru', …)
	TypingMode         : string;   // era user.TypingMode: 'native' | 'paragraph' (F3)
	hiderInterval      : number;
	errorControl       : boolean;
	oneErrorOnly       : boolean;
	countErrorsAlways  : boolean;
	skipNonTypable     : boolean;
	skin               : string;
	hideStatsOnPause   : boolean;
	// era user.js fields land here through the adoptUser accessors — the
	// profile is the prefs store, open to keyed writes (PrefSet).
	[ key : string ] : unknown;
}

export interface RunChain {
	title     : string;
	text      : string;
	words     : string[];
	pos       : number;
	wordIndex : number;
	pick      : string;   // 'letter' (native) | 'word' (paragraph)
	Finish    : new () => unknown;
	Lesson    : new () => LessonChain;
	Book      : new () => BookChain;
}

// Run.Lesson / Run.Book — the two branches of a run; each picks its cursor
// style (letter-by-letter, or letter cursor plus the word window).
export interface LessonChain {
	Native    : new (lessonId : string) => unknown;
	Paragraph : new (lessonId : string) => unknown;
}

export interface BookChain {
	Native    : new (name : string) => unknown;
	Paragraph : new (name : string) => unknown;
}

export interface ViewControlChain {
	ZoomIn  : new () => unknown;
	ZoomOut : new () => unknown;
}

export interface ProgramChain {
	dialog      : string | null;
	litKey      : string;
	flashKey    : string;
	zoom        : number;
	prefsDirty  : boolean;
	logs        : unknown[];
	library     : string[];
	profile     : ProfileCells;
	session     : SessionChain | null;
	windowState : unknown;   // last WindowState record
	KeyLight       : new (char : string) => unknown;
	KeyFlash       : new (key : string) => unknown;
	ViewControl    : new () => ViewControlChain;
	ModeDialog     : new () => unknown;
	SettingsDialog : new () => unknown;
	LibDialog      : new () => unknown;
}

export interface RunControlChain {
	Pause      : new () => unknown;
	Resume     : new () => unknown;
	Quit       : new () => unknown;
	BaseNext   : new (direction : string, lessonId? : string) => unknown;
	LessonNext : new (lessonId? : string) => unknown;
	LessonPrev : new (lessonId? : string) => unknown;
}

export interface KeyStrokeChain {
	key      : string;
	expected : string;
	Correct  : new () => unknown;
	Mistake  : new () => unknown;
}

// Program.LibDialog.BookDeleteRequest — deletion is a two-step chain;
// BookDeleted walks back to the request to confirm it.
export interface BookDeleteRequestChain {
	name    : string;
	pending : boolean;
}

export interface SessionChain {
	mode         : string;
	paused       : boolean;
	quitRequested : boolean;
	layoutIndex  : number;
	expectedChar : string;
	stats        : StatsCells;
	run          : RunChain | null;
	program      : ProgramChain | null;
	KeyStroke : new (key : string) => KeyStrokeChain;
	WordPick  : new () => unknown;
	LetterPick : new () => unknown;
	Run       : new (title : string, text : string, startPos? : number) => RunChain;
	RunControl : new () => RunControlChain;
	ModeF1  : new () => unknown;
	ModeF2  : new () => unknown;
	ModeF3  : new () => unknown;
	ModeF4  : new () => unknown;
	ModeF5  : new () => unknown;
	ModeF7  : new () => unknown;
	ModeF8  : new () => unknown;
	ModeF12 : new () => unknown;
}

export interface TimerChain {
	ticks   : number;
	session : SessionChain | null;
}

// Key event modifiers as the router sees them (era keyCodes surface).
export interface KeyMods {
	alt?   : boolean;
	ctrl?  : boolean;
	shift? : boolean;
}

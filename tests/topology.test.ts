import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { utils } from "mnemonica";
import type { TypeRegistry } from "mnemonica";
import { createKbCollection } from "../src/domain/collection";
import { loadTopology, type Topology } from "../src/domain/loadTopology";
import type { BootedProgram, LiveSession } from "../src/domain/store";
import { globModels } from "../src/domain/globModels";

const require = createRequire(import.meta.url);
// The REAL topologica loader, walking electron/models on disk.
const topologica = require("@mnemonica/topologica");

const here = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.resolve(here, "../models");

// Structural shape: nested type names only (paths differ between the fs
// loader and the glob replay, names must not).
type Shape = Record<string, Shape>;
const shapeOf = (kids: Array<{ name: string; kids: unknown[] }>): Shape => {
	const out: Shape = {};
	for (const kid of kids) {
		out[kid.name] = shapeOf(kid.kids as Array<{ name: string; kids: unknown[] }>);
	}
	return out;
};

// Two separate collections: the same type names can be declared again.
const loadViaTopologica = () => {
	const collection = createKbCollection();
	const { topology } = topologica(MODELS_DIR, collection.define.bind(collection));
	return topology as Topology;
};

const loadViaAdapter = () => {
	const collection = createKbCollection();
	return loadTopology(collection.define.bind(collection), globModels()).topology;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Bootstrap wiring: three sibling roots joined by data links.
// The topology nodes ARE the collection's constructors (define()d at load
// time), but TopoNode.type is `any` — the annotations restate the registry
// signatures so the roots are born typed, no `as any` construction.
const makeWorld = (topology: Topology) => {
	const ProgramCtor: TypeRegistry["Program"] = topology.Program.type;
	const SessionCtor: TypeRegistry["Session"] = topology.Session.type;
	const TimerCtor: TypeRegistry["Timer"] = topology.Timer.type;
	const program: BootedProgram = new ProgramCtor({ version: "2.1.0" });
	const session = new SessionCtor(program) as LiveSession;
	const timer = new TimerCtor(session);
	program.session = session;
	return { program, session, timer };
};

const startLesson = (session: LiveSession, text = "ab") => {
	const run = new session.Run("L1", text);
	new (new run.Lesson()).Native("L1");
	return run;
};

describe("models topology (real topologica loader)", () => {
	const topology = loadViaTopologica();

	it("defines three sibling roots: Program, Session, Timer", () => {
		expect(Object.keys(topology).sort()).toEqual(["Program", "Session", "Timer"]);
	});

	it("Session serves pressed keys + stats only", () => {
		const shape = shapeOf(topology.Session.kids);
		expect(Object.keys(shape).sort()).toEqual([
			"EventHandler", "KeyStroke", "LetterPick",
			"ModeF1", "ModeF12", "ModeF2", "ModeF3", "ModeF4",
			"ModeF5", "ModeF7", "ModeF8", "Run", "RunControl", "WordPick"
		].sort());
		expect(Object.keys(shape.KeyStroke).sort()).toEqual(["Correct", "Mistake"]);
		expect(Object.keys(shape.Run).sort()).toEqual(["Book", "Finish", "Lesson", "Vocabulary"]);
		expect(Object.keys(shape.Run.Lesson).sort()).toEqual(["Native", "Paragraph"]);
		expect(Object.keys(shape.Run.Book).sort()).toEqual(["Native", "Paragraph"]);
	});

	it("Program serves the visual/window level", () => {
		const shape = shapeOf(topology.Program.kids);
		expect(Object.keys(shape).sort()).toEqual([
			"FileDialog", "KeyFlash", "KeyLight", "LibDialog", "Log",
			"ModeDialog", "SettingsDialog", "UserProfile", "ViewControl", "WindowState"
		].sort());
	});

	it("Timer holds the per-second Tick", () => {
		const shape = shapeOf(topology.Timer.kids);
		expect(Object.keys(shape)).toEqual(["Tick"]);
	});
});

describe("renderer adapter parity", () => {
	it("replays the same graph the real loader builds", () => {
		const real = loadViaTopologica();
		const replay = loadViaAdapter();
		expect(shapeOf(replay.Program.kids)).toEqual(shapeOf(real.Program.kids));
		expect(shapeOf(replay.Session.kids)).toEqual(shapeOf(real.Session.kids));
		expect(shapeOf(replay.Timer.kids)).toEqual(shapeOf(real.Timer.kids));
	});
});

describe("event surface (the no-cheating seed)", () => {
	const topology = loadViaTopologica();

	it("wires three sibling roots via data links", () => {
		const { program, session, timer } = makeWorld(topology);
		expect(session.program).toBe(program);
		expect(program.session).toBe(session);
		expect(timer.session).toBe(session);
		expect(program.profile.hiderInterval).toBe(200);
		expect(utils.parent(session.handler, "Session")).toBe(session);
	});

	it("routes F-keys: session paths producing program windows", () => {
		const { program, session } = makeWorld(topology);
		session.handler.dispatchKey(112);
		expect(program.dialog).toBe("help");
		session.handler.dispatchKey(116);
		expect(program.dialog).toBe("settings");
		session.handler.dispatchKey(113);
		expect(session.layoutIndex).toBe(1);
		expect(program.profile.selectedMaps[session.layoutIndex]).toBe("ru.standard");
		session.handler.dispatchKey(123);
		expect(program.dialog).toBe("loaderlog");
	});

	it("routes Alt+Shift / Ctrl+Shift to the same path as F2", () => {
		const { session } = makeWorld(topology);
		session.handler.dispatchKey("", { alt: true, shift: true });
		expect(session.layoutIndex).toBe(1);
		session.handler.dispatchKey("", { ctrl: true, shift: true });
		expect(session.layoutIndex).toBe(0);
	});

	it("types a correct keystroke through KeyStroke -> Correct -> StatUpdate -> LetterPick", () => {
		const { program, session } = makeWorld(topology);
		startLesson(session);
		expect(program.litKey).toBe("a"); // the first key lights at run start
		const correct = session.handler.dispatchKey("a");
		expect(session.stats.typed).toBe(1);
		expect(session.stats.correct).toBe(1);
		expect(session.stats.errors).toBe(0);
		expect(session.expectedChar).toBe("b");
		expect(correct.key).toBe("a");
		expect(correct.statUpdate.next.char).toBe("b");
		expect(program.litKey).toBe("b"); // session produced a Program KeyLight
		expect(utils.parent(correct, "Session")).toBe(session);
	});

	it("types a mistake: no advance, the wrong key flashes on the keyboard", () => {
		const { program, session } = makeWorld(topology);
		startLesson(session);
		const mistake = session.handler.dispatchKey("x");
		// era rules (stage 4.5): errorControl on -> only the error counter
		// moves; typed stays (a mistake is not typed text)
		expect(session.stats.typed).toBe(0);
		expect(session.stats.errors).toBe(1);
		expect(session.expectedChar).toBe("a");
		expect(mistake.key).toBe("x");
		expect(mistake.expected).toBe("a");
		expect(program.flashKey).toBe("x"); // session produced a Program KeyFlash
	});

	it("counts a mistake as typed only under countErrorsAlways (era !errMode path)", () => {
		const { program, session } = makeWorld(topology);
		program.profile.errorControl = false;
		startLesson(session);
		session.handler.dispatchKey("x");
		expect(session.stats.typed).toBe(0);
		expect(session.stats.errors).toBe(0);
		program.profile.countErrorsAlways = true;
		session.handler.dispatchKey("x");
		expect(session.stats.typed).toBe(1);
		expect(session.stats.errors).toBe(1);
	});

	it("finishes the run on the last letter, enriched with aggregated stats", () => {
		const { session } = makeWorld(topology);
		startLesson(session);
		session.handler.dispatchKey("a");
		session.handler.dispatchKey("b");
		expect(session.run).toBe(null);
		expect(session.stats.typed).toBe(2);
		expect(session.stats.correct).toBe(2);
	});

	it("pauses on Esc, resumes on Space, quits on Esc when paused", () => {
		const { session } = makeWorld(topology);
		startLesson(session);
		session.handler.dispatchKey(27);
		expect(session.paused).toBe(true);
		session.handler.dispatchKey(" ");
		expect(session.paused).toBe(false);
		session.handler.dispatchKey(27);
		expect(session.paused).toBe(true);
		session.handler.dispatchKey(27);
		expect(session.quitRequested).toBe(true);
	});

	it("zooms with Ctrl+'+'/'-' at program level and marks prefs dirty", () => {
		const { program, session } = makeWorld(topology);
		session.handler.dispatchKey("=", { ctrl: true });
		expect(program.zoom).toBeCloseTo(1.1);
		session.handler.dispatchKey("-", { ctrl: true });
		session.handler.dispatchKey("-", { ctrl: true });
		expect(program.zoom).toBeCloseTo(0.9);
		expect(program.prefsDirty).toBe(true);
	});

	it("walks the lesson base with Ctrl+arrows", () => {
		const { session } = makeWorld(topology);
		session.handler.dispatchKey(39, { ctrl: true });
		session.handler.dispatchKey(39, { ctrl: true });
		expect(session.lessonIndex).toBe(2);
		session.handler.dispatchKey(37, { ctrl: true });
		expect(session.lessonIndex).toBe(1);
	});

	it("keeps keystrokes out of the run while a dialog window is open", () => {
		const { session } = makeWorld(topology);
		startLesson(session);
		session.handler.dispatchKey(116); // F5: settings
		expect(session.handler.dispatchKey("a")).toBe(null);
		expect(session.stats.typed).toBe(0);
	});

	it("feeds the lesson counter from Timer.Tick only while running", () => {
		const { session, timer } = makeWorld(topology);
		new timer.Tick();
		expect(session.stats.timerCnt).toBe(0); // no run: wall clock only
		startLesson(session);
		session.handler.dispatchKey("a");
		const tick = new timer.Tick();
		expect(session.stats.timerCnt).toBe(1);
		expect(tick.speed).toBe(60); // era formula: typed / timerCnt * 60
		session.handler.dispatchKey(27); // pause
		new timer.Tick();
		expect(session.stats.timerCnt).toBe(1); // paused: no bump
	});

	it("F7 resets the session stats", () => {
		const { session } = makeWorld(topology);
		startLesson(session);
		session.handler.dispatchKey("a");
		session.handler.dispatchKey(118);
		expect(session.stats).toMatchObject({ typed: 0, correct: 0, errors: 0, timerCnt: 0 });
	});
});

describe("endpoints", () => {
	const topology = loadViaTopologica();

	it("validates hiderInterval 51..998 and never poisons the chain", () => {
		const { program, session } = makeWorld(topology);
		const dialog = new program.SettingsDialog();
		new dialog.PrefSet("hiderInterval", 300);
		expect(program.profile.hiderInterval).toBe(300);
		expect(program.prefsDirty).toBe(true);
		expect(() => new dialog.PrefSet("hiderInterval", 10)).toThrow(RangeError);
		expect(() => new dialog.PrefSet("hiderInterval", 999)).toThrow(RangeError);
		// blockErrors: false — the chain must survive a throwing constructor:
		const run = new session.Run("L1", "ab");
		expect(run.title).toBe("L1");
	});

	it("runs the library dialog chain: import, mark, delete request -> deleted", () => {
		const { program } = makeWorld(topology);
		const dialog = new program.LibDialog();
		new dialog.BookImport("War and Peace");
		expect(program.library).toEqual(["War and Peace"]);
		const mark = new dialog.BookMark("War and Peace");
		expect(mark.marked).toBe(true);
		expect(program.profile.bookmarks).toEqual(["War and Peace"]);
		const request = new dialog.BookDeleteRequest("War and Peace");
		expect(request.pending).toBe(true);
		new request.BookDeleted();
		expect(program.library).toEqual([]);
	});

	it("starts a book run from the mode dialog (a book is a lesson)", () => {
		const { program, session } = makeWorld(topology);
		const dialog = new program.ModeDialog();
		new dialog.ModeSet("book");
		expect(session.mode).toBe("book");
		expect(() => new dialog.ModeSet("vocabulary")).toThrow(RangeError);
		const pick = new dialog.BookPick("Story", "once upon");
		expect(session.mode).toBe("book");
		expect(session.run.title).toBe("Story");
		expect(pick.run.book).toBe("Story");
		expect(utils.parent(pick.run, "Run")).toBe(session.run);
	});

	it("Vocabulary is defined but throws (not implemented)", () => {
		const { session } = makeWorld(topology);
		const run = new session.Run("V", "x");
		expect(() => new run.Vocabulary()).toThrow(/not implemented/);
	});

	it("records program logs", () => {
		const { program } = makeWorld(topology);
		new program.Log("definition of: Session", "topologica");
		expect(program.logs).toHaveLength(1);
		expect(program.logs[0].source).toBe("topologica");
	});
});

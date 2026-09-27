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

// a typed key's StatUpdate runs as a microtask after Correct|Mistake; a real
// key event is its own task, so the browser drains it before the next key.
// type() dispatches one key and awaits the same drain.
const settle = () => new Promise<void>((resolve) => { queueMicrotask(resolve); });
const type = async (session: LiveSession, key: string) => {
	const result = session.handler.dispatchKey(key);
	await settle();
	return result;
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
			"BookMark", "FileDialog", "KeyFlash", "KeyLight", "LibDialog", "Log",
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
		// help and the loader log open non-modal windows: no program.dialog
		const help = session.handler.dispatchKey(112);
		expect(program.dialog).toBe(null);
		expect(typeof help.openedAt).toBe("number");
		session.handler.dispatchKey(116);
		expect(program.dialog).toBe("settings");
		// F2 records the switch the era already made (kb.changeMap moves
		// currentMap first) and points the layout index at it
		program.profile.currentMap = "ru";
		const f2 = session.handler.dispatchKey(113);
		expect(f2.layout).toBe("ru");
		expect(session.layoutIndex).toBe(1);
		expect(program.profile.selectedMaps[session.layoutIndex]).toBe("ru.standard");
		const f12 = session.handler.dispatchKey(123);
		expect(f12.entries).toBe(program.logs.length);
		expect(program.dialog).toBe("settings");
	});

	it("routes Alt+Shift / Ctrl+Shift to the same path as F2", () => {
		const { program, session } = makeWorld(topology);
		program.profile.currentMap = "ru";
		session.handler.dispatchKey("", { alt: true, shift: true });
		expect(session.layoutIndex).toBe(1);
		program.profile.currentMap = program.profile.selectedMaps[0].split(".")[0];
		session.handler.dispatchKey("", { ctrl: true, shift: true });
		expect(session.layoutIndex).toBe(0);
	});

	it("F3 records the typing mode the era switch produced", () => {
		const { program, session } = makeWorld(topology);
		program.profile.TypingMode = "paragraph";
		const f3 = session.handler.dispatchKey(114);
		expect(f3.typingMode).toBe("paragraph");
		expect(program.prefsDirty).toBe(true);
	});

	it("the file selector hands program.dialog back to the dialog underneath", () => {
		const { program, session } = makeWorld(topology);
		new session.ModeF8(); // the library is open
		expect(program.dialog).toBe("lib");
		const fileDialog = new program.FileDialog();
		expect(program.dialog).toBe("file");
		const pick = new fileDialog.FilePick("/books/b.txt");
		expect(pick.filePath).toBe("/books/b.txt");
		fileDialog.close();
		expect(program.dialog).toBe("lib");
	});

	it("types a correct keystroke through KeyStroke -> Correct -> StatUpdate -> LetterPick", async () => {
		const { program, session } = makeWorld(topology);
		startLesson(session);
		expect(program.litKey).toBe("a"); // the first key lights at run start
		const correct = await type(session, "a");
		expect(session.stats.typed).toBe(1);
		expect(session.stats.correct).toBe(1);
		expect(session.stats.errors).toBe(0);
		expect(session.expectedChar).toBe("b");
		expect(correct.key).toBe("a");
		expect(correct.statUpdate.next.char).toBe("b");
		expect(program.litKey).toBe("b"); // session produced a Program KeyLight
		expect(utils.parent(correct, "Session")).toBe(session);
	});

	it("types a mistake: no advance, the wrong key flashes on the keyboard", async () => {
		const { program, session } = makeWorld(topology);
		startLesson(session);
		const mistake = await type(session, "x");
		// era rules (stage 4.5): errorControl on -> only the error counter
		// moves; typed stays (a mistake is not typed text)
		expect(session.stats.typed).toBe(0);
		expect(session.stats.errors).toBe(1);
		expect(session.expectedChar).toBe("a");
		expect(mistake.key).toBe("x");
		expect(mistake.expected).toBe("a");
		expect(program.flashKey).toBe("x"); // session produced a Program KeyFlash
	});

	it("counts a mistake as typed only under countErrorsAlways (era !errMode path)", async () => {
		const { program, session } = makeWorld(topology);
		program.profile.errorControl = false;
		startLesson(session);
		await type(session, "x");
		expect(session.stats.typed).toBe(0);
		expect(session.stats.errors).toBe(0);
		program.profile.countErrorsAlways = true;
		await type(session, "x");
		expect(session.stats.typed).toBe(1);
		expect(session.stats.errors).toBe(1);
	});

	it("finishes the run on the last letter, enriched with aggregated stats", async () => {
		const { session } = makeWorld(topology);
		startLesson(session);
		await type(session, "a");
		await type(session, "b");
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

	it("routes Ctrl+arrows to lesson (←/→) and base (↑/↓) navigation", () => {
		const { session } = makeWorld(topology);
		const next = session.handler.dispatchKey(39, { ctrl: true });
		expect(utils.parent(next, "RunControl")).toBeDefined();
		expect(next.lessonId).toBe(null); // the router cannot know where the era moved
		const prev = session.handler.dispatchKey(37, { ctrl: true });
		expect(prev.lessonId).toBe(null);
		expect(session.handler.dispatchKey(38, { ctrl: true }).direction).toBe("prev");
		expect(session.handler.dispatchKey(40, { ctrl: true }).direction).toBe("next");
	});

	it("navigation records where the era moved the lesson", () => {
		const { session } = makeWorld(topology);
		const runctl = new session.RunControl();
		expect(new runctl.LessonNext("en_base0_4").lessonId).toBe("en_base0_4");
		expect(new runctl.LessonPrev("en_base0_3").lessonId).toBe("en_base0_3");
		const base = new runctl.BaseNext("next", "en_base1_0");
		expect(base.direction).toBe("next");
		expect(base.lessonId).toBe("en_base1_0");
		expect(() => new runctl.BaseNext("left")).toThrow(RangeError);
	});

	it("keeps keystrokes out of the run while a dialog window is open", () => {
		const { session } = makeWorld(topology);
		startLesson(session);
		session.handler.dispatchKey(116); // F5: settings
		expect(session.handler.dispatchKey("a")).toBe(null);
		expect(session.stats.typed).toBe(0);
	});

	it("Timer.Tick snapshots the speed and never bumps the lesson counter", async () => {
		const { session, timer } = makeWorld(topology);
		expect(new timer.Tick().speed).toBe(0); // counter not running yet
		startLesson(session);
		await type(session, "a");
		session.stats.timerCnt = 1; // the engine's app.counter() bumps it
		const tick = new timer.Tick();
		expect(session.stats.timerCnt).toBe(1); // Tick only reads it
		expect(tick.speed).toBe(60); // era formula: typed / timerCnt * 60
	});

	it("a Run resumes at its start position and keeps the session stats", async () => {
		const { program, session } = makeWorld(topology);
		startLesson(session);
		await type(session, "a");
		expect(session.stats.typed).toBe(1);
		// a book resuming at its bookmark: the era keeps the stats across
		// restarts — only the first start and F7 zero them
		const run = new session.Run("Book", "hello world", 6);
		new (new run.Book()).Native("/lib/book_1.txt");
		expect(run.pos).toBe(6);
		expect(session.expectedChar).toBe("w");
		expect(program.litKey).toBe("w");
		expect(session.stats.typed).toBe(1);
		await type(session, "w");
		expect(run.pos).toBe(7);
		expect(session.expectedChar).toBe("o");
	});

	it("F3 switches a running run between letter and word picking", async () => {
		const { program, session } = makeWorld(topology);
		startLesson(session, "ab cd");
		expect(session.run!.pick).toBe("letter");
		program.profile.TypingMode = "paragraph"; // the era toggle ran first
		session.handler.dispatchKey(114);
		expect(session.run!.pick).toBe("word");
		const correct = await type(session, "a");
		expect(correct.statUpdate.next.word).toBe("ab");
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
		const request = new dialog.BookDeleteRequest("War and Peace");
		expect(request.pending).toBe(true);
		new request.BookDeleted();
		expect(program.library).toEqual([]);
	});

	it("records a bookmark: the typing position saved into a book", () => {
		const { program } = makeWorld(topology);
		const mark = new program.BookMark("/lib/book_3.txt", 1234);
		expect(mark.path).toBe("/lib/book_3.txt");
		expect(mark.position).toBe(1234);
		expect(utils.parent(mark, "Program")).toBe(program);
	});

	it("records the mode dialog's selections without starting a run", () => {
		const { program, session } = makeWorld(topology);
		const dialog = new program.ModeDialog();
		new dialog.ModeSet("book");
		expect(session.mode).toBe("book");
		expect(() => new dialog.ModeSet("vocabulary")).toThrow(RangeError);
		// era: a click only selects; the run starts at app.restart
		const book = new dialog.BookPick("/lib/book_2.txt");
		expect(book.path).toBe("/lib/book_2.txt");
		const lesson = new dialog.LessonPick("en_base0_3");
		expect(lesson.lessonId).toBe("en_base0_3");
		expect(session.run).toBe(null);
	});

	it("Run.Vocabulary records the pasted run (resurrected mode)", () => {
		const { session } = makeWorld(topology);
		const run = new session.Run("Vocabulary", "pasted text", 0);
		const voc = new run.Vocabulary(11);
		expect(voc.chars).toBe(11);
		const vocDefault = new run.Vocabulary();
		expect(vocDefault.chars).toBe(0);
	});

	it("records program logs", () => {
		const { program } = makeWorld(topology);
		new program.Log("definition of: Session", "topologica");
		expect(program.logs).toHaveLength(1);
		expect(program.logs[0].source).toBe("topologica");
	});
});

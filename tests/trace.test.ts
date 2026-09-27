import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createKbCollection } from "../src/domain/collection";
import { bootStoreWith } from "../src/domain/store";

/* eslint-disable @typescript-eslint/no-explicit-any */

// The strategy-stage wiring proof: otel attachHooks drives dive over OUR
// collection, so every chain construction records a 'create' edge — the
// exact stream the strategy channel's traceSubscribe pushes to
// mnemographica.
//
// The parentage contract (probed, not wished): an edge parents on the
// mnemonica CHAIN parent's latest edge (hookData.existentInstance). Our
// three roots are data-linked siblings (passed as constructor args), so
// they open separate branches; a type born inside its parent's constructor
// (UserProfile, EventHandler, StatUpdate) has no parent edge YET and lands
// parentless; KeyFlash is deliberately constructed from program — the
// visual-feedback branch hangs off the Program root, exactly as designed.

const require = createRequire(import.meta.url);
const topologica = require("@mnemonica/topologica");
const { attachHooks } = require("@mnemonica/otel");
const dive = require("@mnemonica/dive");

// dive 0.10 has no ring to read back: completed history is collected and the
// full stream rides the hook channel. The collector below is the same
// 'create' event stream the strategy channel's traceSubscribe pushes to
// mnemographica — the test pins the wiring against the live channel shape.
// Registered per-world: dive.clear() wipes all subscribers, so the hook
// must be (re-)attached after every clear (dive's own documented contract).
const edges: any[] = [];

const here = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.resolve(here, "../models");

const makeWorld = () => {
	dive.clear(); // the trace store is process-global; each world starts empty
	edges.length = 0;
	dive.registerHook("create", ({ edge }: any) => { edges.push(edge); });
	const collection = createKbCollection();
	const { topology } = topologica(MODELS_DIR, collection.define.bind(collection));
	attachHooks(collection);
	return bootStoreWith({ clock: false }, collection, topology);
};

// a key's StatUpdate runs as a microtask after Correct|Mistake; a real key
// event is its own task, so the browser drains it before the next key —
// tests await the same drain
const settle = () => new Promise<void>((resolve) => { queueMicrotask(resolve); });

const traceNames = () => edges.map((e: any) => e.name);
const byName = (name: string) => edges.filter((e: any) => e.name === name);
const edgeById = (id: number) => edges.find((e: any) => e.id === id);

describe("strategy trace wiring (attachHooks over the kb collection)", () => {

	it("opens the trace with the boot: roots as siblings, children first", () => {
		makeWorld();
		const names = traceNames();
		// children born inside their parents' constructors appear first
		expect(names).toEqual(["UserProfile", "Program", "EventHandler", "Session", "Timer"]);
		// the roots are data-linked siblings — separate branches by design
		for (const name of ["Program", "Session", "Timer"]) {
			expect(edgeById(byName(name)[0].parentId as number)).toBeUndefined();
		}
	});

	it("a correct keystroke records Session -> KeyStroke -> Correct -> StatUpdate", async () => {
		const { session } = makeWorld();
		session.expectedChar = "j";
		const keystroke = new session.KeyStroke("j");
		new keystroke.Correct();
		expect(byName("StatUpdate")).toHaveLength(0); // queued, not yet built
		await settle();

		const ks = byName("KeyStroke")[0];
		const correct = byName("Correct")[0];
		const statUpdate = byName("StatUpdate")[0];
		expect(edgeById(ks.parentId).name).toBe("Session");
		expect(correct.parentId).toBe(ks.id);
		// built on committed data, after Correct's own edge exists
		expect(statUpdate.parentId).toBe(correct.id);
	});

	it("a mistake records the Mistake branch; KeyFlash hangs off Program", async () => {
		const { session } = makeWorld();
		session.expectedChar = "j";
		const keystroke = new session.KeyStroke("x");
		new keystroke.Mistake();
		await settle();

		const ks = byName("KeyStroke")[0];
		const mistake = byName("Mistake")[0];
		const statUpdate = byName("StatUpdate")[0];
		const keyFlash = byName("KeyFlash")[0];
		expect(mistake.parentId).toBe(ks.id);
		expect(statUpdate.parentId).toBe(mistake.id); // built after Mistake
		// the visual event is a PROGRAM-level construction, by design
		expect(edgeById(keyFlash.parentId).name).toBe("Program");
	});

	it("Timer.Tick ticks under the Timer root, independent of the session", () => {
		const { timer } = makeWorld();
		new timer.Tick();
		const tick = edges[edges.length - 1];
		expect(tick.name).toBe("Tick");
		expect(edgeById(tick.parentId).name).toBe("Timer");
	});

	it("Esc/Space record Session -> RunControl -> Pause/Resume and flip session.paused", () => {
		const { session } = makeWorld();
		expect(session.paused).toBe(false);
		new (new session.RunControl()).Pause();  // Esc
		expect(session.paused).toBe(true);
		new (new session.RunControl()).Resume(); // Space
		expect(session.paused).toBe(false);

		const rcEdges = byName("RunControl");
		const pause = byName("Pause")[0];
		const resume = byName("Resume")[0];
		expect(rcEdges.length).toBe(2);
		// both RunControls hang off the Session root's edge
		for (const rc of rcEdges) {
			expect(edgeById(rc.parentId).name).toBe("Session");
		}
		expect(rcEdges.map((e: any) => e.id)).toContain(pause.parentId);
		expect(rcEdges.map((e: any) => e.id)).toContain(resume.parentId);
		// Pause was born under the FIRST RunControl, Resume under the second
		expect(pause.parentId).toBe(rcEdges[0].id);
		expect(resume.parentId).toBe(rcEdges[1].id);
	});

	it("Esc while idle records RunControl -> Quit and raises quitRequested", () => {
		const { session } = makeWorld();
		expect(session.quitRequested).toBe(false);
		new (new session.RunControl()).Quit();
		expect(session.quitRequested).toBe(true);
		const rc = byName("RunControl")[0];
		const quit = byName("Quit")[0];
		expect(edgeById(rc.parentId).name).toBe("Session");
		expect(quit.parentId).toBe(rc.id);
	});

	it("edges carry the JSON-safe fields the channel maps", () => {
		const { session } = makeWorld();
		session.expectedChar = "j";
		new (new session.KeyStroke("j")).Correct();
		const edge = edges[edges.length - 1];
		expect(typeof edge.id).toBe("number");
		expect(edge.kind).toBe("create");
		expect(edge.status).toBe("ok");
		expect(typeof edge.ts).toBe("number");
		// and the instance is a real mnemonica instance with a flow branch
		expect(dive.getFlow(edge.instance).length).toBeGreaterThan(0);
	});

});

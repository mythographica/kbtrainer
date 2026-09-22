import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createKbCollection } from "../src/domain/collection";
import { bootStoreWith } from "../src/domain/store";

/* eslint-disable @typescript-eslint/no-explicit-any */

// The store façade: three sibling roots over the real models/ tree, the
// era-user adoption (accessor delegation onto program.profile), and the
// per-second Timer.Tick clock. Booted the same way the preload boots it —
// real topologica on disk (the glob replay's parity is proven in
// topology.test.ts).

const require = createRequire(import.meta.url);
const topologica = require("@mnemonica/topologica");

const here = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.resolve(here, "../models");

const bootStore = (options: { clock?: boolean; clockMs?: number } = {}) => {
	const collection = createKbCollection();
	const { topology } = topologica(MODELS_DIR, collection.define.bind(collection));
	return bootStoreWith(options, collection, topology);
};

describe("kbstore façade", () => {
	it("boots three sibling roots wired by data links", () => {
		const store = bootStore({ clock: false });
		expect(Object.keys(store.topology).sort()).toEqual(["Program", "Session", "Timer"]);
		expect(store.session.program).toBe(store.program);
		expect(store.program.session).toBe(store.session);
		expect(store.timer.session).toBe(store.session);
		expect(store.program.profile.hiderInterval).toBe(200);
	});

	it("adopts the era user: data fields delegate onto program.profile", () => {
		const store = bootStore({ clock: false });
		const save = () => undefined;
		const user: Record<string, any> = { wsT: 200, skin: "native", save };
		store.adoptUser(user);
		// the era default seeded the profile
		expect(store.program.profile.wsT).toBe(200);
		// a write via the era global lands on the instance
		user.wsT = 300;
		expect(store.program.profile.wsT).toBe(300);
		// a write via the instance reads back through the era global
		store.program.profile.skin = "pink";
		expect(user.skin).toBe("pink");
		// functions stay data properties, fields stay enumerable (for..in)
		expect(user.save).toBe(save);
		expect(Object.prototype.propertyIsEnumerable.call(user, "wsT")).toBe(true);
	});

	it("keeps with(user) working through the accessors", () => {
		const store = bootStore({ clock: false });
		const user: Record<string, any> = { hiderInterval: 200 };
		store.adoptUser(user);
		// new Function bodies are non-strict, so `with` is allowed there
		const read = new Function("u", "with(u){ return hiderInterval; }");
		const write = new Function("u", "v", "with(u){ hiderInterval = v; }");
		expect(read(user)).toBe(200);
		write(user, 500);
		expect(store.program.profile.hiderInterval).toBe(500);
	});

	it("maps the renamed era prefs onto the canonical profile fields", () => {
		const store = bootStore({ clock: false });
		const user: Record<string, any> = {
			errMode: true, oneErrOnly: true, ErrAlwaysCount: false, skipNonTypedCharacters: false
		};
		store.adoptUser(user);
		// era defaults seeded the canonical cells
		expect(store.program.profile.errorControl).toBe(true);
		expect(store.program.profile.skipNonTypable).toBe(false);
		// write via era name, read the canonical field the models use
		user.errMode = false;
		expect(store.program.profile.errorControl).toBe(false);
		// and back
		store.program.profile.oneErrorOnly = false;
		expect(user.oneErrOnly).toBe(false);
	});

	it("adopts the era stats cells: vars delegate onto session.stats", () => {
		const store = bootStore({ clock: false });
		const vars: Record<string, any> = { cntSess: 0, cntErr: 0, timerCnt: 0, strArr: {} };
		store.adoptVars(vars);
		vars.cntSess++;
		expect(store.session.stats.typed).toBe(1);
		store.session.stats.errors = 3;
		expect(vars.cntErr).toBe(3);
		vars.timerCnt = 42;
		expect(store.session.stats.timerCnt).toBe(42);
		// non-stats vars stay plain data properties
		vars.strArr.pos = 7;
		expect(vars.strArr.pos).toBe(7);
	});

	it("runs the per-second Tick clock; inert until a run exists", () => {
		vi.useFakeTimers();
		try {
			const store = bootStore({ clock: true, clockMs: 1000 });
			vi.advanceTimersByTime(3000);
			expect(store.timer.ticks).toBe(3);
			expect(store.session.stats.timerCnt).toBe(0); // no run: wall clock only
			const run = new store.session.Run("L1", "ab");
			new (new run.Lesson()).Native("L1");
			vi.advanceTimersByTime(2000);
			expect(store.session.stats.timerCnt).toBe(2);
			store.stopClock();
			vi.advanceTimersByTime(2000);
			expect(store.timer.ticks).toBe(5); // stopped: no more ticks
		} finally {
			vi.useRealTimers();
		}
	});
});

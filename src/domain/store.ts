// kbstore — the mnemonica-backed domain store (stage 4.1), bootable from
// any JS context that can supply a collection + a topology.
//
// Since the strategy stage the LIVE app boots this in the Electron preload
// (full Node: real topologica on the models/ tree, otel attachHooks, the
// strategy WS channel — one process, one mnemonica, one dive). The vite
// kbstore bundle is gone; tests boot the same core with a glob-replayed
// topology (tests/topology.test.ts proves glob ≡ topologica).
//
// The roots are constructed through collection.lookup() — the typed
// channel: the .tactica/registry.ts augmentation makes
// collection.lookup('Session') answer the real constructor signature, and
// tactica records both the lookup and the instantiation into usages.json:
//
//   program = new ProgramCtor({ version, screen })
//   session = new SessionCtor(program)   // born knowing its program
//   timer   = new TimerCtor(session)     // born knowing whom to feed
//   program.session = session
//
// era interop: adoptUser(user) replaces the era user object's data fields
// with accessors delegating onto program.profile — the mnemonica instance
// becomes the single source of truth while `with(user) {...}` and
// user.save()/user.load() keep working untouched (loader.js runs
// `kbstore.adoptUser(user)` as the user.js evaler).
//
// The per-second clock constructs a fresh Timer.Tick every second; the era
// engine keeps its own timers until stage 4.5 — Tick is inert (wall clock
// only) until a domain run exists.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Topology } from "./loadTopology";
import type { KbCollection } from "./collection";
import type { Program, Session, Session_EventHandler, Timer } from "../../.tactica/types";
import type { StatsCells } from "../../models/chain";

export interface ScreenSize {
	width : number;
	height : number;
}

export interface BootOptions {
	version? : string;
	screen? : ScreenSize;
	clock? : boolean;   // default: on when a DOM window exists
	clockMs? : number;  // default: 1000
}

// The generated instance types carry what tactica could infer from the
// handler bodies; three cells are honest runtime upgrades of that floor:
//   program.session — born null, wired to the session at bootstrap
//   session.stats   — inferred `object` from the literal; the era stats
//                     cells are the actual contract (models/chain.ts)
//   session.handler — born `new this.EventHandler()`; the models cannot
//                     name that type (models never read .tactica), we can
export type BootedProgram = Omit<Program, "session"> & { session : LiveSession | null };
export type LiveSession = Omit<Session, "stats" | "handler"> & {
	stats : StatsCells;
	handler : Session_EventHandler;
};

export interface KbStore {
	collection : KbCollection;
	topology : Topology;
	program : BootedProgram;
	session : LiveSession;
	timer : Timer;
	adoptUser : (user : Record<string, any>) => void;
	adoptVars : (vars : Record<string, any>) => void;
	stopClock : () => void;
}

// era user name -> canonical UserProfile field. The era names stay the
// public surface (user.errMode, with(user) and all); the accessors land on
// the canonical profile cells the domain models read.
export const USER_ALIASES : Record<string, string> = {
	errMode : "errorControl",
	oneErrOnly : "oneErrorOnly",
	ErrAlwaysCount : "countErrorsAlways",
	skipNonTypedCharacters : "skipNonTypable"
};

// era vars stats cells -> session.stats. After adoption the domain session
// owns the numbers; era reads/writes (vars.cntSess++ in the engine,
// vars.cntErr = 0 on F7, ...) land there through the accessors.
export const VARS_STATS : Record<string, string> = {
	cntSess : "typed",
	cntErr : "errors",
	timerCnt : "timerCnt"
};

export const bootStoreWith = (options : BootOptions, collection : KbCollection, topology : Topology) : KbStore => {

	const ProgramCtor = collection.lookup("Program");
	const SessionCtor = collection.lookup("Session");
	const TimerCtor = collection.lookup("Timer");

	const program : BootedProgram = new ProgramCtor({
		version : options.version || "",
		screen : options.screen || null
	});
	const session = new SessionCtor(program) as LiveSession;
	const timer : Timer = new TimerCtor(session);
	program.session = session;

	// era user -> program.profile: each data field becomes an accessor on
	// the era object reading/writing the profile instance. Fields listed in
	// USER_ALIASES land on the canonical profile field instead of a
	// same-named one. Functions (save/load) stay data properties.
	const adoptUser = (user : Record<string, any>) : void => {
		const profile = program.profile;
		for (const key of Object.keys(user)) {
			if (typeof user[key] === "function") { continue; }
			const target = USER_ALIASES[key] || key;
			profile[target] = user[key]; // the era default seeds the profile
			Object.defineProperty(user, key, {
				get : () => profile[target],
				set : (value : any) => { profile[target] = value; },
				enumerable : true,
				configurable : true
			});
		}
	};

	// era vars stats -> session.stats (stage 4.5: the domain owns the
	// session numbers; vars.cntSess/cntErr/timerCnt become views)
	const adoptVars = (vars : Record<string, any>) : void => {
		const { stats } = session;
		for (const key of Object.keys(VARS_STATS)) {
			if (!(key in vars)) { continue; }
			const target = VARS_STATS[key] as keyof StatsCells;
			stats[target] = vars[key];
			Object.defineProperty(vars, key, {
				get : () => stats[target],
				set : (value : any) => { stats[target] = value; },
				enumerable : true,
				configurable : true
			});
		}
	};

	let clockId : ReturnType<typeof setInterval> | null = null;
	const wantClock = options.clock !== undefined ?
		options.clock :
		typeof window !== "undefined";
	if (wantClock) {
		clockId = setInterval(() => { new timer.Tick(); }, options.clockMs || 1000);
	}

	return {
		collection,
		topology,
		program,
		session,
		timer,
		adoptUser,
		adoptVars,
		stopClock : () => {
			if (clockId !== null) {
				clearInterval(clockId);
				clockId = null;
			}
		}
	};
};

// window.kbstore — the domain store surface the preload publishes.
//
// preload.ts (full Node, same window) boots bootStoreWith() and exposes
// every KbStore field except the collection, plus a `store` back-reference
// to the whole thing and the era->profile pref name map. engine.ts is a
// script (no imports), so the global is declared here and shared by every
// renderer file through tsconfig.json.
import type { KbStore } from "../domain/store";

declare global {
	var kbstore : Omit<KbStore, "collection"> & { store : KbStore; userAliases : Record<string, string> };
}

export {};

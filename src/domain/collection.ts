import { createTypesCollection } from 'mnemonica';
import type { TypesCollection, TypeRegistry } from 'mnemonica';

// The kbTrainer types collection factory.
//
// blockErrors: false — a throwing constructor (PrefSet validation, the
// not-implemented Vocabulary mode) must propagate as a plain JS error.
// mnemonica's default (blockErrors: true) instead grafts an errored
// instance onto the PARENT, poisoning the session chain: every later
// construction from it rethrows. That is mnemonica's documented
// error-as-data semantics, but it is the wrong one for a live app session.
//
// The TypeRegistry generic is the module augmentation .tactica/registry.ts
// merges into 'mnemonica' (kept in every tsconfig's include): from here on
// collection.lookup('Session.KeyStroke') answers the typed constructor.
export type KbCollection = TypesCollection<TypeRegistry>;

export const createKbCollection = (): KbCollection =>
	createTypesCollection<TypeRegistry>({ blockErrors: false });

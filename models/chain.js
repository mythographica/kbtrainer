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
export {};

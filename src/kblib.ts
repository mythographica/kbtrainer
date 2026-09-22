// IIFE bundle entry: vite builds this to app/bin/kblib.js, exposing
// window.kblib = { prefsGet, prefsSet, fitScale, lz, timeHMS, countPerc,
// speed, parseMapFileName, selectedMapsPair, nextMap, mapChangerMatch }
// to the era renderer code.
export { prefsGet, prefsSet } from "./lib/prefs";
export { fitScale } from "./lib/fit";
export { lz, timeHMS, countPerc, speed } from "./lib/stats";
export { parseMapFileName, selectedMapsPair, nextMap, mapChangerMatch } from "./lib/keymap";

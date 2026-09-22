// Pure cores of the kb.js map bookkeeping (app/bin/kb.js): map filename
// parsing (mapsLoader), the selected-maps pair (loadselectedmaps), map
// cycling (changeMap) and the modifier-combo matcher (changeMapKeysPressed).
// Era quirks preserved; kb.js keeps the DOM/loader plumbing and delegates.

export interface MapFileName {
	lang: string;
	name: string | undefined;
	mapName: string;
}

// "map.en.standard.js" -> { lang: "en", name: "standard" }; null when not a
// map.*.js file. The era loader matched on the lowercased name (x.nlc), so
// the returned names are lowercase too. Era extra-dot quirk: only the first
// two dot-parts are used — "map.en.us.dvorak.js" -> lang "en", name "us".
export function parseMapFileName(fileName: string): MapFileName | null {
	const nlc = String(fileName).toLowerCase();
	if (nlc.substr(fileName.length - 3, 3) !== ".js") { return null; }
	if (nlc.substr(0, 4) !== "map.") { return null; }
	const mapName = nlc.substr(4, fileName.length - 7);
	const parts = mapName.split(".");
	return { lang: parts[0], name: parts[1], mapName };
}

export interface SelectedMaps {
	maps: string[];
	currentMap: string;
	corrected: boolean;
}

// loadselectedmaps: selected maps like "en.standard" -> the two-slot
// user.maps pair of languages. When the current map is not in the pair it
// falls back to the first language (era also mirrors kb.current_map then,
// and only then — hence the `corrected` flag).
export function selectedMapsPair(selectedMaps: string[], currentMap: string): SelectedMaps {
	let str = "";
	for (const smp of selectedMaps) {
		str += smp.split(".")[0] + "|";
	}
	const parts = str.split("|");
	const maps = [parts[0], parts[1]];
	let cur = currentMap;
	let corrected = false;
	if (cur != parts[0] && cur != parts[1]) {
		cur = parts[0];
		corrected = true;
	}
	return { maps, currentMap: cur, corrected };
}

// changeMap: cycle to the next language in the pair, wrapping at the end.
// Era gate: until a map was ever active (kb.current_map == "") the cycle is
// a no-op and the current map stays as-is. Unknown current map: untouched.
export function nextMap(maps: string[], currentMap: string, activeMap: string): string {
	if (activeMap === "") { return currentMap; }
	for (let k = 0; k < maps.length; k++) {
		if (maps[k] == currentMap) {
			return (k + 1) < maps.length ? maps[k + 1] : maps[0];
		}
	}
	return currentMap;
}

export interface ChKeys {
	ctk: boolean;
	shk: boolean;
	alk: boolean;
}

// changeMapKeysPressed: the just-released keyCode force-sets its flag on top
// of the tracked state (17 ctrl, 16 shift, 18 alt), then the combo is
// compared against user.mapChanger — loosely on purpose, mc holds 0/1 ints
// from prefs. On match the tracked flags reset to all-false; otherwise the
// tracked state is returned untouched (keydown owns it).
export function mapChangerMatch(
	mc: Array<number | boolean>,
	chKeys: ChKeys,
	keyCode: number
): { matched: boolean; chKeys: ChKeys } {
	let { ctk, shk, alk } = chKeys;
	if (keyCode == 17) { ctk = true; }
	if (keyCode == 16) { shk = true; }
	if (keyCode == 18) { alk = true; }
	if (mc[0] == ctk && mc[1] == shk && mc[2] == alk) {
		return { matched: true, chKeys: { ctk: false, shk: false, alk: false } };
	}
	return { matched: false, chKeys };
}

var kblib = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/lib/prefs.ts
	function prefsGet(raw, id) {
		const lines = String(raw).split("\r\n");
		for (const line of lines) {
			const el = line.split(":::");
			if (el[0] === id) return el[1];
		}
	}
	function prefsSet(raw, id, value) {
		const lines = String(raw).split("\r\n");
		let found = false;
		for (let i = 0; i < lines.length; i++) {
			const el = lines[i].split(":::");
			if (el[0] === id) {
				lines[i] = el[0] + ":::" + value;
				found = true;
				break;
			}
		}
		if (!found) lines.push(id + ":::" + value);
		const out = [];
		for (const line of lines) if (line !== "") out.push(line);
		return out.join("\r\n") + "\r\n";
	}
	//#endregion
	//#region src/lib/fit.ts
	function fitScale(iw, ih, dw, dh) {
		const s = Math.min(iw / dw, ih / dh);
		return {
			s,
			ox: Math.max(0, Math.round((iw - dw * s) / 2)),
			oy: Math.max(0, Math.round((ih - dh * s) / 2)),
			transform: s === 1 ? "" : "scale(" + s + ")"
		};
	}
	//#endregion
	//#region src/lib/stats.ts
	function lz(str) {
		if (str.length === 1) str = "0" + str;
		return str;
	}
	function timeHMS(par, nt) {
		const h = "" + Math.floor(par / 3600);
		const m = "" + Math.floor(par / 60);
		const s = "" + (par - 60 * Math.floor(par / 60));
		const hh = lz(h);
		const mm = lz(m);
		const ss = lz(s);
		let ht, mt, st;
		if (nt !== void 0) {
			ht = hh + nt[0].substr(0, 2);
			mt = mm + nt[1].substr(0, 2);
			st = ss + nt[2].substr(0, 2);
		} else {
			ht = hh + "h";
			mt = mm + "m";
			st = ss + "s";
		}
		return {
			h,
			m,
			s,
			hh,
			mm,
			ss,
			ht,
			mt,
			st,
			str: hh + " : " + mm + " : " + ss,
			stt: ht + " : " + mt + " : " + st
		};
	}
	function countPerc(parCh, parZn, divs = ".") {
		let perc = 0;
		if (parCh === void 0 || parZn === void 0) perc = 0;
		if (parZn !== 0) perc = parCh / parZn * 100;
		else perc = 0;
		if (parCh == 0) perc = 0;
		if (perc < 0) perc = 0;
		const parts = ("" + perc).split(".");
		if (parts.length === 1) parts[1] = "00";
		return "" + parts[0] + divs + parts[1].substr(0, 2);
	}
	function speed(cntSess, timerCnt) {
		return timerCnt > 0 ? Math.round(cntSess / timerCnt * 60) : 0;
	}
	//#endregion
	//#region src/lib/keymap.ts
	function parseMapFileName(fileName) {
		const nlc = String(fileName).toLowerCase();
		if (nlc.substr(fileName.length - 3, 3) !== ".js") return null;
		if (nlc.substr(0, 4) !== "map.") return null;
		const mapName = nlc.substr(4, fileName.length - 7);
		const parts = mapName.split(".");
		return {
			lang: parts[0],
			name: parts[1],
			mapName
		};
	}
	function selectedMapsPair(selectedMaps, currentMap) {
		let str = "";
		for (const smp of selectedMaps) str += smp.split(".")[0] + "|";
		const parts = str.split("|");
		const maps = [parts[0], parts[1]];
		let cur = currentMap;
		let corrected = false;
		if (cur != parts[0] && cur != parts[1]) {
			cur = parts[0];
			corrected = true;
		}
		return {
			maps,
			currentMap: cur,
			corrected
		};
	}
	function nextMap(maps, currentMap, activeMap) {
		if (activeMap === "") return currentMap;
		for (let k = 0; k < maps.length; k++) if (maps[k] == currentMap) return k + 1 < maps.length ? maps[k + 1] : maps[0];
		return currentMap;
	}
	function mapChangerMatch(mc, chKeys, keyCode) {
		let { ctk, shk, alk } = chKeys;
		if (keyCode == 17) ctk = true;
		if (keyCode == 16) shk = true;
		if (keyCode == 18) alk = true;
		if (mc[0] == ctk && mc[1] == shk && mc[2] == alk) return {
			matched: true,
			chKeys: {
				ctk: false,
				shk: false,
				alk: false
			}
		};
		return {
			matched: false,
			chKeys
		};
	}
	//#endregion
	exports.countPerc = countPerc;
	exports.fitScale = fitScale;
	exports.lz = lz;
	exports.mapChangerMatch = mapChangerMatch;
	exports.nextMap = nextMap;
	exports.parseMapFileName = parseMapFileName;
	exports.prefsGet = prefsGet;
	exports.prefsSet = prefsSet;
	exports.selectedMapsPair = selectedMapsPair;
	exports.speed = speed;
	exports.timeHMS = timeHMS;
	return exports;
})({});

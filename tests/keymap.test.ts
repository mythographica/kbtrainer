import { describe, it, expect } from "vitest";
import { parseMapFileName, selectedMapsPair, nextMap, mapChangerMatch } from "../src/lib/keymap";

describe("parseMapFileName", () => {
	it("parses lang.name", () => {
		expect(parseMapFileName("map.en.standard.js"))
			.toEqual({ lang: "en", name: "standard", mapName: "en.standard" });
	});
	it("lowercases like the era loader (x.nlc)", () => {
		expect(parseMapFileName("map.EN.Standard.JS"))
			.toEqual({ lang: "en", name: "standard", mapName: "en.standard" });
	});
	it("keeps the era extra-dot quirk: only the first two parts used", () => {
		expect(parseMapFileName("map.en.us.dvorak.js"))
			.toEqual({ lang: "en", name: "us", mapName: "en.us.dvorak" });
	});
	it("rejects non-map files", () => {
		expect(parseMapFileName("skin.js")).toBeNull();
		expect(parseMapFileName("xmap.en.js")).toBeNull();
		expect(parseMapFileName("map.en.standard.css")).toBeNull();
	});
});

describe("selectedMapsPair", () => {
	it("builds the two-language pair and keeps a valid currentMap", () => {
		const r = selectedMapsPair(["en.standard", "ru.standard"], "ru");
		expect(r.maps).toEqual(["en", "ru"]);
		expect(r.currentMap).toBe("ru");
		expect(r.corrected).toBe(false);
	});
	it("falls back to the first language and flags the correction", () => {
		const r = selectedMapsPair(["en.standard", "ru.standard"], "ua");
		expect(r.maps).toEqual(["en", "ru"]);
		expect(r.currentMap).toBe("en");
		expect(r.corrected).toBe(true);
	});
});

describe("nextMap", () => {
	it("advances and wraps", () => {
		expect(nextMap(["en", "ru"], "en", "en")).toBe("ru");
		expect(nextMap(["en", "ru"], "ru", "ru")).toBe("en");
	});
	it("is a no-op until a map was active (era kb.current_map gate)", () => {
		expect(nextMap(["en", "ru"], "en", "")).toBe("en");
	});
	it("leaves an unknown current map alone", () => {
		expect(nextMap(["en", "ru"], "ua", "en")).toBe("ua");
	});
});

describe("mapChangerMatch", () => {
	it("matches a ctrl release against a [1,0,0] combo and resets flags", () => {
		const r = mapChangerMatch([1, 0, 0], { ctk: false, shk: false, alk: false }, 17);
		expect(r.matched).toBe(true);
		expect(r.chKeys).toEqual({ ctk: false, shk: false, alk: false });
	});
	it("combines the released key with tracked modifiers", () => {
		const r = mapChangerMatch([1, 1, 0], { ctk: false, shk: true, alk: false }, 17);
		expect(r.matched).toBe(true);
	});
	it("discards the local flag when the combo does not match", () => {
		const before = { ctk: false, shk: false, alk: false };
		const r = mapChangerMatch([0, 0, 0], before, 17);
		expect(r.matched).toBe(false);
		expect(r.chKeys).toBe(before);
		expect(r.chKeys.ctk).toBe(false);
	});
	it("a mismatched tracked modifier breaks the combo", () => {
		const r = mapChangerMatch([1, 0, 0], { ctk: false, shk: true, alk: false }, 17);
		expect(r.matched).toBe(false);
	});
});

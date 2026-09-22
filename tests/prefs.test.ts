import { describe, expect, it } from "vitest";
import { prefsGet, prefsSet } from "../src/lib/prefs";

describe("prefsGet", () => {
	it("reads an existing key", () => {
		expect(prefsGet("a:::1\r\nb:::2\r\n", "b")).toBe("2");
	});

	it("returns undefined for a missing key", () => {
		expect(prefsGet("a:::1\r\n", "nope")).toBeUndefined();
	});

	it("returns the first of duplicate keys", () => {
		expect(prefsGet("a:::1\r\na:::2\r\n", "a")).toBe("1");
	});

	it("stops the value at the next ':::' (era semantics)", () => {
		expect(prefsGet("x:::a:::b\r\n", "x")).toBe("a");
	});
});

describe("prefsSet", () => {
	it("replaces an existing key in place", () => {
		expect(prefsSet("a:::1\r\nb:::2\r\n", "a", "9")).toBe("a:::9\r\nb:::2\r\n");
	});

	it("appends an unknown key", () => {
		expect(prefsSet("a:::1\r\n", "c", "3")).toBe("a:::1\r\nc:::3\r\n");
	});

	it("drops empty lines on write", () => {
		expect(prefsSet("a:::1\r\n\r\nb:::2\r\n", "a", "7")).toBe("a:::7\r\nb:::2\r\n");
	});

	it("writes into an empty file", () => {
		expect(prefsSet("", "x", "1")).toBe("x:::1\r\n");
	});

	it("round-trips through prefsGet", () => {
		const raw = prefsSet("a:::1\r\n", "hideStatsOnPause", "true");
		expect(prefsGet(raw, "hideStatsOnPause")).toBe("true");
		expect(prefsGet(raw, "a")).toBe("1");
	});
});

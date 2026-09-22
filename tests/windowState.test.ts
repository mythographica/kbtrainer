import { describe, expect, it } from "vitest";
import { parseWindowState, serializeWindowState } from "../src/lib/windowState";

describe("parseWindowState", () => {
	it("parses a valid state", () => {
		expect(parseWindowState('{"w":760,"h":280}')).toEqual({ w: 760, h: 280 });
	});

	it("rejects non-JSON", () => {
		expect(parseWindowState("not json")).toBeNull();
	});

	it("rejects missing fields", () => {
		expect(parseWindowState("{}")).toBeNull();
	});

	it("rejects non-positive sizes", () => {
		expect(parseWindowState('{"w":-5,"h":280}')).toBeNull();
		expect(parseWindowState('{"w":760,"h":0}')).toBeNull();
	});

	it("rejects non-numeric fields", () => {
		expect(parseWindowState('{"w":"760","h":280}')).toBeNull();
	});

	it("rejects null", () => {
		expect(parseWindowState("null")).toBeNull();
	});
});

describe("serializeWindowState", () => {
	it("rounds and serializes", () => {
		expect(serializeWindowState(836.4, 307.6)).toBe('{"w":836,"h":308}');
	});

	it("round-trips through parseWindowState", () => {
		expect(parseWindowState(serializeWindowState(900, 400))).toEqual({ w: 900, h: 400 });
	});
});

import { describe, it, expect } from "vitest";
import { lz, timeHMS, countPerc, speed } from "../src/lib/stats";

describe("lz", () => {
	it("pads single chars", () => {
		expect(lz("5")).toBe("05");
	});
	it("leaves longer strings and empty alone", () => {
		expect(lz("12")).toBe("12");
		expect(lz("")).toBe("");
	});
});

describe("timeHMS", () => {
	it("formats zero", () => {
		const t = timeHMS(0);
		expect(t.str).toBe("00 : 00 : 00");
		expect(t.stt).toBe("00h : 00m : 00s");
	});
	it("formats h/m/s", () => {
		expect(timeHMS(75).str).toBe("00 : 01 : 15");
	});
	it("keeps the era quirk: minutes are floor(par/60), not mod 60", () => {
		const t = timeHMS(3661);
		expect(t.m).toBe("61");
		expect(t.str).toBe("01 : 61 : 01");
	});
	it("uses 2-char localized labels when given", () => {
		const t = timeHMS(5, ["hours", "minutes", "seconds"]);
		expect(t.stt).toBe("00ho : 00mi : 05se");
	});
});

describe("countPerc", () => {
	it("truncates to two decimals (string split, not rounding)", () => {
		expect(countPerc(1, 3)).toBe("33.33");
		expect(countPerc(1, 6)).toBe("16.66");
	});
	it("keeps a single decimal as-is", () => {
		expect(countPerc(1, 8)).toBe("12.5");
	});
	it("pads integers with 00", () => {
		expect(countPerc(2, 5)).toBe("40.00");
	});
	it("guards zero and negative", () => {
		expect(countPerc(0, 5)).toBe("0.00");
		expect(countPerc(5, 0)).toBe("0.00");
		expect(countPerc(-1, 5)).toBe("0.00");
	});
	it("keeps the era NaN path for an undefined numerator", () => {
		expect(countPerc(undefined, 5)).toBe("NaN.00");
	});
	it("honors the division separator", () => {
		expect(countPerc(1, 4, ",")).toBe("25,00");
	});
});

describe("speed", () => {
	it("is 0 before the first timer tick", () => {
		expect(speed(100, 0)).toBe(0);
	});
	it("rounds chars-per-minute", () => {
		expect(speed(245, 60)).toBe(245);
		expect(speed(100, 61)).toBe(98);
	});
});

import { describe, expect, it } from "vitest";
import { fitScale } from "../src/lib/fit";

describe("fitScale", () => {
	it("exact fit: no transform, no offset", () => {
		expect(fitScale(760, 280, 760, 280)).toEqual({ s: 1, ox: 0, oy: 0, transform: "" });
	});

	it("pillarboxes a wide window (s capped by height)", () => {
		expect(fitScale(1520, 280, 760, 280)).toEqual({ s: 1, ox: 380, oy: 0, transform: "" });
	});

	it("letterboxes a tall window (s capped by width)", () => {
		expect(fitScale(760, 560, 760, 280)).toEqual({ s: 1, ox: 0, oy: 140, transform: "" });
	});

	it("scales down a too-small window", () => {
		expect(fitScale(380, 140, 760, 280)).toEqual({ s: 0.5, ox: 0, oy: 0, transform: "scale(0.5)" });
	});

	it("the real 891x328 boot size: height limits, offsets round to 0", () => {
		const r = fitScale(891, 328, 760, 280);
		expect(r.s).toBeCloseTo(1.1714, 4);
		expect(r.ox).toBe(0);
		expect(r.oy).toBe(0);
		expect(r.transform).toBe("scale(" + r.s + ")");
	});
});

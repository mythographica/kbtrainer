import { describe, expect, it } from "vitest";
import {
	clampToArea,
	clampPos,
	centeredXY,
	initialContentSize,
	zoomSize,
	DESIGN_W,
	DESIGN_H
} from "../src/lib/geometry";

describe("initialContentSize", () => {
	it("scales the design canvas to a 1400x900 work area", () => {
		expect(initialContentSize({ width: 1400, height: 900 }, null))
			.toEqual({ w: 891, h: 328 });
	});

	it("shrinks below the design canvas on a tiny screen", () => {
		expect(initialContentSize({ width: 800, height: 600 }, null))
			.toEqual({ w: 594, h: 219 });
	});

	it("caps the scale factor at 2x on huge screens", () => {
		expect(initialContentSize({ width: 8000, height: 6000 }, null))
			.toEqual({ w: DESIGN_W * 2, h: DESIGN_H * 2 });
	});

	it("prefers the remembered size", () => {
		expect(initialContentSize({ width: 1400, height: 900 }, { w: 900, h: 400 }))
			.toEqual({ w: 900, h: 400 });
	});

	it("clamps the remembered size to the work area", () => {
		expect(initialContentSize({ width: 1400, height: 900 }, { w: 5000, h: 400 }))
			.toEqual({ w: 1400, h: 400 });
	});
});

describe("clampToArea", () => {
	it("rounds and clamps both axes", () => {
		expect(clampToArea(1000.4, 500.6, { width: 900, height: 600 }))
			.toEqual({ w: 900, h: 501 });
	});
});

describe("centeredXY", () => {
	it("centers a 760x280 window on 1400x900", () => {
		expect(centeredXY({ x: 0, y: 0, width: 1400, height: 900 }, 760, 280))
			.toEqual({ x: 320, y: 310 });
	});

	it("respects a work-area offset (taskbar/dock)", () => {
		expect(centeredXY({ x: 0, y: 30, width: 1400, height: 870 }, 760, 280))
			.toEqual({ x: 320, y: 325 });
	});
});

describe("clampPos", () => {
	const area = { x: 0, y: 0, width: 1400, height: 900 };

	it("keeps an inside position untouched", () => {
		expect(clampPos(100, 100, 760, 280, area)).toEqual({ x: 100, y: 100 });
	});

	it("pulls an off-screen window back into the area", () => {
		expect(clampPos(1300, 800, 760, 280, area)).toEqual({ x: 640, y: 620 });
		expect(clampPos(-50, -50, 760, 280, area)).toEqual({ x: 0, y: 0 });
	});

	it("pins to the area corner when the window is larger than the area", () => {
		expect(clampPos(200, 200, 1600, 1000, area)).toEqual({ x: 0, y: 0 });
	});

	it("respects a work-area offset", () => {
		const docked = { x: 0, y: 30, width: 1400, height: 870 };
		expect(clampPos(1300, 900, 760, 280, docked)).toEqual({ x: 640, y: 620 });
	});
});

describe("zoomSize", () => {
	it("grows by the zoom factor", () => {
		expect(zoomSize({ w: 760, h: 280 }, true)).toEqual({ w: 836, h: 308 });
	});

	it("shrinks back to the original size", () => {
		expect(zoomSize({ w: 836, h: 308 }, false)).toEqual({ w: 760, h: 280 });
	});
});

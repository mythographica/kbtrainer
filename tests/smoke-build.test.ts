import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// §3d: the smoke harness is behind a build switch — the committed
// src/smoke-build.ts must keep SMOKE_BUILT = false. `npm run build:smoke`
// flips it only for the duration of one build (scripts/with-smoke-build.js
// restores it in a finally); this test catches an accidental commit of the
// ON state (which would silently ship a smoke-capable app).
describe("smoke build switch (reports/domain-wiring.md §3d)", () => {
	it("SMOKE_BUILT stays false in the committed tree", () => {
		const src = fs.readFileSync(path.join(__dirname, "..", "src", "smoke-build.ts"), "utf8");
		expect(src).toContain("export const SMOKE_BUILT = false;");
		expect(src).not.toContain("SMOKE_BUILT = true");
	});
});

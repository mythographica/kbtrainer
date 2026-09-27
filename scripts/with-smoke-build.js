// Flips src/smoke-build.ts to true for ONE build, then restores it — even
// when the build fails (the committed tree must never keep the ON state).
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const flagFile = path.join(__dirname, "..", "src", "smoke-build.ts");
const OFF = "// Build-time switch for the smoke harness (reports/domain-wiring.md §3d):\n" +
	"// the committed state is FALSE — a normal build does not even LOAD the\n" +
	"// harness when KBT_SMOKE is set. `npm run build:smoke` flips this to true\n" +
	"// for one build (and restores it), producing a smoke-capable dist.\n" +
	"export const SMOKE_BUILT = false;\n";
const ON = OFF.replace("SMOKE_BUILT = false", "SMOKE_BUILT = true");

fs.writeFileSync(flagFile, ON);
try {
	execSync("npm run build", { stdio: "inherit", cwd: path.join(__dirname, "..") });
	console.log("smoke build done: this dist answers KBT_SMOKE (flag restored to false)");
} finally {
	fs.writeFileSync(flagFile, OFF);
}

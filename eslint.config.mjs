// Formatting-only lint for the era renderer sources. Exists so edits stop
// depending on hand-matched 2008 whitespace: normalize indentation to tabs,
// drop trailing spaces, allow the era tab-then-spaces alignment style.
// Deliberately NO style rules that touch quotes/semantics, and no
// correctness rules — these files are being migrated, not policed.
export default [
	{
		// build outputs: lint the era sources, not the compiled files
		ignores: [
			"app/bin/kblib.js",     // vite build output
			"app/bin/kbstore.js",   // vite build output
			"app/bin/*Island.js",   // tsc build output (src/renderer/*.ts)
			"app/bin/engine.js",    // tsc build output (src/renderer/engine.ts)
			"app/bin/layouts.js",   // tsc build output (src/renderer/layouts.ts)
			"app/bin/skins.js",     // tsc build output (src/renderer/skins.ts)
			"app/bin/topIsland.js"  // tsc build output (src/renderer/topIsland.ts)
		]
	},
	{
		files: ["app/bin/*.js"],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "script" // era code: `with`, implicit globals
		},
		rules: {
			"indent": ["error", "tab", { "SwitchCase": 1 }],
			"no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
			"no-trailing-spaces": "error",
			"eol-last": ["error", "always"]
		}
	}
];

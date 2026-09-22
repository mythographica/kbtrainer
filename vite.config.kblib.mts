// Builds src/lib/* into app/bin/kblib.js — a single IIFE script the era
// renderer loads with a plain <script> tag (file:// safe, no modules).
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "src/kblib.ts",
			formats: ["iife"],
			name: "kblib"
		},
		outDir: "app/bin",
		emptyOutDir: false, // app/bin holds the app itself — never clean it
		minify: false,
		rollupOptions: {
			output: {
				entryFileNames: "kblib.js"
			}
		}
	},
	logLevel: "warn"
});

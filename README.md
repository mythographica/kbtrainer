# kbTrainer 2.1 — Electron edition

A port of the original **kbTrainer 2.1 HTA** (HTML Application for Windows,
2010) to [Electron](https://www.electronjs.org/). The trainer now runs as a
modern cross-platform desktop app (Linux / Windows / macOS) while keeping the
original code, skins, layouts, maps and lessons almost untouched.

## Run

```sh
npm install
npm start   # rebuilds dist/ via prestart, then launches Electron
```

## Architecture (TypeScript)

The main process is TypeScript (`src/`), compiled to `dist/` —
`package.json`'s `"main"` points at `dist/main.js`:

```
src/main.ts              window chrome, kbfs IPC bridge, boot
src/preload.ts           window.kbfs + window.moveTo/resizeTo polyfills
src/smoke.ts             scripted end-to-end smoke test (KBT_SMOKE)
src/renderer/            Vue-island logic (compiled by tsconfig.renderer.json
                         straight into app/bin/, loaded via <script>)
src/lib/geometry.ts      window sizing / centering / zoom math (pure)
src/lib/charset.ts       ADO.Stream charset names ↔ iconv-lite (pure)
src/lib/windowState.ts   remembered window size parse/serialize (pure)
src/lib/prefs.ts         user.txt "key:::value" get/set (pure; pf() core)
src/lib/fit.ts           design-canvas scale math (pure; kbFit core)
src/kblib.ts             IIFE entry — vite bundles src/lib to
                         app/bin/kblib.js (window.kblib) for the renderer
tests/                   vitest unit tests for src/lib (npm test)
dist/                    build output (git-ignored)
```

- `npm run build` — compile both configs (main + renderer),
  `npm run typecheck` — check only, `npm test` — vitest unit tests.
- The renderer app in `app/` stays 2010-style vanilla JS. New UI is added as
  **Vue 3 islands** (Vue 3.5 vendored at `app/jq/vue.global.prod.js`, no
  bundler): the help window `app/locale/help.html` (EN/RU toggle in place,
  no frameset) and all three dialogs — settings `app/bin/sets.html`, mode
  `app/bin/mode.html`, library `app/bin/lib.html` — each driven by a typed
  island in `src/renderer/` (compiled into `app/bin/` via
  `tsconfig.renderer.json`). The original `_sets.htm` / `_mode.htm` /
  `_lib.htm` stay as fallbacks. `PLAN.md` describes the staged migration
  plan (islands → typed core → full migration), each stage independently
  shippable.

## What was changed vs the HTA version

The app in `app/` is the content of `../binaries/kbTrainer_2.1.zip`, converted
to UTF-8, with these surgical adaptations (everything else is original code):

| HTA (2008) | Electron port |
|---|---|
| `<HTA:APPLICATION>` window chrome in `kb.hta` | `BrowserWindow` options in `src/main.ts` (entry page is `app/kb.html`) |
| `Scripting.FileSystemObject`, `WScript.Shell`, `ADODB.Stream` in `bin/alf.js` | synchronous `kbfs` bridge: `src/preload.ts` → IPC → Node `fs` + `iconv-lite` in `src/main.ts` (same public API: `pf`, `fs`, `api`) |
| ActiveX file-open dialog (+ `_fopn.htm` fallback) | native `dialog.showOpenDialogSync` via the bridge |
| `window.showModalDialog` for `_mode.htm` / `_lib.htm` / `_sets.htm` (separate fixed px windows) | `bin/kbDialog.js` — the dialog takes over the whole window (resized to the dialog's design dims, restored on close, no scrollbars), sharing live objects through `window.dialogArguments` (shim: `bin/kbDialogChild.js`); call sites in `bin/snk.js` got a close callback |
| Polling script loader with IE `readyState` sniffs (`bin/loader.js`) | same loader contract on `script.onload` chaining; `mix.nSCRIPT`/`nSTYLE` emulate `readyState` for `api.checkLoaded` |
| IE callable CSS rule collections `ss.rules(q)` (`bin/layouts.js`) | W3C `ss.cssRules[q]` |
| Fixed-size window (`maximizable=no`, app calls `window.resizeTo` on every state change) | Freely resizable window; `bin/fit.js` scales the skin's design canvas (`skins.dbw`×`skins.dbh`) into the window with a CSS `transform` — every skin works unchanged, no scrollbars, no px-locked layout. The app's own `resizeTo` calls (`layouts.resizer`, `skins.js`, the typing "hider") became `kbFit.apply()` |
| HTA window placement (`moveTo(200,300)` at boot, splash `resizeTo(270,75)` in kb.html, saved `wsL/wsT` positions) | Window always starts **screen-centered** and re-centers on every programmatic resize (`resizeCentered` in `src/main.ts`, math in `src/lib/geometry.ts`); `moveTo` coordinates and the boot splash resize are gone. Resizes are clamped to the work area — the window never grows past the screen |
| Fixed 760×280 design window for 1024×768 screens | First run: the design canvas is scaled to the actual screen (`initialContentSize` in `src/lib/geometry.ts`: 1024×768 baseline, ×2 cap, clamped to the work area) **before** the window is rendered; the size is then remembered in `window-state.json` (in the userData dir) and restored next run |
| — (new feature) | `Ctrl` + `+` / `Ctrl` + `-` grow/shrink the window in 1.1× steps (main-process `before-input-event`, so it works even while a dialog is open) — plus on-window **− / +** buttons left of the F1 button; the whole button row is measured from the real caption text and laid out left-to-right (`snk.layoutButtons`), no hard-coded px widths |
| PAUSE box (`objx.messager`, z-index 100) always covered the stats row | New pref **"Hide stats on pause"** (default **off**, `user.hideStatsOnPause`): the pause box moves into the measured gap below the stats row, shrunk to fit so it covers neither the stats nor the keyboard (restored on unpause); enabling the checkbox restores the classic full-cover look |
| `showModalDialog` child pages hard-coded to 2008 font metrics (`resizeTo(750,680)` in `_sets.htm` → clipped/scrollbars today) | `kbDialog.js` measures the rendered content on load (plus a few grow-only beats for asynchronously-loaded bits like the skin preview) and grows the window to fit — no scrollbars |
| `pf()` (prefs in `alf.js`) could only update keys already present in `user.txt` — prefs added by later versions were silently dropped | `pf()` appends unknown keys on write; `user.load()` guards the `DefaultSettings` branch with `== "true"` (the string `"false"` is truthy) |
| `window.open` with an absolute OS path for the help window (`snk.open_help`); per-language frameset pages (`locale/en/help.htm`, `locale/ru/help/*`) | One Vue island `app/locale/help.html` for both languages (in-place EN/RU toggle); `fs.filePath` produces a real `file://` URL. Plain **F1** now suffices (Shift was an HTA workaround — the HTA reserved bare F1), **Esc** closes the help window (handled in `src/main.ts`); the old frameset files stay in the tree as a fallback |

### Data locations

- App resources (maps, skins, layouts, lessons, locale) are read from `app/` —
  same as before.
- Writable data moved from "next to the .hta" to the per-user data dir
  (`app.getPath("userData")`, e.g. `~/.config/kbtrainer-electron/` on Linux):
  `user.txt` (preferences, original `key:::value` format) and `lib/` (book
  library).

### Notes & known quirks

- `window.alert/confirm/prompt` are Electron's native blocking dialogs —
  unchanged from HTA behavior. The smoke test neuters them to avoid blocking.
- Dev-mode Chromium security warnings (`webSecurity` off, no CSP) are muted
  via `ELECTRON_DISABLE_SECURITY_WARNINGS` — accepted by design: the app
  loads only its own local files. Verbose `MAIN:` boot logs need `KBT_DEBUG=1`.
- If no input method is configured (`GTK_IM_MODULE` unset), GTK's simple
  built-in input context is selected so Chromium doesn't warn about IBus;
  real IBus sessions are left untouched.
- `uncaughtException` / `unhandledRejection` in the main process log one
  line and exit non-zero; renderer errors surface via the console forwarder.
- `res/kbico.ico` (318 bytes) predates what Electron's nativeImage can read;
  the window icon warning is harmless.
- `disableHardwareAcceleration()` is set: the app is pure 2D DOM and this
  avoids broken GPU paths on headless or unusual drivers.
- Sound was already dead code in 2.1 (both `sound.*` calls are commented out).

## Smoke test

`src/smoke.ts` contains a scripted end-to-end test (boot → all three dialogs →
typing simulation → resize/zoom/centering → Vue help island → pause-stats →
state persistence) that runs when `KBT_SMOKE` points at a directory; each
stage is screenshotted there. Smoke runs use a throwaway userData profile, so
your real `user.txt` and `window-state.json` are untouched. Headless example:

```sh
npm run build && KBT_SMOKE=/tmp/kbt-shots xvfb-run -a -s "-screen 0 1400x900x24" \
  ./node_modules/.bin/electron . --no-sandbox
```

Watch for `SMOKE-OK` in the output. `KBT_PROBE=1` (together with
`KBT_SMOKE`) runs a shorter keyboard-only probe instead.

## Directory layout

```
src/        TypeScript main process + smoke test (see Architecture above)
tests/      vitest unit tests
dist/       compiled output (git-ignored)
app/        kbTrainer 2.1 itself (from ../binaries/kbTrainer_2.1.zip)
  kb.html   entry page (was kb.hta)
  bin/      kernel, loader, typing engine, dialogs, skins/layouts engines
  jq/       vendored libraries (jQuery 1.4.2, Vue 3.5 global build)
  maps/     keyboard maps (en/ru/ua, dvorak, typewriter)
  skins/    visual skins (CSS + JS)
  layouts/  virtual-keyboard layouts
  lessons/  bundled lessons (en/ru)
  locale/   UI strings and help (help.html Vue island + legacy en/ru pages)
```

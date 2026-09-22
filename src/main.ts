// kbTrainer 2.1 — Electron main process.
// Replaces everything the HTA runtime used to provide:
// window chrome (HTA:APPLICATION), FSO/ADODB file access (bin/alf.js)
// and the ActiveX file-open dialog.
import { app, BrowserWindow, dialog, ipcMain, screen } from "electron";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { decodeBuf, encodeStr } from "./lib/charset";
import { clampPos, clampToArea, initialContentSize, zoomSize, type Size } from "./lib/geometry";
import { parseWindowState, serializeWindowState, type WindowState } from "./lib/windowState";
import { runSmoke } from "./smoke";

// The app loads only its own local files, so Chromium's dev-mode security
// warnings (webSecurity off, no CSP, ...) are accepted by design — mute them.
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

// Without an IBus daemon, Chromium's GTK input glue warns once per run
// ("Unable to connect to ibus: The given address is empty") — including a
// late copy flushed by a child process at shutdown. Use GTK's simple built-in
// input context instead — but only when nothing is configured at all, so
// sessions that really use IBus (GTK_IM_MODULE=ibus, CJK input) stay untouched.
if (!process.env.GTK_IM_MODULE) {
	process.env.GTK_IM_MODULE = "gtk-im-context-simple";
}

// Last-resort error reporting: one concise line, then exit non-zero.
// IPC handlers have their own try/catch and return false like the HTA did;
// renderer errors surface through the console-message forwarder below.
process.on("uncaughtException", (err) => {
	console.error("FATAL uncaughtException: " + ((err && err.stack) || err));
	app.exit(1);
});
process.on("unhandledRejection", (reason) => {
	console.error("FATAL unhandledRejection: " + ((reason && (reason as Error).stack) || reason));
	app.exit(1);
});

// Smoke runs must not touch the real profile: fresh userData per run
if (process.env.KBT_SMOKE) {
	app.setPath("userData", fs.mkdtempSync(path.join(os.tmpdir(), "kbt-smoke-")));
}

// user.txt and lib/ live here (HTA kept them next to the .hta;
// an installed app cannot write next to itself, so userData it is)
const ROOT = app.getPath("userData");

// dist/ sits next to src/, one level below the old main.js location —
// everything that used to be "__dirname + app" goes through APP_DIR
const APP_DIR = path.join(__dirname, "..", "app");

// the last window size is remembered here (the HTA had a fixed size)
const STATE_FILE = path.join(ROOT, "window-state.json");

function loadWindowState(): WindowState | null {
	try {
		return parseWindowState(fs.readFileSync(STATE_FILE, "utf8"));
	} catch (err) {
		return null;
	}
}

// The app was designed for 1024x768; scale its design canvas to today's
// screen before the window is ever rendered (clamped to the work area)
function initialSize(): [number, number] {
	const area = screen.getPrimaryDisplay().workAreaSize;
	const s: Size = initialContentSize(area, loadWindowState());
	return [s.w, s.h];
}

// --- sync IPC: the kbfs bridge used by app/bin/alf.js -------------------
ipcMain.on("kbfs-root", (e) => { e.returnValue = ROOT; });
ipcMain.on("kbfs-apppath", (e) => { e.returnValue = APP_DIR; });

ipcMain.on("kbfs-exists", (e, p) => {
	try {
		const st = fs.statSync(p);
		e.returnValue = { isFile: st.isFile(), isDir: st.isDirectory(), size: st.size };
	} catch (err) { e.returnValue = false; }
});

ipcMain.on("kbfs-read", (e, p, charset) => {
	try { e.returnValue = decodeBuf(fs.readFileSync(p), charset); }
	catch (err) { e.returnValue = false; }
});

ipcMain.on("kbfs-write", (e, p, data, charset) => {
	try {
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, encodeStr(String(data), charset));
		e.returnValue = true;
	} catch (err) { e.returnValue = false; }
});

ipcMain.on("kbfs-delete", (e, p) => {
	try { fs.unlinkSync(p); e.returnValue = true; }
	catch (err) { e.returnValue = false; }
});

ipcMain.on("kbfs-mkdir", (e, p) => {
	try { fs.mkdirSync(p, { recursive: true }); e.returnValue = true; }
	catch (err) { e.returnValue = false; }
});

// files only, mirroring Enumerator over FSO Folder.files
ipcMain.on("kbfs-readdir", (e, p) => {
	try {
		const out: { name: string; path: string; size: number }[] = [];
		for (const name of fs.readdirSync(p)) {
			const full = path.join(p, name);
			try {
				const st = fs.statSync(full);
				if (st.isFile()) { out.push({ name: name, path: full, size: st.size }); }
			} catch (err) { /* skip */ }
		}
		e.returnValue = out;
	} catch (err) { e.returnValue = false; }
});

ipcMain.on("kbfs-dlg-open-text", (e) => {
	try {
		const r = dialog.showOpenDialogSync({
			title: "Open text file",
			properties: ["openFile"],
			filters: [
				{ name: "Text Files (*.txt)", extensions: ["txt"] },
				{ name: "All Files (*.*)", extensions: ["*"] }
			]
		});
		e.returnValue = (r && r.length) ? r[0] : false;
	} catch (err) { e.returnValue = false; }
});

// --- window chrome: kb.hta and app.js call moveTo/resizeTo --------------
// Every programmatic resize funnels through here: clamped to the work area,
// and the window keeps its OWN center. A window the user never moved starts
// screen-centered and stays so; a window they dragged somewhere zooms and
// reshapes around their spot instead of jumping back to the screen center.
function winWorkArea(win: BrowserWindow): Electron.Rectangle {
	return screen.getDisplayMatching(win.getBounds()).workArea;
}

function resizeAroundCenter(win: BrowserWindow, w: number, h: number): void {
	const area = winWorkArea(win);
	const c = clampToArea(w, h, area);
	// bounds and frame insets are read before resizing (constant
	// decorations), so the positioning below doesn't depend on async X11
	// bounds updates
	const pre = win.getBounds();
	const content = win.getContentSize();
	const padW = pre.width - content[0];
	const padH = pre.height - content[1];
	const cx = pre.x + pre.width / 2;
	const cy = pre.y + pre.height / 2;
	win.setContentSize(c.w, c.h);
	const p = clampPos(
		cx - (c.w + padW) / 2,
		cy - (c.h + padH) / 2,
		c.w + padW, c.h + padH, area
	);
	win.setPosition(p.x, p.y);
}

ipcMain.on("kb-win-resize", (e, w, h) => {
	const win = BrowserWindow.fromWebContents(e.sender);
	if (win) { resizeAroundCenter(win, w, h); }
});

ipcMain.on("kb-win-get-size", (e) => {
	const win = BrowserWindow.fromWebContents(e.sender);
	e.returnValue = win ? win.getContentSize() : [0, 0];
});

// a kbDialog modal overlay is open in the renderer: the window's own (x)
// then means "close the dialog" (era showModalDialog semantics), not "quit
// the app". The entry is dropped optimistically on use so a desync can
// never make the window unclosable.
const dialogOpen = new Set<number>();
ipcMain.on("kb-dialog-state", (e, open) => {
	if (open) { dialogOpen.add(e.sender.id); } else { dialogOpen.delete(e.sender.id); }
});

// HTA-era moveTo coordinates (skins.js restores saved wsL/wsT, defaulting
// to 50,200) are still ignored — honoring them would yank the boot-centered
// window to the top-left on every skin load. User drags need no code: they
// are the WM moving the window, and zoom no longer re-centers (see
// resizeAroundCenter), so a dragged position is respected naturally.
ipcMain.on("kb-win-move", () => { /* era no-op, see above */ });

// SINGLEINSTANCE="yes" in kb.hta
app.disableHardwareAcceleration(); // pure 2D DOM app; avoids broken GPU paths on headless/odd drivers
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
	app.quit();
} else {
	let mainWin: BrowserWindow | null = null;
	app.on("second-instance", () => {
		if (mainWin) {
			if (mainWin.isMinimized()) { mainWin.restore(); }
			mainWin.focus();
		}
	});

	app.whenReady().then(() => {
		const initSize = initialSize();
		const win = new BrowserWindow({
			width: initSize[0], height: initSize[1], center: true, // remembered or screen-scaled; born centered
			useContentSize: true,
			minWidth: 400, minHeight: 200,
			autoHideMenuBar: true,
			backgroundColor: "#f0f0f0",
			icon: path.join(APP_DIR, "res", "kbico.ico"),
			webPreferences: {
				preload: path.join(__dirname, "preload.js"), // dist/preload.js
				contextIsolation: false,   // 2010-era code touches window.* freely
				sandbox: false,            // preload boots domain store + strategy channel: needs full Node
				nodeIntegration: false,    // page scripts themselves stay unprivileged
				webSecurity: false         // file:// iframes (modal dialogs) must reach parent
			}
		});
		mainWin = win;

		// settings/mode/library overlays live INSIDE this window, so while one
		// is open the titlebar (x) closes the overlay, not the app
		win.on("close", (e) => {
			const id = win.webContents.id;
			if (dialogOpen.has(id)) {
				dialogOpen.delete(id);
				e.preventDefault();
				win.webContents.send("kb-close-dialog");
			}
		});
		// a reload drops any overlay: never keep a stale flag
		win.webContents.on("did-finish-load", () => dialogOpen.delete(win.webContents.id));

		// remember the window size across runs (debounced; covers manual
		// drags, Ctrl+- zoom and app-initiated resizes alike)
		let stateTimer: NodeJS.Timeout | null = null;
		win.on("resize", () => {
			if (stateTimer) { clearTimeout(stateTimer); }
			stateTimer = setTimeout(() => {
				try {
					const size = win.getContentSize();
					fs.writeFileSync(STATE_FILE, serializeWindowState(size[0], size[1]));
				} catch (err) { /* profile may be gone */ }
			}, 800);
		});

		// Ctrl + "+" / Ctrl + "-" grow/shrink the window around its own
		// center (kbFit rescales the content); with a kbDialog overlay open
		// the same keys zoom the dialog's content instead (bin/kbDialog.js)
		// and the window follows the content's both dimensions. Fires even
		// while a dialog iframe has focus. Either way the renderer records
		// the key as Program.ViewControl.ZoomIn/ZoomOut (preload's
		// kb-zoom-key / kb-zoom-dialog handlers).
		win.webContents.on("before-input-event", (e, input) => {
			if (input.type !== "keyDown" || !(input.control || input.meta) || input.alt) { return; }
			const code = input.code || "";
			const grow = (code === "Equal" || code === "NumpadAdd" || input.key === "+" || input.key === "=");
			const shrink = (code === "Minus" || code === "NumpadSubtract" || input.key === "-" || input.key === "_");
			if (!grow && !shrink) { return; }
			e.preventDefault();
			if (dialogOpen.has(win.webContents.id)) {
				win.webContents.send("kb-zoom-dialog", grow);
				return;
			}
			win.webContents.send("kb-zoom-key", grow);
			const size = win.getContentSize();
			const z = zoomSize({ w: size[0], h: size[1] }, grow);
			resizeAroundCenter(win, z.w, z.h);
		});
		const dbg = (...a: unknown[]) => { if (process.env.KBT_DEBUG) { console.log(...a); } };
		win.loadFile(path.join(APP_DIR, "kb.html"));
		dbg("MAIN: loadFile called");
		win.webContents.on("did-finish-load", () => dbg("MAIN: did-finish-load"));
		win.webContents.on("did-fail-load", (e, code, desc) => console.log("MAIN: did-fail-load " + code + " " + desc));
		win.webContents.on("render-process-gone", (e, details) => console.log("MAIN: render-process-gone " + JSON.stringify(details)));
		win.on("unresponsive", () => console.log("MAIN: unresponsive"));
		win.webContents.on("dom-ready", () => dbg("MAIN: dom-ready"));
		const CONSOLE_LEVELS: Record<string, number> = { verbose: 0, debug: 0, info: 1, warning: 2, error: 3 };
		// Electron 44 delivers a single WebContentsConsoleMessageEventParams
		// object; the typings may lag, so keep the param loosely typed
		win.webContents.on("console-message", (e: any) => {
			const lvl = (typeof e.level === "number") ? e.level
				: (CONSOLE_LEVELS[e.level] !== undefined ? CONSOLE_LEVELS[e.level] : "?");
			console.log("RENDERER[" + lvl + "] " + e.message + " (" + e.sourceId + ":" + e.lineNumber + ")");
		});
		// Esc closes any secondary window (help); the main window keeps its
		// own in-page Esc handling (snk.js)
		app.on("web-contents-created", (e, contents) => {
			if (contents.getType() !== "window" || contents === win.webContents) { return; }
			contents.on("before-input-event", (ev, input) => {
				if (input.type === "keyDown" && input.key === "Escape") {
					const w = BrowserWindow.fromWebContents(contents);
					if (w) { w.close(); }
				}
			});
		});
		if (process.env.KBT_SMOKE) {
			runSmoke(win, process.env.KBT_SMOKE, STATE_FILE);
		}
	});
}

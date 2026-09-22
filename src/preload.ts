// Runs before the app in the renderer. Exposes the synchronous file bridge
// (kbfs) that app/bin/alf.js uses instead of FSO/ADODB, and polyfills
// window.moveTo/resizeTo, which HTA provided and Chromium ignores.
//
// Strategy stage: with sandbox:false + contextIsolation:false the preload
// is full Node sharing the page's window, so the whole domain store boots
// HERE — real topologica on the models/ tree, otel attachHooks driving
// dive, and the self-hosted strategy WS channel (startStrategyClient) —
// ONE process, ONE mnemonica, ONE dive instance. The channel's
// traceSubscribe then hooks the very dive ring our keystroke chains
// record into; mnemographica's App Channel connects directly.
import { ipcRenderer } from "electron";
import * as path from "path";
import * as fs from "fs";
import { bootStoreWith } from "./domain/store";
import { createKbCollection } from "./domain/collection";

// 2010-era code touches window.* freely; the bridge is no different.
const w = window as any;

w.kbfs = {
	rootPath: function () { return ipcRenderer.sendSync("kbfs-root"); },
	appPath: function () { return ipcRenderer.sendSync("kbfs-apppath"); },
	exists: function (p: string) { return ipcRenderer.sendSync("kbfs-exists", p); },
	read: function (p: string, charset?: string) { return ipcRenderer.sendSync("kbfs-read", p, charset); },
	write: function (p: string, data: string, charset?: string) { return ipcRenderer.sendSync("kbfs-write", p, data, charset); },
	del: function (p: string) { return ipcRenderer.sendSync("kbfs-delete", p); },
	mkdir: function (p: string) { return ipcRenderer.sendSync("kbfs-mkdir", p); },
	readDir: function (p: string) { return ipcRenderer.sendSync("kbfs-readdir", p); },
	openTextFileDialog: function () { return ipcRenderer.sendSync("kbfs-dlg-open-text"); }
};

w.resizeTo = function (nw: number, nh: number) { ipcRenderer.send("kb-win-resize", nw, nh); };
w.moveTo = function (x: number, y: number) { ipcRenderer.send("kb-win-move", x, y); };
w.kbWinGetSize = function () { return ipcRenderer.sendSync("kb-win-get-size"); };

// kbDialog overlay state, so the main process can turn the window's own
// (x) into "close the dialog" (era showModalDialog semantics) instead of
// quitting the whole app
w.kbDialogNotify = function (open: boolean) { ipcRenderer.send("kb-dialog-state", open); };
w.kbOnCloseDialog = function (cb: () => void) { ipcRenderer.on("kb-close-dialog", () => { cb(); }); };

// Record a zoom keypress in the domain: Program.ViewControl.ZoomIn /
// ZoomOut — the same construction the EventHandler router models
// (models/Session/EventHandler). Best-effort: the zoom itself must work
// even when the domain stack failed to boot.
w.kbZoomEvent = function (grow: boolean) {
	try {
		const program = w.kbstore && w.kbstore.program;
		if (!program) { return null; }
		const view = new program.ViewControl();
		return grow ? new view.ZoomIn() : new view.ZoomOut();
	} catch (e) { return null; }
};

// main routes Ctrl+/- here while a kbDialog overlay is open: the dialog
// scales its own content (bin/kbDialog.js) instead of the main UI
ipcRenderer.on("kb-zoom-dialog", (_e, grow) => {
	w.kbZoomEvent(grow);
	const d = w.__kbDialog;
	if (d && typeof d.zoom === "function") { d.zoom(grow); }
});

// ...and here when the main UI is zoomed: the resize itself is done by
// main (around the window's own center); this side only records the key
ipcRenderer.on("kb-zoom-key", (_e, grow) => { w.kbZoomEvent(grow); });

// --- the domain store + strategy channel --------------------------------

try {
	const topologica = require("@mnemonica/topologica");
	const { attachHooks } = require("@mnemonica/otel");

	const modelsDir = path.join(__dirname, "models");
	const version = require(path.join(__dirname, "..", "package.json")).version;

	const collection = createKbCollection();
	const { topology } = topologica(modelsDir, collection.define.bind(collection));

	// dive meets mnemonica: every construction records a 'create' edge.
	// attachHooks BEFORE the roots are born — the trace opens with
	// Program -> Session -> Timer themselves.
	attachHooks(collection);

	const store = bootStoreWith({
		version,
		screen: { width: window.screen.width, height: window.screen.height }
	}, collection, topology);

	w.kbstore = {
		store,
		topology: store.topology,
		program: store.program,
		session: store.session,
		timer: store.timer,
		adoptUser: store.adoptUser,
		adoptVars: store.adoptVars,
		stopClock: store.stopClock
	};

	// The self-hosted strategy channel: the same WS protocol strategy's
	// CDP path injects (single source of truth in the published
	// cdp-scripts/ws-server.js), bound to 127.0.0.1 with a session token.
	// Port+token are published to app/strategy-channel.json and the log —
	// mnemographica's App Channel connects with them directly.
	//
	// This inlines strategy's startStrategyClient (lib/client.js): it runs
	// the payload via bare `new Function`, which resolves global/process/
	// Buffer against the main world — and Electron strips those from the
	// main world the moment the preload's sync phase ends, while the WS
	// server only finishes bootstrapping on a later tick (server.listen).
	// Binding the preload's own Node globals as PARAMETERS keeps the
	// payload working after that cleanup.
	const wsServerScript = fs.readFileSync(
		path.join(__dirname, "..", "node_modules", "@mnemonica", "strategy", "cdp-scripts", "ws-server.js"),
		"utf-8"
	);
	const channelBag: any = {}; // the payload's `global`: state lives here
	// The payload resolves mnemonica/dive through createRequire(cwd): pin
	// that base to THIS app so it lands on the very node_modules copy the
	// preload itself required (one mnemonica, one dive), no matter where
	// the process was launched from.
	const pinnedProcess: any = Object.create(process, {
		cwd: { value: () => path.join(__dirname, "..") }
	});
	const factory = new Function("global", "process", "Buffer", "return (" + wsServerScript + ");");
	const stopChannel = () => {
		const running = channelBag.__strategyWS;
		if (running && running.server) {
			try { running.server.close(() => { /* closing anyway */ }); } catch (e) { /* already gone */ }
			running.listening = false;
			delete channelBag.__strategyWS;
		}
		try { fs.unlinkSync(path.join(__dirname, "..", "app", "strategy-channel.json")); } catch (e) { /* never written */ }
	};
	Promise.resolve()
		.then(() => factory(channelBag, pinnedProcess, Buffer))
		.then((bootstrap: any) => {
			if (!bootstrap || !bootstrap.success || typeof bootstrap.port !== "number" || !bootstrap.token) {
				throw new Error((bootstrap && bootstrap.error) || "ws-server script reported failure");
			}
			const info = { port: bootstrap.port, token: bootstrap.token, pid: bootstrap.pid || process.pid };
			w.__kbStrategy = info;
			try {
				fs.writeFileSync(
					path.join(__dirname, "..", "app", "strategy-channel.json"),
					JSON.stringify(info, null, 2)
				);
			} catch (e) { /* the log line below is the fallback channel */ }
			console.log("STRATEGY channel | host: 127.0.0.1 | port: " + info.port + " | token: " + info.token);
			window.addEventListener("beforeunload", stopChannel);
		}).catch((e: any) => {
			console.warn("STRATEGY channel failed to start: " + (e && e.message));
		});
} catch (e) {
	// The app must run even when the domain stack fails — era code only
	// needs kbstore for the adoption evalers, and they no-op without it.
	console.warn("kbstore boot failed: " + (e && (e as any).message));
}

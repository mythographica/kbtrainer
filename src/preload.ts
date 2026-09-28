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
import { bootStoreWith, USER_ALIASES } from "./domain/store";
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
	listDir: function (p: string) { return ipcRenderer.sendSync("kbfs-listdir", p); },
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

// Record the settled window geometry as Program.WindowState — one record
// per resize burst (a drag, a zoom, a dialog taking over the window), not
// one per event. Best-effort, like kbZoomEvent.
let windowStateTimer: ReturnType<typeof setTimeout> | null = null;
window.addEventListener("resize", () => {
	if (windowStateTimer !== null) { clearTimeout(windowStateTimer); }
	windowStateTimer = setTimeout(() => {
		windowStateTimer = null;
		try {
			const program = w.kbstore && w.kbstore.program;
			if (!program) { return; }
			new program.WindowState({
				width: window.outerWidth,
				height: window.outerHeight,
				x: window.screenX,
				y: window.screenY
			});
		} catch (e) { /* the resize itself must never depend on the domain */ }
	}, 300);
});

// --- the domain store + strategy channel --------------------------------
// ONLY in the main UI window (app/kb.html). Every other window this app
// opens — the help windows, the era file picker, the dialog iframes that
// share the preload — must NOT boot a second domain store or a second
// strategy channel: a window.open child can land in the opener's renderer
// process, where the heavy boot wedges the opener's thread, and an
// unguarded boot in a child would also overwrite (or delete, when
// USE_STRATEGY is unset) the channel file that belongs to the main window.
const isMainUi = window.location.pathname.endsWith("/app/kb.html");

if (isMainUi) {
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

	// dive.wrap for the page's entry points (the engine wraps its key
	// handler: one call edge per key press) — the same dive copy
	// attachHooks records into, so constructions parent on that edge
	const { wrap: diveWrap } = require("@mnemonica/dive");
	w.kbDive = { wrap: diveWrap };

	// Talk/demo mode: with OTEL_EXPORTER_OTLP_ENDPOINT set (e.g.
	// http://localhost:4318, a local Jaeger) dive's edges become OTel spans:
	// DiveOtelProvider subscribes to the very edges attachHooks feeds (one
	// span per construction), and publishes edgeId -> traceId, so the
	// strategy channel's Live Trace edges carry their Jaeger trace.
	// Unset, the default: no SDK is even loaded.
	const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
	if (otlpEndpoint) {
		const { trace, diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
		const { BasicTracerProvider, BatchSpanProcessor } = require("@opentelemetry/sdk-trace-node");
		const { JsonTraceSerializer } = require("@opentelemetry/otlp-transformer");
		const { ExportResultCode } = require("@opentelemetry/core");
		const { resourceFromAttributes } = require("@opentelemetry/resources");
		const { ATTR_SERVICE_NAME } = require("@opentelemetry/semantic-conventions");
		const { DiveOtelProvider } = require("@mnemonica/otel");
		diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN); // export failures surface
		// OTLP/JSON over Node's own http module, captured here while the
		// preload still has Node: Electron strips Buffer & co. from the page
		// once the preload returns, and the stock OTLP exporter's fetch path
		// needs them at send time (ReferenceError: Buffer is not defined).
		const http = require("http");
		const target = new URL(otlpEndpoint + "/v1/traces");
		const exporter = {
			export (spans: unknown[], done: (result: { code: number; error?: Error }) => void) {
				const body = JsonTraceSerializer.serializeRequest(spans);
				const req = http.request({
					hostname: target.hostname,
					port: target.port,
					path: target.pathname,
					method: "POST",
					headers: { "content-type": "application/json", "content-length": body.length }
				}, (res: { statusCode: number; resume: () => void }) => {
					res.resume();
					done({ code: res.statusCode < 300 ? ExportResultCode.SUCCESS : ExportResultCode.FAILED });
				});
				req.on("error", (error: Error) => { done({ code: ExportResultCode.FAILED, error }); });
				req.end(body);
			},
			shutdown () { return Promise.resolve(); }
		};
		const provider = new BasicTracerProvider({
			resource: resourceFromAttributes({ [ ATTR_SERVICE_NAME ]: "kbtrainer" }),
			spanProcessors: [ new BatchSpanProcessor(exporter) ]
		});
		trace.setGlobalTracerProvider(provider);
		new DiveOtelProvider().attach();
		// EXPERIMENT (2026-09-23): construction spans on the prototype lineage
		new (require("@mnemonica/otel").MnemonicaOtelProvider)().attachHooks(collection);
		// the last batch must not die with the window
		window.addEventListener("beforeunload", () => { provider.forceFlush(); });
		w.__kbOtel = provider;
		console.log("[otel] spans exporting to " + otlpEndpoint + " (service: kbtrainer)");
	}

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
		stopClock: store.stopClock,
		// era pref name -> canonical profile field (the settings dialog's
		// PrefSet must write the same cell adoptUser's accessor writes)
		userAliases: USER_ALIASES
	};

	// The self-hosted strategy channel — only with USE_STRATEGY=1 (talk /
	// dev mode; a regular user never gets a WS server): the same WS
	// protocol strategy's CDP path injects (single source of truth in the
	// published cdp-scripts/ws-server.js), bound to 127.0.0.1 with a
	// session token. Port+token are published to app/strategy-channel.json,
	// the log, and a thin line under the keyboard — mnemographica's App
	// Channel connects with them directly.
	//
	// This inlines strategy's startStrategyClient (lib/client.js): it runs
	// the payload via bare `new Function`, which resolves global/process/
	// Buffer against the main world — and Electron strips those from the
	// main world the moment the preload's sync phase ends, while the WS
	// server only finishes bootstrapping on a later tick (server.listen).
	// Binding the preload's own Node globals as PARAMETERS keeps the
	// payload working after that cleanup.
	const channelFile = path.join(__dirname, "..", "app", "strategy-channel.json");
	if (!process.env.USE_STRATEGY) {
		// no channel this run: a file left by a crashed run would point
		// mnemographica at a dead port
		try { fs.unlinkSync(channelFile); } catch (e) { /* none left over */ }
	} else {
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
			try { fs.unlinkSync(channelFile); } catch (e) { /* never written */ }
		};
		// the channel line under the keyboard: fit.js keeps this band free
		// (kbFitReserveBottom), so it never covers the design canvas
		// tall enough to aim at: the text sits mid-band, off the window edge,
		// so a double-click selects the line without a pixel hunt
		const barPx = 24;
		w.kbFitReserveBottom = barPx;
		const showChannel = (line: string) => {
			const put = () => {
				const bar = document.createElement("div");
				bar.id = "kb.strategy";
				bar.textContent = line;
				bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;height:" + barPx + "px;" +
					"font:10px/" + barPx + "px monospace;text-align:center;color:#8a8a8a;" +
					"white-space:nowrap;overflow:hidden;user-select:text;-webkit-user-select:text;z-index:5";
				document.body.appendChild(bar);
			};
			if (document.body) { put(); } else { window.addEventListener("DOMContentLoaded", put); }
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
					fs.writeFileSync(channelFile, JSON.stringify(info, null, 2));
				} catch (e) { /* the log line below is the fallback channel */ }
				// the whole connection target as ONE copy-pasteable line —
				// the exported graph pages and mnemographica's App Channel
				// take it as-is
				const line = "STRATEGY channel | ws://127.0.0.1:" + info.port + "/?token=" + info.token;
				console.log(line);
				showChannel(line);
				window.addEventListener("beforeunload", stopChannel);
			}).catch((e: any) => {
				console.warn("STRATEGY channel failed to start: " + (e && e.message));
				// nothing to show: give the band back to the canvas
				w.kbFitReserveBottom = 0;
				try { if (w.kbFit) { w.kbFit.apply(); } } catch (err) { /* fit not up yet */ }
			});
	}
} catch (e) {
	// The app must run even when the domain stack fails — era code only
	// needs kbstore for the adoption evalers, and they no-op without it.
	console.warn("kbstore boot failed: " + (e && (e as any).message));
}
} // isMainUi

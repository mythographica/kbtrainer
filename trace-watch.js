// Live trace watcher: connects to the running app's strategy channel and
// prints every construction edge as it happens — type in the app and watch
// KeyStroke -> Correct/Mistake -> StatUpdate flow; the clock's Tick lands
// every second. Usage: npm start   (in another terminal)   node trace-watch.js
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { WSSession } = require("@mnemonica/strategy");

const channelFile = path.join(__dirname, "app", "strategy-channel.json");

const ts = (ms) => {
	const d = new Date(ms);
	return d.toTimeString().slice(0, 8) + "." + String(d.getMilliseconds()).padStart(3, "0");
};

(async () => {
	let info;
	try {
		info = JSON.parse(fs.readFileSync(channelFile, "utf8"));
	} catch (e) {
		console.error("no " + channelFile + " — is the app running? (npm start)");
		process.exit(1);
	}
	const sess = await WSSession.connect("127.0.0.1", info.port, info.token);
	// the welcome frame is not awaited by connect(); give it one beat
	if (!sess.welcome) { await new Promise((r) => setTimeout(r, 300)); }
	const w = sess.welcome;
	console.log("connected" + (w ? ": pid " + w.pid + ", mnemonica " + w.mnemonica : "")
		+ " — trace follows. Stop with Ctrl+C.");
	sess.setNotificationHandler("trace", (params) => {
		for (const e of params.edges || []) {
			const dur = (e.duration === null || e.duration === undefined) ? "" : " " + e.duration.toFixed(2) + "ms";
			console.log(
				ts(e.ts) + "  #" + e.id + " " + String(e.instanceType || e.name).padEnd(12)
				+ " <-#" + (e.parentId === null ? "-" : e.parentId) + "  " + e.status + dur
			);
		}
	});
	const sub = await sess.request("traceSubscribe", {});
	console.log("traceSubscribe: " + JSON.stringify(sub));
})().catch((e) => { console.error("trace-watch: " + (e && e.message)); process.exit(1); });

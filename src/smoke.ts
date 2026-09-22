// Scripted smoke test (KBT_SMOKE=<dir>): boots the app, opens each modal
// dialog, exercises typing/zoom/pause/help, and screenshots every stage
// into that directory. Runs inside the main process after window creation.
import { app, BrowserWindow, screen } from "electron";
import { WSSession } from "@mnemonica/strategy";
import * as fs from "fs";
import * as path from "path";

function workArea(win: BrowserWindow): Electron.Rectangle {
	return screen.getDisplayMatching(win.getBounds()).workArea;
}

export function runSmoke(mainWin: BrowserWindow, dir: string, stateFile: string): void {
	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const shot = async (name: string) => {
		const img = await mainWin.webContents.capturePage();
		fs.writeFileSync(path.join(dir, name + ".png"), img.toPNG());
		console.log("SMOKE-SHOT " + name + " " + img.toPNG().length + " bytes");
	};
	const js = (code: string): Promise<any> => mainWin.webContents.executeJavaScript(code);
	setTimeout(async () => {
		try {
			mainWin.show();
			// native alert() blocks the renderer synchronously; the app uses
			// alert() in error paths, so neuter it for the automated run
			// (kept as-is for real usage)
			await js("window.alert = function(m){ console.log('ALERT: ' + m); }; window.confirm = function(){ return true; }; 'ok'");
			if (process.env.KBT_PROBE) {
				const dump = (tag: string) => js(
					"JSON.stringify({tag:'" + tag + "', started: app.started, _started: app._started, keyboard_on: app.keyboard_on, stopControl: kb.stopControl, size: vars.strArr.size, toType: vars.to_type.substr(0,6), cntSess: vars.cntSess, cntErr: vars.cntErr, curMap: user.currentMap, back70: (kb.map[user.currentMap].back[70]||[])[5]})"
				);
				for (let i = 0; i < 30; i++) { await sleep(500); if (await js("app._started === true")) { break; } }
				console.log("PROBE-1 " + await dump("boot"));
				await js(
					"window.__kbkd = function(code){"
					+ "var e = new KeyboardEvent('keydown', {bubbles: true, cancelable: true});"
					+ "Object.defineProperty(e, 'keyCode', {get: function(){ return code; }});"
					+ "Object.defineProperty(e, 'which', {get: function(){ return code; }});"
					+ "document.body.dispatchEvent(e);}; 'ok'"
				);
				await js("__kbkd(32); 'ok'");
				await sleep(600);
				console.log("PROBE-2 " + await dump("space"));
				await js("window.__mkcalls = 0; var orig = app.keydown; app.keydown = function(k){ window.__mkcalls++; return orig(k); }; 'ok'");
				await js("__kbkd(70); 'ok'");
				await sleep(600);
				console.log("PROBE-3 " + await dump("f-key") + " mkcalls=" + await js("window.__mkcalls"));
				app.exit(0);
				return;
			}
			const state = await js(
				"({alf: String(window.alf), user: typeof user, kernel: typeof kernel, app: typeof app, snk: typeof snk, kbfs: typeof kbfs, scripts: document.getElementsByTagName('script').length, statuses: (function(){var o={}; for(var i in loader_array){o[i]=loader_array[i][3];} return o;})(), userFile: (typeof fs != 'undefined') ? fs.userFile : '', title: document.title})"
			);
			console.log("SMOKE-STATE " + JSON.stringify(state));
			// pf() delegates its parse/format to the typed kblib bundle
			console.log("SMOKE-PF " + await js("(function(){ pf('kbtSmoke','7'); var v = pf('kbtSmoke'); pf('kbtSmoke','8'); var v2 = pf('kbtSmoke'); return JSON.stringify({kblib: typeof kblib, v: v, v2: v2});})()"));
			// stage-3 stats + key-map cores: era fns wrappers delegate to kblib
			console.log("SMOKE-STATS " + await js("JSON.stringify({perc: fns.count_perc(1,3), hms: fns.time_HMS(3661).str, spd: kblib.speed(245,60), kperc: kblib.countPerc(1,6), km: kblib.parseMapFileName('map.EN.Standard.js').mapName, next: kblib.nextMap(['en','ru'],'ru','ru'), pair: kblib.selectedMapsPair(['en.standard','ru.standard'],'ua').currentMap})"));
			// stage-4.1 domain store: era user fields delegate onto program.profile
			console.log("SMOKE-STORE " + await js("(function(){ var p = kbstore.program.profile; var before = user.hiderInterval; user.hiderInterval = 333; var viaProfile = p.hiderInterval; p.wsT = 222; var viaUser = user.wsT; user.hiderInterval = before; var withOk = (new Function('u', 'with(u){ return skin; }'))(user) === user.skin; var fnKept = typeof user.save === 'function'; return JSON.stringify({ store: typeof kbstore, roots: !!kbstore.session && !!kbstore.timer, ticksType: typeof kbstore.timer.ticks, kids: kbstore.topology.Session.kids.length, viaProfile: viaProfile, viaUser: viaUser, withOk: withOk, fnKept: fnKept });})()"));
			// stage-4.2/4.3 main-window island: Vue rendered the top rows + typing area, objx shims wrap them, the island owns the clock
			console.log("SMOKE-TOPBAR " + await js("(function(){ if(window.__tvuMounted !== true){ return 'not-mounted'; } var ids = ['id.time','id.map_name','id.next_key','id.lang','id.prev','id.timer','id.txt_perc','id.err_perc','id.velocity','id.zoomout_btn','id.zoomin_btn','id.help_btn','id.lang_btn','id.type_btn','id.mode_btn','id.sets_btn','id.libr_btn','id.content','id.already','id.to_type','id.paragrh','id.messager','id.keyboard']; var missing = ids.filter(function(i){ return !document.getElementById(i); }); var shimOk = objx.time.m === document.getElementById('id.time') && objx.help_btn.m === document.getElementById('id.help_btn') && objx.speed.m === document.getElementById('id.velocity') && objx.to_type.m === document.getElementById('id.to_type') && objx.messager.m === document.getElementById('id.messager') && objx.content.m === document.getElementById('id.content') && objx.keyboard.m === document.getElementById('id.keyboard'); var kbKeys = document.getElementById('id.keyboard').getElementsByTagName('div').length; var clock = document.getElementById('id.time').innerHTML; var wired = typeof objx.help_btn.obj.onclick === 'function' && objx.zoomout_btn.obj.innerHTML === '-'; var nest = document.getElementById('id.already').parentNode === document.getElementById('id.content') && document.getElementById('id.content').parentNode === document.getElementById('id.full') && document.getElementById('id.keyboard').parentNode === document.getElementById('id.full'); return JSON.stringify({ missing: missing, shimOk: shimOk, nest: nest, kbKeys: kbKeys, clock: clock.length > 5 && clock.indexOf(':') > 0, wired: wired });})()"));
			await shot("01-boot");
			const isCentered = () => {
				const b = mainWin.getBounds();
				const a = screen.getDisplayMatching(b).workArea;
				return Math.abs((b.x + b.width / 2) - (a.x + a.width / 2)) <= 45
					&& Math.abs((b.y + b.height / 2) - (a.y + a.height / 2)) <= 45;
			};
			console.log("SMOKE-CENTER-BOOT " + isCentered());
			console.log("SMOKE-INIT-SIZE " + JSON.stringify(mainWin.getContentSize()));

			// settings dialog
			await js("snk.open_sets(); 'ok'");
			await sleep(2000);
			console.log("SMOKE-DLG sets: " + await js("!!document.querySelector('iframe') && !!document.querySelector('iframe').contentWindow.dialogArguments"));
			console.log("SMOKE-DLG sets-noscroll: " + await js("(function(){var f=document.querySelector('iframe'); if(!f){return 'no-frame';} var d=f.contentDocument; var sh=Math.max(d.body.scrollHeight, d.documentElement.scrollHeight); return sh + ' vs ' + f.clientHeight + ' -> ' + (sh <= f.clientHeight);})()"));
			// the settings dialog is a Vue island (bin/sets.html): mounted,
			// live-bound to the shared user object, maps list rendered
			console.log("SMOKE-SETS-VUE " + await js("(function(){var f=document.querySelector('iframe'); if(!f){return 'no-frame';} var w=f.contentWindow, d=f.contentDocument; if(w.__svuMounted!==true){return 'not-mounted';} var before=user.hideStatsOnPause; var chk=d.getElementById('snk.hideStatsOnPause.chk'); chk.click(); var mid=user.hideStatsOnPause; chk.click(); var after=user.hideStatsOnPause; var maps=d.querySelectorAll('#msmaps input[type=checkbox]').length; return JSON.stringify({mounted: true, titl: d.getElementById('titl').innerHTML.length > 0, maps: maps, mapsOk: maps === kb.mapsarr.length, bound: (before === after) && (mid === !before)});})()"));
			// the dialog sizes to its design dims scaled by DELIBERATE zoom
			// only — never by the passive boot fit (regression: F4/F5/F8
			// used to open near full screen width)
			const setsSize = mainWin.getContentSize();
			console.log("SMOKE-DLG-SIZE " + JSON.stringify({ size: setsSize, designish: setsSize[0] >= 500 && setsSize[0] <= 1000 && setsSize[1] <= 1100 }));
			await shot("02-sets");
			// Ctrl+= while a dialog is open: the dialog CONTENT zooms (font
			// scale), and the window follows the content in BOTH dims
			// (regression: used to touch the window only, never the fonts)
			const dlgBeforeZ = mainWin.getContentSize();
			mainWin.webContents.sendInputEvent({ type: "keyDown", keyCode: "=", modifiers: ["control"] } as any);
			await sleep(900);
			const dlgAfterZ = mainWin.getContentSize();
			console.log("SMOKE-DLG-ZOOM " + JSON.stringify({
				before: dlgBeforeZ, after: dlgAfterZ,
				grewBoth: dlgAfterZ[0] > dlgBeforeZ[0] && dlgAfterZ[1] > dlgBeforeZ[1],
				fontZoom: await js("(function(){var f=document.querySelector('iframe'); return f ? f.contentDocument.body.style.zoom : 'no-frame';})()"),
				zoomLvl: await js("window.kbstore ? kbstore.program.zoom : -1")
			}));
			mainWin.webContents.sendInputEvent({ type: "keyDown", keyCode: "-", modifiers: ["control"] } as any);
			await sleep(900);
			await js("window.__kbDialog.close(); 'ok'");
			await sleep(500);

			// the window's own (x) while a dialog is open must close the
			// DIALOG (era showModalDialog semantics), not quit the app
			const beforeDlg = mainWin.getContentSize();
			await js("snk.open_sets(); 'ok'");
			await sleep(2000);
			const dlgSize = mainWin.getContentSize();
			mainWin.close();
			await sleep(1500);
			console.log("SMOKE-DLG-X " + JSON.stringify({
				alive: !mainWin.isDestroyed(),
				overlayGone: mainWin.isDestroyed() ? false : await js("!document.querySelector('iframe')"),
				grewForDialog: dlgSize[0] !== beforeDlg[0] || dlgSize[1] !== beforeDlg[1],
				sizeRestored: mainWin.isDestroyed() ? false : (mainWin.getContentSize()[0] === beforeDlg[0] && mainWin.getContentSize()[1] === beforeDlg[1])
			}));

			// stage-4.6b skins port: manifest list + metadata, switch to the
			// 9-rows skin (geometry + CSS link + classes), switch back
			console.log("SMOKE-SKINS " + await js("(function(){ var names = Object.keys(skins.arr).sort(); var meta = skins['whiteprettybuttons']; skins.selted = skins.arr['native_r9']; skins.skinLoad(); var r9 = { body: document.body.className, rows: vars.num_of_rows, vwp: vars.view_wh_pos, psml: skins.dbh.paragraph.sml, link: !!document.getElementById('id.native_r9skin.css') }; skins.selted = skins.arr['native']; skins.skinLoad(); return JSON.stringify({ count: names.length, names: names, metaName: meta.name, metaAuthor: meta.author, r9: r9, backBody: document.body.className, backRows: vars.num_of_rows });})()"));

			// library dialog
			await js("snk.open_lib(true); 'ok'");
			await sleep(2000);
			console.log("SMOKE-DLG lib: " + await js("!!document.querySelector('iframe') && !!document.querySelector('iframe').contentWindow.dialogArguments"));
			// the library dialog is a Vue island (bin/lib.html); a fresh
			// profile has no books, so it auto-opens the Add tab
			console.log("SMOKE-LIB-VUE " + await js("(function(){var f=document.querySelector('iframe'); if(!f){return 'no-frame';} var w=f.contentWindow, d=f.contentDocument; if(w.__lvuMounted!==true){return 'not-mounted';} var add=d.getElementById('setAds'); var lst=d.getElementById('libFiles'); return JSON.stringify({mounted: true, addVisible: !!add && add.offsetHeight > 0, listEmpty: !!lst && lst.innerHTML.length > 0, tabs: !!d.getElementById('libFilesTab') && !!d.getElementById('setAdsTab')});})()"));
			await shot("03-lib");
			await js("window.__kbDialog.close(); 'ok'");

			// closing the library restarts the app; wait for it
			for (let i = 0; i < 30; i++) {
				await sleep(500);
				if (await js("app._started === true")) { break; }
			}

			// mode dialog
			await js("snk.changeMode(); 'ok'");
			await sleep(2000);
			console.log("SMOKE-DLG mode: " + await js("!!document.querySelector('iframe') && !!document.querySelector('iframe').contentWindow.dialogArguments"));
			// the mode dialog is a Vue island (bin/mode.html): mounted, lesson
			// list rendered, mode radios flip user.LessonsMode live
			console.log("SMOKE-MODE-VUE " + await js("(function(){var f=document.querySelector('iframe'); if(!f){return 'no-frame';} var w=f.contentWindow, d=f.contentDocument; if(w.__mvuMounted!==true){return 'not-mounted';} var lessonsN=d.querySelectorAll('#less_select input[type=radio]').length; var mapsN=d.querySelectorAll('#less_map_select input[type=radio]').length; var was=user.LessonsMode; d.getElementById('snk.mode.radio2').click(); var book=user.LessonsMode; d.getElementById('snk.mode.radio1').click(); var back=user.LessonsMode; return JSON.stringify({mounted: true, maps: mapsN, lessons: lessonsN, was: was, book: book, back: back});})()"));
			await shot("04-mode");
			await js("window.__kbDialog.close(); 'ok'");
			await sleep(500);

			await shot("05-after-dialogs");

			// typing test: wait for the post-dialog restart, unpause with
			// Space, then type the first lesson characters; cntSess advances
			for (let i = 0; i < 30; i++) {
				await sleep(500);
				if (await js("app._started === true")) { break; }
			}
			await js(
				"window.__kbkey = function(code){"
				+ "var e = new KeyboardEvent('keydown', {bubbles: true, cancelable: true});"
				+ "Object.defineProperty(e, 'keyCode', {get: function(){ return code; }});"
				+ "Object.defineProperty(e, 'which', {get: function(){ return code; }});"
				+ "document.body.dispatchEvent(e);}; 'ok'"
			);
			await sleep(300);
			// switch to the lesson's keyboard map (like F2 would)
			await js("user.currentMap = user.LessonNum[0]; snk.keychkb(); 'ok'");
			await js("__kbkey(32); 'ok'"); // Space: leave PAUSE
			await sleep(600);
			// type the first expected characters, derived from the active key
			// map (robust for any current lesson)
			const keysToSend = await js(
				"(function(){var out=[]; for(var i=0;i<4;i++){var ch=vars.to_type.substr(i,1); var e=kb.map[user.currentMap].keys[ch]; if(e){out.push(e[4]);}} return out.join(',');})()"
			);
			for (const code of String(keysToSend).split(",")) {
				if (!code) { continue; }
				await js("__kbkey(" + code + "); 'ok'");
				await sleep(300);
			}
			await sleep(600);
			console.log("SMOKE-TYPE " + await js("JSON.stringify({cntSess: vars.cntSess, cntErr: vars.cntErr, toType: vars.to_type.substr(0,8), title: document.title})"));
			console.log("SMOKE-CHAIN " + await js("(function(){ var st = kbstore.session.stats; return JSON.stringify({ typed: st.typed, viaVars: vars.cntSess, same: st.typed === vars.cntSess, correct: st.correct, errors: st.errors, cntFull: user.cntFull });})()"));

			// stage-5 strategy channel: the app self-hosts the construction
			// channel from its preload (window.__kbStrategy = {port, token}).
			// Connect as a client the way mnemographica will, subscribe to the
			// live trace, type, and check the chain edges stream out with real
			// parentage (Correct/Mistake hang off their KeyStroke).
			const stratStr = await js("window.__kbStrategy ? JSON.stringify({port: window.__kbStrategy.port, token: window.__kbStrategy.token}) : ''");
			if (!stratStr) {
				console.log("SMOKE-TRACE " + JSON.stringify({ ok: false, reason: "window.__kbStrategy missing" }));
			} else {
				const strat = JSON.parse(stratStr);
				const sess = await WSSession.connect("127.0.0.1", strat.port, strat.token);
				const edges: any[] = [];
				sess.setNotificationHandler("trace", (params: any) => {
					if (params && Array.isArray(params.edges)) { edges.push(...params.edges); }
				});
				const sub: any = await sess.request("traceSubscribe", {}, 5000);
				// type three more expected characters while subscribed
				const moreKeys = await js(
					"(function(){var out=[]; for(var i=0;i<8 && out.length<3;i++){var ch=vars.to_type.substr(i,1); var e=kb.map[user.currentMap].keys[ch]; if(e){out.push(e[4]);}} return out.join(',');})()"
				);
				for (const code of String(moreKeys).split(",")) {
					if (!code) { continue; }
					await js("__kbkey(" + code + "); 'ok'");
					await sleep(250);
				}
				// Esc/Space are events too: Session -> RunControl -> Pause/Resume
				await js("__kbkey(27); 'ok'"); // Esc: pause the run
				await sleep(300);
				await js("__kbkey(32); 'ok'"); // Space: resume
				await sleep(1400); // server flushes every 150ms; the clock ticks each second
				const seen = new Set<string>();
				const byType: Record<string, number> = {};
				let withTraceId = 0;
				for (const e of edges) {
					const key = e.instanceType + ":" + e.id;
					if (seen.has(key)) { continue; } // enter/create/leave/settle republish one edge
					seen.add(key);
					const t = e.instanceType || "?";
					byType[t] = (byType[t] || 0) + 1;
					if (e.traceId) { withTraceId++; }
				}
				const strokeIds = new Set(edges.filter((e) => e.instanceType === "KeyStroke").map((e) => e.id));
				const parentLinked = edges.some((e) => (e.instanceType === "Correct" || e.instanceType === "Mistake") && strokeIds.has(e.parentId));
				const rcIds = new Set(edges.filter((e) => e.instanceType === "RunControl").map((e) => e.id));
				const rcLinked = edges.some((e) => e.instanceType === "Pause" && rcIds.has(e.parentId))
					&& edges.some((e) => e.instanceType === "Resume" && rcIds.has(e.parentId));
				console.log("SMOKE-TRACE " + JSON.stringify({
					ok: parentLinked && rcLinked && !!byType.KeyStroke && (!!byType.Correct || !!byType.Mistake),
					welcome: sess.welcome,
					subscribed: sub && sub.subscribed, events: sub && sub.events,
					edges: edges.length, distinct: seen.size, withTraceId: withTraceId,
					byType: byType, parentLinked: parentLinked, rcLinked: rcLinked
				}));
				sess.close();
			}
			await shot("06-typing");

			// resize behaviour: content must scale, no scrollbars
			mainWin.setContentSize(1140, 520);
			await sleep(800);
			await shot("07-resize-big");
			mainWin.setContentSize(560, 210);
			await sleep(800);
			await shot("08-resize-small");
			console.log("SMOKE-FIT " + await js("JSON.stringify({transform: document.getElementById('id.full').style.transform, bodyScroll: document.body.scrollHeight > window.innerHeight})"));
			mainWin.setContentSize(760, 280);
			await sleep(500);

			// help window (F1 / help button): a real separate window running
			// the Vue help island (locale/help.html); Esc closes it
			await js("__kbkey(112); 'ok'"); // F1
			let helpWin: BrowserWindow | undefined;
			for (let i = 0; i < 20; i++) {
				await sleep(300);
				const all = BrowserWindow.getAllWindows();
				if (all.length > 1) { helpWin = all.find((bw) => bw !== mainWin); break; }
			}
			if (helpWin) {
				await sleep(1500);
				const hurl = helpWin.webContents.getURL();
				console.log("SMOKE-HELP title=" + (await helpWin.webContents.executeJavaScript("document.title")) + " url=" + hurl);
				console.log("SMOKE-HELP-VUE mounted=" + (await helpWin.webContents.executeJavaScript("window.__hvuMounted === true"))
					+ " url-ok=" + hurl.endsWith("/locale/help.html"));
				const himg = await helpWin.webContents.capturePage();
				fs.writeFileSync(path.join(dir, "09-help.png"), himg.toPNG());
				console.log("SMOKE-SHOT 09-help " + himg.toPNG().length + " bytes");
				// the RU toggle re-renders in place (no reload, no frameset)
				await helpWin.webContents.executeJavaScript("document.getElementById('hvu-ru').click(); 'ok'");
				await sleep(500);
				console.log("SMOKE-HELP-RU title=" + (await helpWin.webContents.executeJavaScript("document.title"))
					+ " cyrillic=" + (await helpWin.webContents.executeJavaScript("document.body.innerHTML.indexOf('Справочная') >= 0")));
				const rimg = await helpWin.webContents.capturePage();
				fs.writeFileSync(path.join(dir, "10-help-ru.png"), rimg.toPNG());
				console.log("SMOKE-SHOT 10-help-ru " + rimg.toPNG().length + " bytes");
				helpWin.webContents.sendInputEvent({ type: "keyDown", keyCode: "Escape" } as any);
				let escClosed = false;
				for (let i = 0; i < 10; i++) {
					await sleep(300);
					if (BrowserWindow.getAllWindows().indexOf(helpWin) === -1) { escClosed = true; break; }
				}
				console.log("SMOKE-HELP-ESC closed=" + escClosed);
				if (!escClosed) { helpWin.close(); }
			} else {
				console.log("SMOKE-HELP no second window appeared");
			}

			// Ctrl+= / Ctrl+- grow/shrink the window around its OWN center —
			// a never-moved window starts screen-centered and stays there
			mainWin.setContentSize(760, 280);
			mainWin.center();
			await sleep(500);
			const zBefore = mainWin.getContentSize();
			const zLvl0: number = await js("window.kbstore ? kbstore.program.zoom : -1");
			mainWin.webContents.sendInputEvent({ type: "keyDown", keyCode: "=", modifiers: ["control"] } as any);
			await sleep(500);
			const zGrown = mainWin.getContentSize();
			const zLvl1: number = await js("window.kbstore ? kbstore.program.zoom : -1");
			const zCenteredGrow = isCentered();
			mainWin.webContents.sendInputEvent({ type: "keyDown", keyCode: "-", modifiers: ["control"] } as any);
			await sleep(500);
			const zShrunk = mainWin.getContentSize();
			const zLvl2: number = await js("window.kbstore ? kbstore.program.zoom : -1");
			const area = workArea(mainWin);
			console.log("SMOKE-ZOOM " + JSON.stringify({ before: zBefore, grown: zGrown, centeredGrow: zCenteredGrow, shrunk: zShrunk, centeredEnd: isCentered(), fitsScreen: zGrown[0] <= area.width && zGrown[1] <= area.height }));
			// the same keys are recorded in the domain: Program.ViewControl
			// .ZoomIn/ZoomOut move program.zoom one ZOOM_STEP per press
			console.log("SMOKE-ZOOM-TRACE " + JSON.stringify({ before: zLvl0, grown: zLvl1, shrunk: zLvl2, recorded: zLvl1 > zLvl0 && zLvl2 < zLvl1 }));

			// a window the user moved keeps ITS center on zoom — no jump
			// back to the screen center (a drag is the WM moving the window;
			// simulated here by a bare setPosition)
			mainWin.setPosition(60, 480);
			await sleep(600);
			const mvBefore = mainWin.getBounds();
			mainWin.webContents.sendInputEvent({ type: "keyDown", keyCode: "=", modifiers: ["control"] } as any);
			await sleep(600);
			const mvAfter = mainWin.getBounds();
			const cxOf = (b: { x: number; width: number }) => b.x + b.width / 2;
			const cyOf = (b: { y: number; height: number }) => b.y + b.height / 2;
			console.log("SMOKE-ZOOM-KEEPPOS " + JSON.stringify({
				moved: Math.abs(mvBefore.x - 60) <= 25 && Math.abs(mvBefore.y - 480) <= 25,
				centerKept: Math.abs(cxOf(mvAfter) - cxOf(mvBefore)) <= 25 && Math.abs(cyOf(mvAfter) - cyOf(mvBefore)) <= 25
			}));
			mainWin.center();
			await sleep(400);

			// pause keeps stats visible (pref off by default): the pause box
			// drops below the stats row, and unpause restores the position
			await js("app.pauser(1); 'ok'");
			await sleep(400);
			console.log("SMOKE-PAUSE-STATS " + await js("JSON.stringify({boxTop: objx.messager.obj.style.top, moved: objx.messager.obj.style.top !== '', boxBottom: objx.messager.obj.offsetTop + objx.messager.obj.offsetHeight, keyboardTop: objx.keyboard.obj.offsetTop, clearsKeyboard: (objx.messager.obj.offsetTop + objx.messager.obj.offsetHeight) <= objx.keyboard.obj.offsetTop, speedVisible: objx.speed.obj.offsetWidth > 0, timerShown: objx.timer.obj.innerHTML.length > 0})"));
			await shot("11-pause-stats");
			await js("app.attr.start(); 'ok'");
			await sleep(300);
			console.log("SMOKE-PAUSE-RESTORE top-cleared=" + await js("objx.messager.obj.style.top === ''"));
			console.log("SMOKE-BTN-LAYOUT " + await js("JSON.stringify({zoomOutW: objx.zoomout_btn.obj.offsetWidth, zoomInW: objx.zoomin_btn.obj.offsetWidth, helpW: objx.help_btn.obj.offsetWidth, ordered: (objx.zoomout_btn.obj.offsetLeft + objx.zoomout_btn.obj.offsetWidth) <= objx.zoomin_btn.obj.offsetLeft && (objx.zoomin_btn.obj.offsetLeft + objx.zoomin_btn.obj.offsetWidth) <= objx.help_btn.obj.offsetLeft})"));

			// hovering a top button: the skin's :hover rule grows it around
			// its center; the caption must stay fully visible (regression
			// check for the border-box clash that clipped it to a stripe)
			const hov = JSON.parse(await js("JSON.stringify((function(){var r=objx.mode_btn.obj.getBoundingClientRect(); return {x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2)};})())"));
			mainWin.webContents.sendInputEvent({ type: "mouseMove", x: hov.x, y: hov.y } as any);
			await sleep(400);
			console.log("SMOKE-BTN-HOVER " + await js("JSON.stringify({hover: objx.mode_btn.obj.matches(':hover'), h: objx.mode_btn.obj.offsetHeight, clipped: objx.mode_btn.obj.scrollHeight > objx.mode_btn.obj.clientHeight})"));
			await shot("12-btn-hover");
			mainWin.webContents.sendInputEvent({ type: "mouseMove", x: 5, y: 200 } as any);
			await sleep(300);

			// the "+" button next to F1 zooms like Ctrl+=
			const bBefore = mainWin.getContentSize();
			await js("objx.zoomin_btn.obj.onclick(); 'ok'");
			await sleep(600);
			const bAfter = mainWin.getContentSize();
			console.log("SMOKE-ZOOM-BTN " + JSON.stringify({ before: bBefore, after: bAfter, grew: bAfter[0] > bBefore[0], zoomLvl: await js("window.kbstore ? kbstore.program.zoom : -1") }));

			// window size was persisted for the next run
			await sleep(900);
			let stateOk = false;
			try { stateOk = JSON.parse(fs.readFileSync(stateFile, "utf8")).w === mainWin.getContentSize()[0]; } catch (err) { /* unreadable */ }
			console.log("SMOKE-STATE-FILE " + stateOk);

			console.log("SMOKE-OK");
		} catch (err) { console.log("SMOKE-FAIL " + err); }
		app.exit(0);
	}, 9000);
}

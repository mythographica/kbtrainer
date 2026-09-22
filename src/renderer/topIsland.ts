// Main-window island (stages 4.2 + 4.3): the top rows (button row −/+, F1..F8), the stats boxes
// and the wall clock of the main window, rendered by Vue 3 (vendored global
// build, runtime template) instead of objex.js mix.addObj calls. era code
// keeps writing captions/handlers/stats through the objx.* shims — objex.js
// now wraps these island-rendered nodes instead of creating them; only the
// clock is reactive (snk.time() retired; the island owns id.time). The
// typing area (content > already + to_type, paragrh) and the messager
// pause overlay are island-rendered too (stage 4.3); messager
// visibility/content stays era-driven (jQuery fades, Fhide/Fshow) — the
// island binds nothing on it. id.keyboard is island-rendered too (4.4);
// layouts.evaluator() fills it per map/shift as before.
//
// Vue owns id.full's subtree: the template renders the whole chrome. The
// per-map keyboard buttons are appended into id.keyboard by
// layouts.evaluator() after mount as children Vue never tracks (skins stack
// via
// explicit z-index, so DOM order is irrelevant). The clock text is the only
// dynamic binding, so era className writes (objx.cn) survive on every node.
//
// Mounted by the loader chain: kernel.js ldr.add("topbar", ..., "tvu.mount()")
// sits between "functions" (fns) and "objects" (objex.js). Vue comes from
// the vendored jq/vue.global.prod.js script tag in kb.html.

namespace tvu {

declare const Vue: any;     // jq/vue.global.prod.js
declare const fns: any;     // bin/fns.js

// ids mirror the era objex.js contract — skins and objx.* shims key off them
const INFO: string[] = ["id.map_name", "id.next_key", "id.lang", "id.prev"];
const STATS: string[] = ["id.timer", "id.txt_perc", "id.err_perc", "id.velocity"];
const BUTTONS: string[] = [
	"id.zoomout_btn", "id.zoomin_btn", "id.help_btn", "id.lang_btn",
	"id.type_btn", "id.mode_btn", "id.sets_btn", "id.libr_btn"
];

export function mount(): void {
	const app = Vue.createApp({
		setup: function () {
			// era format (was snk.time): fns.time() with nbsp-filled spaces
			const timeHtml = Vue.ref("");
			const tick = function (): void {
				timeHtml.value = fns.time().replace(/ /g, "&nbsp;");
			};
			tick();
			setInterval(tick, 1000);
			return {
				timeHtml: timeHtml,
				info: INFO,
				stats: STATS,
				buttons: BUTTONS
			};
		},
		template: `
<div id="id.full">
	<li id="id.time" v-html="timeHtml"></li>
	<div v-for="id in info" :key="id" :id="id"></div>
	<li v-for="id in stats" :key="id" :id="id"></li>
	<li v-for="id in buttons" :key="id" :id="id"></li>
	<div id="id.content">
		<div id="id.already"></div>
		<div id="id.to_type"></div>
	</div>
	<div id="id.paragrh"></div>
	<div id="id.messager"></div>
	<div id="id.keyboard"></div>
</div>
`
	});
	// Vue mounts INTO the host, so id.full's parent chain keeps a stable,
	// classless wrapper — the skins only ever style id.full itself
	const host = document.createElement("div");
	host.id = "id.topbar-host";
	document.body.appendChild(host);
	app.mount(host);
	(window as any).__tvuMounted = true; // the smoke test listens for this
}

}

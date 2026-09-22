// Mode dialog (lesson-vs-book chooser) as a Vue 3 island — the Electron port
// of app/bin/_mode.htm (the original file is the spec; this mirrors it section
// by section). Same pattern as bin/setsIsland.ts: vendored Vue global build,
// no bundler, file://. window.dialogArguments is the live
// {kb, app, snkt, user, kernel, layouts, skins, strings, evop, lessons} object
// of the main window (see bin/kbDialogChild.js), so writes on the reactive
// user proxy go straight through to it — that is how the choice applies,
// exactly like the original showModalDialog page did.
//
// Everything lives in a namespace (unlike setsIsland.ts): the two islands are
// compiled together by tsconfig.renderer.json and, being import-free scripts,
// would collide in the shared global scope (Vue, dlg, injectSkin, app, ...).

namespace mvu {

declare const Vue: any;
declare const api: any;

interface StringsTable {
  [key: string]: string;
}

interface KbMapInfo {
  language?: string;
}

interface Kb {
  map: { [key: string]: KbMapInfo | undefined };
}

interface User {
  skin: string;
  LessonsMode: string;
  LessonNum: (string | number)[];
  CurrentBook: string;
}

interface LessonEntry {
  name: string;
}

interface LessonGroup {
  name: string;
  les: { [key: string]: LessonEntry };
}

interface Lessons {
  arr: { [mapKey: string]: { [groupKey: string]: LessonGroup } };
}

interface DlgArgs {
  kb: Kb;
  app: unknown;
  snkt: unknown;
  user: User;
  kernel: unknown;
  layouts: unknown;
  skins: unknown;
  strings: StringsTable;
  evop: string;
  lessons: Lessons;
}

interface BookOpt {
  name: string;
  path: string;
  xnun: number;
  autor: string;
  book: string;
  position: string;
}

interface LessonOpt {
  id: string;
  value: string;
  g: string;
  k: string;
  checked: boolean;
  html: string;
  labelStyle: { [key: string]: string };
}

interface MvuVm {
  // data
  user: User;
  strings: StringsTable;
  mapKeys: string[];
  selectedLessonMap: string;
  bookList: BookOpt[];
  evop: string;
  // computed
  isLesson: boolean;
  isBook: boolean;
  lessonList: LessonOpt[];
  // methods
  setMode(mode: string): void;
  mapClick(map: string): void;
  lessonClick(g: string, k: string): void;
  mapLabel(map: string): string;
  focusLesson(): void;
}

const dlg = (window as any).dialogArguments as DlgArgs;

const kb = dlg.kb;
const lessons = dlg.lessons;
const strings = dlg.strings;
const user = Vue.reactive(dlg.user) as User;

// selector.js replacement: (re)inject the current skin's stylesheet
let skinLink: HTMLLinkElement | null = null;
function injectSkin(): void {
  try {
    if (skinLink && skinLink.parentNode) {
      skinLink.parentNode.removeChild(skinLink);
    }
  } catch (e) {}
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.id = "slinskin" + Math.random().toString(36).slice(2);
  link.href = "../skins/skin." + (user.skin || "native") + ".css";
  const head = document.getElementsByTagName("head")[0];
  if (head) {
    head.appendChild(link);
    skinLink = link;
  }
}

injectSkin();

// books were read once by starter(); api.books(true) may return false on error
let bookList: BookOpt[] = [];
try {
  if (typeof api !== "undefined" && api && typeof api.books === "function") {
    const books = api.books(true);
    if (books) { bookList = books; }
  }
} catch (e) {}

const app = Vue.createApp({
  data: function () {
    return {
      user: user,
      strings: strings,
      mapKeys: Object.keys(lessons.arr),
      selectedLessonMap: String(user.LessonNum[0]),
      bookList: bookList,
      evop: ""
    };
  },
  computed: {
    isLesson: function (this: MvuVm): boolean {
      return user.LessonsMode === "lesson";
    },
    isBook: function (this: MvuVm): boolean {
      return user.LessonsMode === "book";
    },
    // was buildSLmap()'s right column: the lesson radios of the selected map
    // (rebuilds reactively, so the focus pass runs off the click handlers)
    lessonList: function (this: MvuVm): LessonOpt[] {
      const out: LessonOpt[] = [];
      const sel = this.selectedLessonMap;
      const lm = (sel !== "") ? lessons.arr[sel] : undefined;
      if (!lm) { return out; }
      for (const g of Object.keys(lm)) {
        const grp = lm[g];
        for (const k of Object.keys(grp.les)) {
          const cur = (g === user.LessonNum[1]) && (k === String(user.LessonNum[2]));
          out.push({
            id: "snk_less_" + sel + "_" + g + "_" + k + "_select_id",
            value: sel + "_" + g + "_" + k,
            g: g,
            k: k,
            checked: cur,
            html: "<nobr>" + sel.toUpperCase() + " : " + grp.name + " -- " + grp.les[k].name + "</nobr>",
            labelStyle: cur ? { fontWeight: "bold", color: "red" } : {}
          });
        }
      }
      return out;
    }
  },
  methods: {
    // was setsMode()
    setMode: function (this: MvuVm, mode: string): void {
      user.LessonsMode = mode;
      if (mode === "lesson") { this.focusLesson(); }
    },
    mapClick: function (this: MvuVm, map: string): void {
      if (user.LessonNum[0] !== map) {
        user.LessonNum = [map, "base0", 0];
      }
      this.selectedLessonMap = map;
      this.focusLesson();
    },
    lessonClick: function (this: MvuVm, g: string, k: string): void {
      user.LessonNum = [this.selectedLessonMap, g, k];
      this.focusLesson();
    },
    mapLabel: function (map: string): string {
      const info = kb.map[map];
      return (info && info.language !== undefined) ? info.language : map;
    },
    // buildSLmap() ended with focusing the checked lesson radio, if any
    focusLesson: function (): void {
      Vue.nextTick(function (): void {
        try {
          const el = document.querySelector('#less_select input[type="radio"]:checked') as HTMLElement | null;
          if (el) { el.focus(); }
        } catch (e) {}
      });
    }
  },
  template: `
<div>
  <h3 id="caption" v-html="'&nbsp;<b>' + strings.s12 + '</b>'"></h3>
  <div id="mode_selector">
    <span id="span.mode.radio1" :hl="isLesson ? 'true' : 'false'"><input type="radio" name="snk.mode.radio" id="snk.mode.radio1" :checked="isLesson" @click="setMode('lesson')"><label for="snk.mode.radio1" v-html="'&nbsp;' + strings.s18 + '&nbsp;&nbsp; [1]&nbsp;&nbsp;'"></label></span>
    <span id="span.mode.radio2" :hl="isBook ? 'true' : 'false'"><input type="radio" name="snk.mode.radio" id="snk.mode.radio2" :checked="isBook" @click="setMode('book')"><label for="snk.mode.radio2" v-html="'&nbsp;' + strings.s19 + '&nbsp;&nbsp; [2]&nbsp;&nbsp;'"></label></span><br>
  </div>
  <div id="mode_lesson" style="padding-left: 10px" v-show="isLesson" :style="{ visibility: isLesson ? 'visible' : 'hidden' }">
    <table border="0" cellpadding="2" cellspacing="3" width="670px" height="220px">
      <tr valign="top">
        <td width="150px">
          <div id="less_map_select">
            <template v-for="i in mapKeys" :key="i">
              <input type="radio" :id="'snk_map_' + i + '_select_id'" name="snk_map_select_id" :value="i" :checked="i === selectedLessonMap" @click="mapClick(i)"><label :for="'snk_map_' + i + '_select_id'" :id="'snk.' + i + '.lbl'" :style="{ fontWeight: (i === selectedLessonMap ? 'bold' : 'normal') }">{{ mapLabel(i) }}</label><br>
            </template>
          </div>
        </td>
        <td style="padding-left: 10px;">
          <div id="less_select" style="">
            <template v-for="lsn in lessonList" :key="lsn.id">
              <input type="radio" :id="lsn.id" name="less_select_nm" :value="lsn.value" :checked="lsn.checked" @click="lessonClick(lsn.g, lsn.k)"><label :for="lsn.id" :id="'snk.' + lsn.value + '.lbl'" :style="lsn.labelStyle" v-html="lsn.html"></label><br>
            </template>
          </div>
        </td>
      </tr>
    </table>
  </div>
  <div id="mode_books" style="padding-left: 10px" v-show="isBook" :style="{ visibility: isBook ? 'visible' : 'hidden' }">
    <template v-if="bookList.length > 0">
      <template v-for="(b, i) in bookList" :key="b.path">
        <input type="radio" :id="'snk_book_' + i + '_id'" name="snk_books_select_id" :value="b.path" :checked="user.CurrentBook === b.path" @click="user.CurrentBook = b.path"><label :for="'snk_book_' + i + '_id'" :id="'snk.' + i + '.lbl'" v-html="b.autor + '&nbsp; -- &nbsp;' + b.book"></label><br>
      </template>
    </template>
    <span v-else v-html="strings.s14"></span>
  </div>
</div>
`
});

const vm = app.mount("#mvu") as MvuVm;

// the smoke test listens for this
(window as any).__mvuMounted = true;

vm.focusLesson();

setTimeout(() => document.body.focus(), 30);

// kbDown (_mode.htm): F4/Enter/Esc close; F8 closes chaining to the library
// dialog (evop = "lib", read back in onbeforeunload); 1/2 switch the mode;
// the original cancel list is preventDefault'ed (was fns.cancl with no event)
document.addEventListener("keydown", function (ev: KeyboardEvent): void {
  const z = ev.keyCode;
  if (z === 115) { window.close(); return; }
  if (z === 13) { window.close(); return; }
  if (z === 27) { window.close(); return; }
  if (z === 119) { vm.evop = "lib"; window.close(); return; }
  if ((z === 10) || (z === 255) || (z === 113) || (z === 114) || (z === 116) || (z === 117) || (z === 118) || (z === 120) || (z === 121) || (z === 122)) {
    ev.preventDefault();
    return;
  }
  if (z === 49) { vm.setMode("lesson"); return; }
  if (z === 50) { vm.setMode("book"); }
});

window.onbeforeunload = function (): void {
  (window as any).dialogArguments.user = user;
  (window as any).dialogArguments.evop = vm.evop;
};

}

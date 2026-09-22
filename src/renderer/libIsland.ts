// Library dialog (book list + "add new book" importer) as a Vue 3 island —
// the Electron port of app/bin/_lib.htm (the original file is the spec; this
// mirrors it section by section). Same pattern as app/bin/sets.html +
// src/renderer/setsIsland.ts: vendored Vue global build, no bundler, file://.
// window.dialogArguments is the live {user, strings} object of the main
// window (see bin/kbDialogChild.js); the reactive user proxy writes straight
// through to it, exactly like the original showModalDialog page.
//
// Everything lives in a namespace (like modeIsland.ts): the islands are
// compiled together by tsconfig.renderer.json and, being import-free
// scripts, would collide in the shared global scope (Vue, dlg, injectSkin,
// app, ...).

namespace lvu {

declare const Vue: any;
declare const api: any;
declare const fs: any;
declare const pf: any; // alf.js global; kept for parity with the original's env

interface StringsTable {
  [key: string]: string;
}

interface User {
  CurrentBook: string;
  skin: string;
}

interface DlgArgs {
  user: User;
  strings: StringsTable;
}

interface BookRec {
  name: string;
  path: string;
  xnun: number;
  autor: string;
  book: string;
  position: string;
}

interface DelState {
  index: number;
  path: string;
  count: number;
  tf: any;
  append: string;
}

interface LibState {
  user: User;
  strings: StringsTable;
  activeTab: string;
  books: BookRec[];
  marked: number;
  deleting: DelState | null;
  pathTo: string;
  ptShow: boolean;
  ptText: string;
  texter: string;
  autor: string;
  bookNm: string;
  iwr: boolean;
  allpas: boolean;
  charset: string;
}

const dlg = (window as any).dialogArguments as DlgArgs;

const user = Vue.reactive(dlg.user) as User;
const strings = dlg.strings;

window.onbeforeunload = function (): void {
  (window as any).dialogArguments.user = user;
};

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

// selector.js replacement: inject the current skin's stylesheet
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

const st = Vue.reactive({
  user: user,
  strings: strings,
  activeTab: "libFiles",
  books: [] as BookRec[],
  marked: 0,
  deleting: null as DelState | null,
  pathTo: "",
  ptShow: false,
  ptText: "",
  texter: "",
  autor: "type author here ...",
  bookNm: "type book name here ...",
  iwr: false,
  allpas: false,
  charset: "Windows-1251"
}) as LibState;

// varieble for storing path to opening file (_lib.htm spelling kept)
let pathToFile = "";
// any: the original's untyped tryOpnFile.selectedFile ("" or a turnObj file)
let selectedFile: any = "";

/* tabs (SelTab in _lib.htm) */

function selTab(par: string): void {
  st.activeTab = par;
}

function infoText(): string {
  return strings[st.activeTab];
}

function tabStyle(par: string): { [key: string]: string } {
  if (st.activeTab === par) {
    return { border: "1px solid maroon", height: "25px", color: "white", top: "8px" };
  }
  return { border: "1px solid gray", height: "22px", color: "gray", top: "10px" };
}

/* book list (loader/mark in _lib.htm) */

function rowStyle(book: BookRec, i: number): { [key: string]: string } {
  return {
    background: (book.path === user.CurrentBook) ? "red" : "black",
    border: (i === st.marked) ? "1px solid red" : "1px solid white",
    padding: "2px 12px",
    color: "white",
    overflow: "hidden",
    width: "100%"
  };
}

function rowText(book: BookRec, i: number): string {
  const d = st.deleting;
  if (d && (d.index === i)) {
    return strings.l7 + d.append;
  }
  return book.autor + "&nbsp; -- &nbsp;" + book.book;
}

function markBook(par: number): void {
  if (st.deleting) { return; }
  if (st.books.length > 0) {
    // the original also called pf(books[par].path) here -- a 2008 no-op
    // reading a pref NAMED by the path; dropped
    st.marked = par;
    user.CurrentBook = st.books[par].path;
  }
}

function scrolLibToView(i: number): void {
  const panel = byId<HTMLElement>("libFiles");
  if (!panel) { return; }
  if (i <= 1) {
    panel.scrollTop = 0;
    return;
  }
  const row = byId<HTMLElement>("book_" + i + "_id");
  const table = byId<HTMLElement>("books_table_id");
  if (!row || !table) { return; }
  const rowH = row.offsetHeight;
  const tht0 = table.offsetHeight;
  const tht2 = (tht0 - rowH * st.books.length) / st.books.length;
  panel.scrollTop = (tht2 + rowH) * i - 48;
}

function loader(): void {
  if (st.deleting) { return; }
  try {
    const res = api.books(true);
    const books: BookRec[] = [];
    if (res) {
      for (const k in res) { // the original's for-in loops were hole-safe
        if (res[k]) { books.push(res[k]); }
      }
    }
    st.books = books;
    let marked = 0;
    for (let i = 0; i < books.length; i++) {
      if (books[i].path === user.CurrentBook) { marked = i; break; }
    }
    st.marked = marked;
    if (books.length > 0) {
      Vue.nextTick(function (): void { scrolLibToView(st.marked); });
    } else {
      selTab("setAds");
    }
  } catch (e) { alert(e); return; }
}

/* delete flow (delt/delt0/delt00 in _lib.htm) */

function delBook(par: number): void {
  if (st.deleting) { return; }
  const books = st.books;
  if (books.length > 0) {
    if (books[par].path === user.CurrentBook) {
      alert(strings.l8);
    } else {
      const okcan = window.confirm(strings.l6 + "''" + books[par].autor + " - " + books[par].book + "'' ???");
      if (okcan) {
        st.deleting = { index: par, path: books[par].path, count: 0, tf: "", append: "" };
        window.setTimeout(delt0, 100);
        window.setTimeout(delt00, 300);
      }
    }
  }
}

function delt0(): void {
  const d = st.deleting;
  if (!d) { return; }
  if (d.path !== "") {
    d.count++;
    // the original's fs.open(path) poll, guarded (IE FSO cache refresh)
    try { if (typeof fs.open === "function") { fs.open(d.path); } } catch (e) {}
    if (fs.exists(d.path) || (d.tf === "")) {
      d.append += "  ...  " + d.count;
      window.setTimeout(delt0, 100);
    } else {
      // the original set document.title = "" + tf + " " + cnt here (a debug
      // leftover) -- dropped
      if (d.tf == false) {
        alert("Can't delete this book. Something wrong.");
      } else {
        st.deleting = null;
        window.setTimeout(loader, 500);
      }
    }
  }
}

function delt00(): void {
  const d = st.deleting;
  if (d && (d.path !== "")) {
    d.tf = api.deltebook(d.path);
  }
}

/* makeIWR -- the book-format heart; regex map copied verbatim from _lib.htm */

function makeIWR(str: string, view: boolean): string {
  const miwr = st.iwr ? 1 : 0;
  const allpas = st.allpas ? 1 : 0;

  let pas: Array<[RegExp, string, string]>;
  if (!miwr) {
    pas = [[/\n\r|\r\n|\n|\r/g, " ", " "]];
  } else if (allpas) {
    pas = [[/\n\r|\r\n|\n|\r/g, "&crarr;<br>", "¶"]];
  } else {
    pas = [
      [/\?\n\r|\?\r\n|\?\n|\?\r/g, "?&crarr;<br>", "?¶"],
      [/\!\n\r|\!\r\n|\!\n|\!\r/g, "!&crarr;<br>", "!¶"],
      [/\.\n\r|\.\r\n|\.\n|\.\r/g, ".&crarr;<br>", ".¶"],
      [/\:\n\r|\:\r\n|\:\n|\:\r/g, ":&crarr;<br>", ":¶"],
      [/\n\r\n\r|\r\n\r\n|\n\n|\r\r/g, "<br>", "¶"],
      [/\n\r\t*(?=[0-9])|\n\r\t*(?=[0-9])|\n\t*(?=[0-9])|\r\t*(?=[0-9])/g, "&crarr;<br>", "¶"],
      [/\n\r\t*(?=[a-z]\.)|\n\r\t*(?=[a-z]\.)|\n\t*(?=[a-z]\.)|\r\t*(?=[a-z]\.)/g, "&crarr;<br>", "¶"],
      [/\n\r|\r\n|\n|\r/g, " ", " "]
    ];
  }
  for (let i = 0; i < pas.length; i++) {
    str = str.replace(pas[i][0], (view ? pas[i][1] : pas[i][2]));
  }

  return str;
}

/* texter -- txtdiv updates after a delay */

function texterSchedule(str: string, delay: number): void {
  window.setTimeout(function (): void { st.texter = str; }, delay);
}

/* add-new-book tab (tryOpnFile/loadFile/saver in _lib.htm) */

function pathToOver(): void {
  try {
    if ((pathToFile !== "") && pathToFile.length > 25) {
      st.ptShow = true;
      st.ptText = pathToFile;
    }
  } catch (e) {}
}

function pathToOut(): void {
  if (st.ptShow) {
    st.ptShow = false;
  }
}

function loadFile(ob?: HTMLElement): void {
  let errOnOpn = true;
  let strErr = "";
  try {
    const file = selectedFile;
    const charset = st.charset;
    if (file !== "") {
      if (fs.exists(file.path)) {
        st.pathTo = file.path.substring(0, 45 - file.name.length) + "&nbsp;&nbsp;...&nbsp;&nbsp;\\" + file.name;
        pathToFile = file.path;
        if (ob && (ob.id === "btnOpenFile")) {
          window.setTimeout(pathToOver, 200);
          window.setTimeout(pathToOut, 900);
        }
        // reading file
        texterSchedule("reading file... please wait...", 100);
        const str = fs.readFileToString(file.path, charset);
        if (str) {
          const preview = makeIWR(str.substr(0, ((str.length > 10000) ? 10000 : str.length)), true);
          texterSchedule(preview, 500);
          // reading file
          errOnOpn = false;
        } else {
          strErr += "<font color = \"red\" size = \"7\">Can't read from File...</font>";
        }
      }
    }
  } catch (e) { strErr += String(e); }
  if (errOnOpn) {
    texterSchedule(strings.l0 + strings.l4 + "<br><br> " + strErr, 1000);
  }
}

function tryOpnFile(ob?: HTMLElement): void {
  let errOnOpn = true;
  let strErr = "";
  try {
    const file = fs.openTextFileDlg();
    if (file) {
      selectedFile = fs.turnObj(file);
      if (file) {
        loadFile(ob);
        errOnOpn = false;
      }
    }
  } catch (e) { strErr += String(e); }
  if (errOnOpn) {
    texterSchedule(strings.l0 + strings.l4_1 + " <br><br> " + strErr, 1000);
    st.pathTo = "&nbsp;";
  }
}

function saver(): void {
  if (selectedFile === "") {
    texterSchedule(strings.l0 + strings.l4, 10);
  } else {
    let errOnOpn = true;
    let strErr = "";
    const booksMax = api.books(); // max book number -- NEVER books.length
    try {
      const file = selectedFile;
      const charset = st.charset;
      if (file !== "") {
        if (fs.exists(file.path)) {
          texterSchedule(strings.l5, 100);
          let str = fs.readFileToString(file.path, charset);
          if (str) {

            // очистка строки

            str = str.replace(/--/g, "-");
            str = str.replace(/–/g, "-");
            str = str.replace(/«/g, "\"");
            str = str.replace(/»/g, "\"");
            str = str.replace(/—/g, "-");

            do {
              str = str.replace(/…/g, "...");
            } while (str.indexOf("…") !== -1);

            str = makeIWR(str, false); // false -- by paragraph "¶"

            do {
              str = str.replace(/  /g, " ");
            } while (str.indexOf("  ") !== -1);

            // original quirk: the loop condition tests double spaces (all
            // gone by now), so this pass runs exactly once
            str = str.replace(/¶ /g, "¶");

            let chsps = true;
            do {
              if (str.length > 0) {
                if (str.substr(0, 1) === " ") {
                  str = str.substring(1);
                } else {
                  chsps = false;
                }
              } else {
                chsps = false;
              }
            } while (chsps);

            // очистка строки

            const kDir = fs.lib(); // returns the lib dir WITH trailing separator
            const locName = "book_" + booksMax + ".txt";
            const loc = kDir + locName;

            const autor_id_str = st.autor;
            const bookname_id_str = st.bookNm;

            api.saveBook(loc, str, autor_id_str, bookname_id_str);

            texterSchedule("Saving DONE:<br>" + locName + "<br>" + autor_id_str + "<br>" + bookname_id_str + "<br>" + str.substr(0, ((str.length > 10000) ? 10000 : str.length)), 500);
            errOnOpn = false;
            alert(strings.l3);

            loader();
          } else {
            strErr += "<font color = \"red\" size = \"7\">Can't read from File...</font>";
          }
        }
      }
    } catch (e) { strErr += String(e); }
    if (errOnOpn) {
      texterSchedule(strings.l0 + strings.l4_1 + " <br><br> " + strErr, 1000);
    }
  }
}

/* input helpers (of_a/of_ab/of_b/of_bb in _lib.htm) */

function autorFocus(): void { if (st.autor === "type author here ...") { st.autor = ""; } }
function autorBlur(): void { if (st.autor === "") { st.autor = "type author here ..."; } }
function bookFocus(): void { if (st.bookNm === "type book name here ...") { st.bookNm = ""; } }
function bookBlur(): void { if (st.bookNm === "") { st.bookNm = "type book name here ..."; } }

// the original's onclick="this.blur()" on the iwr/allpas checkboxes
function chkBlur(ev: MouseEvent): void {
  try {
    const t = ev.target as HTMLElement | null;
    if (t) { t.blur(); }
  } catch (e) {}
}

/* keyboard (kbDown in _lib.htm + escEr.js; only the list branch is gated
   on the libFiles tab and on no delete being in progress) */

function kbDown(event: KeyboardEvent): void {
  const z = event.keyCode;
  const ctrlK = event.ctrlKey;

  if (z === 27) { window.close(); return; } // escEr.js

  if (z === 119) { window.close(); }

  if ((z === 10) || (z === 255) || ((z > 112) && (z < 119)) || ((z > 119) && (z < 123))) { event.preventDefault(); }

  if (ctrlK) {
    if (z === 76) { event.preventDefault(); selTab("libFiles"); } // L
    if (z === 65) { event.preventDefault(); selTab("setAds"); }
    if ((z === 79) && (st.activeTab === "setAds")) { tryOpnFile(); }
  }

  if ((st.activeTab === "libFiles") && !st.deleting) {
    const books = st.books;
    if ((z === 46) || (ctrlK && (z === 68))) {
      if (books.length > 0) {
        delBook(st.marked);
      }
    }
    if ((z === 39) || (z === 40)) {
      if (books.length > 0) {
        if ((st.marked + 1) < books.length) { st.marked = st.marked + 1; }
        Vue.nextTick(function (): void { scrolLibToView(st.marked); });
      }
    }
    if ((z === 37) || (z === 38)) {
      if (books.length > 0) {
        if ((st.marked - 1) >= 0) { st.marked = st.marked - 1; }
        Vue.nextTick(function (): void { scrolLibToView(st.marked); });
      }
    }
    if ((z === 13) || (z === 32)) {
      if ((books.length > 0) && (st.marked >= 0) && (st.marked < books.length)) {
        if (books[st.marked].path === user.CurrentBook) {
          window.close();
        } else {
          markBook(st.marked);
        }
      }
    }
  }
}

injectSkin();

const app = Vue.createApp({
  data: function () {
    return st;
  },
  methods: {
    selTab: selTab,
    infoText: infoText,
    tabStyle: tabStyle,
    rowStyle: rowStyle,
    rowText: rowText,
    markBook: markBook,
    delBook: delBook,
    loader: loader,
    pathToOver: pathToOver,
    pathToOut: pathToOut,
    loadFile: loadFile,
    tryOpnFile: tryOpnFile,
    saver: saver,
    autorFocus: autorFocus,
    autorBlur: autorBlur,
    bookFocus: bookFocus,
    bookBlur: bookBlur,
    chkBlur: chkBlur
  },
  // NOTE (prod Vue gotcha): never put children -- &nbsp; included -- inside
  // an element that carries v-html/v-text; entities belong in the bound
  // strings only.
  template: `
<div id="InfoRMer" style="position: absolute; top: 34px; left: 8px; height: 15px; width: 530px; border: 3px double maroon; font-size: 11px; color: white; padding: 4px 3px 2px 12px; text-align: left; background: black; overflow: auto; z-index: 3" v-html="infoText()"></div>
<div id="libFilesTab" class="tabs" style="left: 15px; width: 150px;" :style="tabStyle('libFiles')" @click="selTab('libFiles')" v-html="strings.l1"></div>
<div id="libFiles" class="pannels" style="left: 12px; width: 530px;" v-show="activeTab === 'libFiles'"><div v-if="books.length === 0" v-html="strings.s10"></div><table v-else id="books_table_id" border="0" cellspacing="1" cellpadding="1" width="100%" :class="{ 'lvu-deleting': deleting !== null }"><tr v-for="(book, i) in books" :key="book.path"><td><div :id="'book_' + i + '_id'" :style="rowStyle(book, i)" @click="markBook(i)" v-html="rowText(book, i)"></div></td><td style="paddind: 4px"><div class="delbut" :id="'delbut_' + i" @click="delBook(i)"> X</div></td></tr></table></div>
<div id="setAdsTab" class="tabs" style="left: 172px; width: 180px;" :style="tabStyle('setAds')" @click="selTab('setAds')" v-html="strings.l2"></div>
<div id="setAds" class="pannels" style="left: 12px; width: 530px;" v-show="activeTab === 'setAds'">
  <form id="bookform" name="bookform" @submit.prevent>
    <span style="top: 10px; left: 10px" v-html="strings.l10 + '&nbsp;:'"></span>
    <div class="btn" style="position: absolute; top: 10px; left: 80px; height: 14px; width: 344px; padding-top: 3px; overflow: hidden; padding-bottom: 1px"><div id="pathTo" style="overflow: hidden" @mouseover="pathToOver()" @mouseout="pathToOut()" v-html="pathTo"></div><input id="btnOpenFile" type="button" style="padding-bottom: 2px; top: 1px; height: 16px; left: 320px; width: 28px; z-index: 5; cursor: crosshair" tabindex="1" @click="tryOpnFile($event.target)" value=". . ."></div>
    <div id="ptHilight" v-show="ptShow" style="position: absolute; top: 35px; left: 20px; height: 40px; width: 500px; font: caption; z-index: 100; border: 1px solid gray; background: #FFFFE0; color: black; padding: 5px" v-html="ptText"></div>
    <input id="btnSaver" type="button" style="top: 9px; height: 22px; left: 435px; width: 94px; padding-bottom: 4px; cursor: pointer" value="Save To Library" tabindex="6" @click="saver" />
    <span style="top: 39px; left: 10px" v-html="strings.l11 + '&nbsp;:'"></span>
    <input name="autor" id="autor" type="text" style="top: 38px; left: 80px; width: 150px" size="60" tabindex="2" v-model="autor" @focus="autorFocus()" @blur="autorBlur()" />
    <span style="top: 39px; left: 240px" v-html="strings.l12 + '&nbsp;:'"></span>
    <input name="book" id="book" type="text" style="top: 38px; left: 310px; width: 212px" size="60" tabindex="3" v-model="bookNm" @focus="bookFocus()" @blur="bookBlur()" />
    <input name="iwr" id="iwr" type="checkbox" style="top: 67px; left: 10px; width: 20px" tabindex="4" @click="chkBlur($event)" @change="loadFile()" />
    <label id="lforiwr" for="iwr" style="top: 72px; left: 10px; width: 270px; padding-left: 30px; border: 0" v-html="strings.l9"></label>
    <input name="allpas" id="allpas" type="checkbox" style="top: 67px; left: 290px; width: 20px" tabindex="4" @click="chkBlur($event)" @change="loadFile()" />
    <label id="lforallpas" for="allpas" style="top: 72px; left: 290px; width: 100px; padding-left: 30px; border: 0" v-html="strings.l9_1"></label>
    <select id="charset_id" tabindex="5" style="top: 67px; left: 420px; width: 110px; height: 20px" v-model="charset" @change="loadFile()">
      <option value="Windows-1251">&nbsp;windows-1251</option>
      <option value="koi8-r">&nbsp;KOI-8r</option>
      <option value="UTF-8">&nbsp;UTF-8</option>
      <option value="unicode">&nbsp;UTF-16LE</option>
      <option value="unicodeFFFE">&nbsp;UTF-16BE</option>
      <option value="ascii">&nbsp;ASCII (latin1)</option>
    </select>
    <div id="txtdiv" class="tabs" style="top: 100px; left: 8px; width: 500px; height: 180px; font-size: 12px; padding: 10px; z-index: 10; text-align: justify; color: white" v-html="texter"></div>
  </form>
</div>
`
});

app.mount("#lvu");

// the smoke test listens for this
(window as any).__lvuMounted = true;

document.addEventListener("keydown", kbDown);

// the original: texter.str = strings.l0_0; ev.t("texter()", 10);
window.setTimeout(function (): void { st.texter = strings.l0_0; }, 10);

// the original: ev.t("loader()", 300) "for body rendering complete" -- Vue's
// nextTick gives that DOM-ready beat inside loader/scrolLibToView
loader();

window.setTimeout(function (): void { document.body.focus(); }, 30);

}

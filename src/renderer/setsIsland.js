"use strict";
// Settings dialog as a Vue 3 island — the Electron port of app/bin/_sets.htm
// (the original file is the spec; this mirrors it section by section).
// Same pattern as app/locale/help.html: vendored Vue global build, no bundler,
// file://. window.dialogArguments is the live {kb, snk, usr, kernel, layouts,
// skins, strings} object of the main window (see bin/kbDialogChild.js), so
// v-model writes on the reactive usr proxy go straight through to it — that
// is how the settings apply, exactly like the original showModalDialog page.
const dlg = window.dialogArguments;
// the original page aliased them the same way (snks = dialogArguments.snk)
const kb = dlg.kb;
const snks = dlg.snk;
const usr = Vue.reactive(dlg.usr);
const layouts = dlg.layouts;
const skins = dlg.skins;
const strings = dlg.strings;
function byId(id) {
    return document.getElementById(id);
}
function skinMeta(name) {
    return skins[name];
}
// selector.js replacement: (re)inject the current skin's stylesheet
let skinLink = null;
function injectSkin() {
    try {
        if (skinLink && skinLink.parentNode) {
            skinLink.parentNode.removeChild(skinLink);
        }
    }
    catch (e) { }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.id = "slinskin" + Math.random().toString(36).slice(2);
    link.href = "../skins/skin." + (usr.skin || "native") + ".css";
    const head = document.getElementsByTagName("head")[0];
    if (head) {
        head.appendChild(link);
        skinLink = link;
    }
}
function skinAuthorHtml(nmskn) {
    const skinval = skinMeta(nmskn);
    let strptalm = "";
    if (skinval.author !== "") {
        strptalm += "powered by : " + skinval.author + "<br />";
    }
    if (skinval.link !== "") {
        strptalm += "<a href = \"" + skinval.link + "\">" + skinval.link + "</a><br />";
    }
    if (skinval.mail !== "") {
        strptalm += "<a href = \"mailto:" + skinval.mail + "\">" + skinval.mail + "</a><br />";
    }
    return strptalm;
}
injectSkin();
const app = Vue.createApp({
    data: function () {
        const mc = usr.mapChanger;
        // the original rolled Math.random() per option at build time (starter);
        // precompute the labels once, the same way
        const layoutOptions = [];
        for (const key of Object.keys(layouts.arr)) {
            const name = layouts.arr[key][1];
            const label = (name === "native")
                ? strings.s45 + "&nbsp;&nbsp;&nbsp;"
                : (Math.round(Math.random()) ? strings.s46 + " ?" : strings.s47 + " ?") + "&nbsp;&nbsp;&nbsp;";
            layoutOptions.push({ key: key, label: label });
        }
        const skinOptions = [];
        for (const key of Object.keys(skins.arr)) {
            const nmskn = skins.arr[key][1];
            const meta = skinMeta(nmskn);
            const label = (meta.name !== "")
                ? "&nbsp;" + meta.name + "&nbsp;"
                : "&nbsp;" + nmskn + "&nbsp;&nbsp;&nbsp;";
            skinOptions.push({ key: key, label: label });
        }
        return {
            usr: usr,
            strings: strings,
            maps: kb.mapsarr,
            questor: null,
            questorChoice: "0",
            kbch: (mc[0] && mc[1] && !mc[2]) ? 2 : 1,
            hiderIntervalText: "" + usr.hiderInterval,
            layoutSel: usr.layouts,
            skinSel: usr.skin,
            skinInfo: skinAuthorHtml(usr.skin),
            layoutOptions: layoutOptions,
            skinOptions: skinOptions,
            tbase: 6 + kb.mapsarr.length
        };
    },
    computed: {
        hiderLabel: function () {
            return (usr.keybView && usr.hider) ? strings.s36 + " " + strings.s37 : strings.s36;
        }
    },
    methods: {
        // was snk.setsClicker's errMode branch: unchecking errMode drops oneErrOnly
        onErrModeChange: function () {
            if (!usr.errMode) {
                usr.oneErrOnly = false;
            }
        },
        isMapSelected: function (map) {
            return (usr.selectedMaps[0] === map) || (usr.selectedMaps[1] === map);
        },
        mapClick: function (par, ev) {
            try {
                const t = ev.target;
                if (t) {
                    t.blur();
                }
            }
            catch (e) { }
            this.reselectMapsArr(par);
        },
        reselectMapsArr: function (par) {
            layouts.resizer(0);
            const arr = par.split(".");
            let selm = "";
            let selmi = 0;
            for (let i = 0; i < usr.selectedMaps.length; i++) {
                const sm = usr.selectedMaps[i].split(".");
                if (sm[0] === arr[0]) {
                    selm = usr.selectedMaps[i];
                    selmi = i;
                }
            }
            if (selm !== "") { // 1 from 1
                usr.selectedMaps[selmi] = par;
                kb.loadselectedmaps();
                usr.currentMap = par.split(".")[0];
                kb.changeMap.map = usr.currentMap;
                layouts.evaluator(usr.layouts);
                // checkbox states (enabled/checked/bold) re-derive from usr.selectedMaps
                layouts.resizer();
                layouts.resizer(true);
                layouts.translator(1);
                document.body.focus();
                snks.keychkb();
            }
            else { // 1 from 2
                this.questor = [
                    [par, usr.selectedMaps[1]],
                    [usr.selectedMaps[0], par]
                ];
                this.questorChoice = "0";
                // the clicked checkbox stays unchecked; usr.selectedMaps did not change
            }
        },
        selectNewMaps: function () {
            const questor = this.questor;
            if (!questor) {
                return;
            }
            const mdaqwest = (this.questorChoice === "0") ? 0 : 1;
            usr.selectedMaps = questor[mdaqwest];
            kb.loadselectedmaps();
            usr.currentMap = usr.selectedMaps[0].split(".")[0];
            kb.current_map = usr.currentMap;
            // all map checkboxes re-derive from usr.selectedMaps
            layouts.evaluator();
            layouts.resizer();
            layouts.resizer(true);
            layouts.translator(1);
            this.questor = null;
            snks.keychkb();
        },
        resetKbChanger: function (par) {
            if (par === 1) {
                usr.mapChanger = [0, 1, 1];
            }
            if (par === 2) {
                usr.mapChanger = [1, 1, 0];
            }
            this.kbch = par;
        },
        setskeybView: function () {
            // the original forced the hider checkbox off with keybView
            if (!usr.keybView) {
                usr.hider = false;
            }
            layouts.resizer(usr.keybView);
            document.body.focus();
        },
        checkHiderInterval: function () {
            const par = parseInt(this.hiderIntervalText, 10);
            if ((par < 999) && (par > 50)) {
                usr.hiderInterval = par;
            }
            else {
                alert("Incorrect value. \n correct value is more than 50 but less than 999. ");
                this.hiderIntervalText = "" + usr.hiderInterval;
                try {
                    const inp = byId("snk.hiderInterval.txt");
                    if (inp) {
                        inp.focus();
                    }
                }
                catch (e) { }
            }
        },
        reselectLayout: function () {
            const ener = this.layoutSel;
            if (usr.layouts !== ener) {
                usr.layouts = ener;
                layouts.selted = layouts.arr[ener];
                layouts.layoutLoad();
                layouts.evaluator();
                layouts.resizer();
                layouts.resizer(true);
                layouts.translator(1);
                layouts.resizer(usr.keybView);
                try {
                    document.body.focus();
                    const sel = byId("snk_layout_select_id");
                    if (sel) {
                        sel.focus();
                    }
                }
                catch (e) { }
            }
        },
        reselectKbSize: function (par) {
            if (usr.keybView) {
                const rad = byId("snk_keybSize_radio_id" + par);
                const ener = rad ? rad.value : "";
                if (usr.keybSize !== ener) {
                    usr.keybSize = ener;
                    layouts.evaluator();
                    layouts.resizer();
                    layouts.resizer(true);
                    layouts.translator(1);
                    try {
                        document.body.focus();
                        if (rad) {
                            rad.focus();
                        }
                    }
                    catch (e) { }
                }
            }
        },
        reselectSkin: function () {
            const ener = this.skinSel;
            if (ener !== skins.selted[1]) {
                this.skinInfo = skinAuthorHtml(ener);
                usr.skin = ener;
                skins.selted = skins.arr[ener];
                skins.skinLoad();
                layouts.resizer();
                layouts.resizer(true);
                layouts.translator(1);
                injectSkin();
            }
            try {
                document.body.focus();
                const sel = byId("snk_skin_select_id");
                if (sel) {
                    sel.focus();
                }
            }
            catch (e) { }
        },
        scroller: function () {
            try {
                document.body.scrollTop = document.body.scrollTop + 50;
            }
            catch (e) { }
        }
    },
    template: `
<div id="questorDiv" v-show="questor !== null" style="width: 600px; padding: 20px;">
  <form name="genF">
    <template v-for="(q, i) in questor" :key="i">
      <input type="radio" :id="'radio_id_map' + i" name="radio_id_map" :value="'' + i" :tabindex="1 + i" v-model="questorChoice">
      <label :for="'radio_id_map' + i" v-html="' &nbsp;&nbsp;' + q[0] + ' &nbsp;&nbsp;&amp;&nbsp;&nbsp; ' + q[1] + ' '"></label><br />
    </template>
    <hr width="30%" style="margin-left: 15px">
    <input type="button" :tabindex="3" value="OK" style="width: 50px; margin-left: 50px" @click="selectNewMaps">
  </form>
</div>
<div id="mainDiv" v-show="questor === null" style="width: 702px;">
  <p id="titl" style="width: 90%; font-size: 12px; padding-left: 30px; height: 20px;" v-html="strings.s16"></p>
  <div style="width: 680px; text-align: center;">
    <fieldset style="width: 650px; text-align: left;">
      <legend id="msL" v-html="strings.s26"></legend>
      <table border="0" cellpadding="2" cellspacing="2">
        <tr>
          <td valign="top" style="width: 320px">&nbsp;</td>
          <td valign="top" style="width: 320px"><div id="msmapsCaption" v-html="strings.s24"></div></td>
        </tr>
        <tr>
          <td valign="top" style="width: 320px">
            <input tabindex="1" type="checkbox" id="snk.errMode.chk" v-model="usr.errMode" @change="onErrModeChange"><label for="snk.errMode.chk" v-html="strings.s21"></label><br />
            <input tabindex="2" type="checkbox" id="snk.oneErrOnly.chk" v-model="usr.oneErrOnly" :disabled="!usr.errMode"><label for="snk.oneErrOnly.chk" v-html="strings.s31"></label><br />
            <input tabindex="3" type="checkbox" id="snk.ErrAlwaysCount.chk" v-model="usr.ErrAlwaysCount"><label for="snk.ErrAlwaysCount.chk" v-html="strings.s32"></label><br />
            <input tabindex="4" type="checkbox" id="snk.skipNonTypedCharacters.chk" v-model="usr.skipNonTypedCharacters"><label for="snk.skipNonTypedCharacters.chk" v-html="strings.s49"></label><br />
            <input tabindex="5" type="checkbox" id="snk.hideStatsOnPause.chk" v-model="usr.hideStatsOnPause"><label for="snk.hideStatsOnPause.chk" v-html="strings.s54"></label><br /><br />
          </td>
          <td valign="top" style="width: 320px; padding: 9px 5px 5px 20px; overflow: auto; border: 1px solid gray" id="msmaps">
            <template v-for="(m, mi) in maps" :key="m">
              <input type="checkbox" :id="'snk.' + m + '.chk'" :tabindex="6 + mi" :checked="isMapSelected(m)" :disabled="isMapSelected(m)" @click="mapClick(m, $event)"><label :for="'snk.' + m + '.chk'" :id="'snk.' + m + '.lbl'" :style="{ fontWeight: (isMapSelected(m) ? 'bold' : 'normal') }" v-text="m"></label><br />
            </template>
          </td>
        </tr>
      </table>
    </fieldset>
    <br />
    <fieldset style="width: 630px; text-align: left;">
      <legend id="kbL" v-html="strings.s29"></legend>
      <table border="0" cellpadding="2" cellspacing="2">
        <tr>
          <td valign="top">
            <fieldset style="width: 620px; text-align: left;">
              <legend id="kbLL" v-html="strings.s38"></legend>
              <table border="0" cellpadding="2" cellspacing="2">
                <tr>
                  <td>
                    <nobr>&nbsp;
                      <input type="radio" id="snk_kbCH_radio_id1" name="snk_kbCH_radio_id" :tabindex="tbase + 1" :checked="kbch === 1" @click="resetKbChanger(1)"><label for="snk_kbCH_radio_id1"> Alt + Shift </label> &nbsp;
                      <input type="radio" id="snk_kbCH_radio_id2" name="snk_kbCH_radio_id" :tabindex="tbase + 2" :checked="kbch === 2" @click="resetKbChanger(2)"><label for="snk_kbCH_radio_id2"> Ctrl + Shift </label>
                    </nobr>
                  </td>
                  <td id="kbLLDivText" style="padding-left: 30px; font-size: 11px" v-html="strings.s53"></td>
                </tr>
              </table>
            </fieldset>
          </td>
        </tr>
        <tr>
          <td valign="top">
            <fieldset style="width: 620px; text-align: left;">
              <legend id="kbKL" v-html="strings.s44"></legend>
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="400px" valign="top">
                    <input type="checkbox" id="snk.keybView.chk" v-model="usr.keybView" @change="setskeybView" :tabindex="tbase + 3"><label for="snk.keybView.chk" v-html="strings.s35"></label>
                    <table border="0" cellpadding="0" cellspacing="1" style="margin: 5px 0px 5px 15px">
                      <tr>
                        <td>
                          <input type="checkbox" id="snk.hider.chk" v-model="usr.hider" @change="setskeybView" :disabled="!usr.keybView" :tabindex="tbase + 4"><label for="snk.hider.chk" v-html="hiderLabel"></label>
                        </td>
                        <td valign="bottom">
                          <input type="text" id="snk.hiderInterval.txt" class="stndt" style="height: 16px; border: 0px solid black; padding: 1px; padding-left: 7px;" maxlength="3" size="3" value="" v-model="hiderIntervalText" @change="checkHiderInterval" :disabled="!usr.keybView" :tabindex="tbase + 4" v-show="usr.keybView && usr.hider">
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <input type="checkbox" id="snk.spaceIsShiftSensentive.chk" v-model="usr.spaceIsShiftSensentive" :disabled="!usr.keybView" :tabindex="tbase + 5"><label for="snk.spaceIsShiftSensentive.chk" v-html="strings.s34"></label><br />
                          <input type="checkbox" id="snk.spaceInvert.chk" v-model="usr.spaceInvert" :disabled="!usr.keybView || !usr.spaceIsShiftSensentive" :tabindex="tbase + 6"><label for="snk.spaceInvert.chk" v-html="strings.s33"></label><br />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="220px" valign="top">
                    <nobr id="strings.s25" v-html="strings.s25"></nobr><br />
                    <select id="snk_layout_select_id" size="4" v-model="layoutSel" @change="reselectLayout" :disabled="!usr.keybView" :tabindex="tbase + 7" style="margin: 5px 0px">
                      <option v-for="opt in layoutOptions" :key="opt.key" :value="opt.key" v-html="opt.label"></option>
                    </select>
                  </td>
                </tr>
              </table>
            </fieldset>
          </td>
        </tr>
      </table>
      <br />
    </fieldset>
    <br />
    <fieldset style="width: 640px; text-align: left;">
      <legend id="kbKKL" v-html="strings.s28"></legend>
      <table border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td width="300px" style="padding: 5px 5px 5px 15px">
            <nobr id="strings.s23" v-html="strings.s23"></nobr><br />
            <select id="snk_skin_select_id" style="width: 250px; margin: 10px 10px 10px 10px;" size="5" v-model="skinSel" @change="reselectSkin" @focus="scroller" :tabindex="tbase + 8">
              <option v-for="opt in skinOptions" :key="opt.key" :value="opt.key" v-html="opt.label"></option>
            </select>
            <br />
            <div id="kbKKLDivCont" style="width: 225px; padding: 3px 10px 4px 11px; border: 1px solid white; background: black; color: white" v-html="skinInfo"></div>
            <br />
          </td>
          <td width="320px" valign="top">
            <nobr id="strings.s39" v-html="strings.s39"></nobr><br /><br />
            <nobr>
              <input type="radio" id="snk_keybSize_radio_id1" @click="reselectKbSize(1)" @focus="scroller" name="snk_keybSize_radio_id" value="big" :checked="usr.keybSize === 'big'" :disabled="!usr.keybView" :tabindex="tbase + 9">
              <label for="snk_keybSize_radio_id1" v-html="strings.s40"></label>
            </nobr><br />
            <nobr>
              <input type="radio" id="snk_keybSize_radio_id2" @click="reselectKbSize(2)" @focus="scroller" name="snk_keybSize_radio_id" value="med" :checked="usr.keybSize === 'med'" :disabled="!usr.keybView" :tabindex="tbase + 10">
              <label for="snk_keybSize_radio_id2" v-html="strings.s41"></label>
            </nobr><br />
            <nobr>
              <input type="radio" id="snk_keybSize_radio_id3" @click="reselectKbSize(3)" @focus="scroller" name="snk_keybSize_radio_id" value="sml" :checked="usr.keybSize === 'sml'" :disabled="!usr.keybView" :tabindex="tbase + 11">
              <label for="snk_keybSize_radio_id3" v-html="strings.s42"></label>
            </nobr><br />
          </td>
        </tr>
      </table>
    </fieldset>
    <br /><br />
    <hr size="1">
    <hr size="1">
    <center>&nbsp;</center>
    <hr size="1">
    <hr size="1">
  </div>
</div>
`
});
app.mount("#svu");
// the smoke test listens for this
window.__svuMounted = true;
setTimeout(function () { document.body.focus(); }, 30);
document.title = "e == mc ^ 2";
// kbDown (_sets.htm) + escEr.js: Esc and F5 close, the other F-keys and
// keyCodes 10/255 are cancelled
document.addEventListener("keydown", function (ev) {
    const z = ev.keyCode;
    if (z === 27) {
        window.close();
        return;
    }
    if (z === 116) {
        ev.preventDefault();
        window.close();
        return;
    }
    if ((z === 10) || (z === 255) || ((z > 112) && (z < 116)) || ((z > 116) && (z < 123))) {
        ev.preventDefault();
    }
});
window.onbeforeunload = function () {
    window.dialogArguments.usr = usr;
};

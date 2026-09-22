// Pure cores of the era stats math: fns.lz / fns.time_HMS / fns.count_perc
// (app/bin/fns.js) and the speed line of app.counter (app/bin/app.js).
// Era quirks are preserved on purpose — the UI strings depend on them.

export function lz(str: string): string {
	// leading zero
	if (str.length === 1) { str = "0" + str; }
	return str;
}

export interface Hms {
	h: string; m: string; s: string;
	hh: string; mm: string; ss: string;
	ht: string; mt: string; st: string;
	str: string; stt: string;
}

// nt: the era strings.nt localized label triple ([hours, minutes, seconds]),
// cut to 2 chars each. NOTE the era quirk: minutes are floor(par/60), NOT
// mod 60 — 3661s formats as "01 : 61 : 01". Do not "fix".
export function timeHMS(par: number, nt?: [string, string, string]): Hms {
	const h = "" + Math.floor(par / 3600);
	const m = "" + Math.floor(par / 60);
	const s = "" + (par - (60 * Math.floor(par / 60)));
	const hh = lz(h);
	const mm = lz(m);
	const ss = lz(s);
	let ht: string, mt: string, st: string;
	if (nt !== undefined) {
		ht = hh + nt[0].substr(0, 2);
		mt = mm + nt[1].substr(0, 2);
		st = ss + nt[2].substr(0, 2);
	} else {
		ht = hh + "h";
		mt = mm + "m";
		st = ss + "s";
	}
	return {
		h, m, s, hh, mm, ss, ht, mt, st,
		str: hh + " : " + mm + " : " + ss,
		stt: ht + " : " + mt + " : " + st
	};
}

// String-split truncation, NOT rounding: 1/3 -> "33.33", 1/8 -> "12.5"
// (single digit kept as-is), 2/5 -> "40.00". Guards: zn == 0, ch == 0 and
// negative -> "0.00". Era quirk: an undefined numerator with a defined
// denominator rides through NaN and comes out as "NaN.00" — preserved.
export function countPerc(parCh: number | undefined, parZn: number | undefined, divs = "."): string {
	let perc = 0;
	if ((parCh === undefined) || (parZn === undefined)) { perc = 0; }
	if (parZn !== 0) { perc = (parCh as number) / (parZn as number) * 100; } else { perc = 0; }
	if (parCh == 0) { perc = 0; }
	if (perc < 0) { perc = 0; }
	const parts = ("" + perc).split(".");
	if (parts.length === 1) { parts[1] = "00"; }
	return "" + parts[0] + divs + parts[1].substr(0, 2);
}

// Typing speed, chars per minute. 0 until the first timer tick.
export function speed(cntSess: number, timerCnt: number): number {
	return timerCnt > 0 ? Math.round(cntSess / timerCnt * 60) : 0;
}

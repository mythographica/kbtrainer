// Pure math of kbFit.apply (app/bin/fit.js): scale the skin's fixed design
// canvas (dw x dh) into the window content size (iw x ih), centered, with a
// CSS transform. s == 1 means pixel-perfect — no transform at all.
export interface FitResult {
	s: number;
	ox: number;
	oy: number;
	transform: string;
}

export function fitScale(iw: number, ih: number, dw: number, dh: number): FitResult {
	const s = Math.min(iw / dw, ih / dh);
	const ox = Math.max(0, Math.round((iw - dw * s) / 2));
	const oy = Math.max(0, Math.round((ih - dh * s) / 2));
	return { s, ox, oy, transform: (s === 1) ? "" : "scale(" + s + ")" };
}

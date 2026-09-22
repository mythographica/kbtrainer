// Window geometry: pure math, no Electron imports — unit-tested in tests/.

// The app was designed for 1024x768 (native skin, small keyboard); its
// design canvas is scaled to today's screen before the window is rendered.
export const DESIGN_W = 760;
export const DESIGN_H = 280;
export const ZOOM_FACTOR = 1.1;

export interface Size {
	w: number;
	h: number;
}

// Electron.Rectangle is structurally identical — no dependency needed.
export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

// Round and clamp a desired size so it never grows past the work area.
export function clampToArea(w: number, h: number, area: { width: number; height: number }): Size {
	return {
		w: Math.min(Math.round(w), area.width),
		h: Math.min(Math.round(h), area.height)
	};
}

// Top-left position that puts a rect of outerW x outerH exactly in the
// middle of the work area (outer = content + frame insets).
export function centeredXY(area: Rect, outerW: number, outerH: number): { x: number; y: number } {
	return {
		x: Math.round(area.x + (area.width - outerW) / 2),
		y: Math.round(area.y + (area.height - outerH) / 2)
	};
}

// Nudge a desired top-left so the whole rect stays inside the work area.
// When the rect is larger than the area it pins to the area's top-left.
export function clampPos(x: number, y: number, outerW: number, outerH: number, area: Rect): { x: number; y: number } {
	return {
		x: Math.min(Math.max(Math.round(x), area.x), area.x + Math.max(0, area.width - outerW)),
		y: Math.min(Math.max(Math.round(y), area.y), area.y + Math.max(0, area.height - outerH))
	};
}

// One Ctrl+"+"/Ctrl+"-" step (and the +/- buttons next to F1).
export function zoomSize(size: Size, grow: boolean): Size {
	const f = grow ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
	return { w: Math.round(size.w * f), h: Math.round(size.h * f) };
}

// Size for the very first window: the remembered size from the previous run
// if there is one (clamped), otherwise the design canvas scaled by the
// screen, capped at 2x and at the work area.
export function initialContentSize(
	area: { width: number; height: number },
	remembered: Size | null
): Size {
	if (remembered) {
		return { w: Math.min(remembered.w, area.width), h: Math.min(remembered.h, area.height) };
	}
	const f = Math.min(2, Math.min(area.width / 1024, area.height / 768));
	return clampToArea(DESIGN_W * f, DESIGN_H * f, area);
}

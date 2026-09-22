// The last window size is remembered between runs (the HTA had a fixed
// size). Validation lives here so a corrupt state file can never shrink or
// break the next start.
export interface WindowState {
	w: number;
	h: number;
}

export function parseWindowState(raw: string): WindowState | null {
	try {
		const st = JSON.parse(raw);
		if (st && typeof st.w === "number" && typeof st.h === "number" && st.w > 0 && st.h > 0) {
			return { w: st.w, h: st.h };
		}
	} catch (err) {
		// not JSON — fall through
	}
	return null;
}

export function serializeWindowState(w: number, h: number): string {
	return JSON.stringify({ w: Math.round(w), h: Math.round(h) });
}

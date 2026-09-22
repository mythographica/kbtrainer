// Pure core of pf() from app/bin/alf.js. user.txt is a CRLF-separated list
// of "key:::value" lines. First match wins; writing an unknown key appends
// it; empty lines are dropped on write; the file always ends with CRLF.

export function prefsGet(raw: string, id: string): string | undefined {
	const lines = String(raw).split("\r\n");
	for (const line of lines) {
		const el = line.split(":::");
		if (el[0] === id) { return el[1]; }
	}
	return undefined;
}

export function prefsSet(raw: string, id: string, value: string): string {
	const lines = String(raw).split("\r\n");
	let found = false;
	for (let i = 0; i < lines.length; i++) {
		const el = lines[i].split(":::");
		if (el[0] === id) {
			lines[i] = el[0] + ":::" + value;
			found = true;
			break;
		}
	}
	if (!found) { lines.push(id + ":::" + value); }
	const out: string[] = [];
	for (const line of lines) {
		if (line !== "") { out.push(line); }
	}
	return out.join("\r\n") + "\r\n";
}

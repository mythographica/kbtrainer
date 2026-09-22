// Charset conversion for the kbfs bridge — mirrors the ADO.Stream charset
// names used in app/bin/_lib.htm's charset_id select.
import * as iconv from "iconv-lite";

export function stripBom(s: string): string {
	return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

export function decodeBuf(buf: Buffer, charset?: string): string {
	switch (String(charset || "UTF-8").toLowerCase()) {
		case "unicode":      return stripBom(iconv.decode(buf, "utf16-le"));
		case "unicodefffe":  return stripBom(iconv.decode(buf, "utf16-be"));
		case "windows-1251": return iconv.decode(buf, "win1251");
		case "koi8-r":       return iconv.decode(buf, "koi8-r");
		case "ascii":
		case "latin1":       return iconv.decode(buf, "latin1");
		case "utf-8":
		case "utf8":         return stripBom(iconv.decode(buf, "utf8"));
		default:             return iconv.decode(buf, String(charset));
	}
}

export function encodeStr(str: string, charset?: string): Buffer {
	switch (String(charset || "UTF-8").toLowerCase()) {
		case "utf-8":
		case "utf8":         return iconv.encode(str, "utf8");
		case "unicode":      return iconv.encode(str, "utf16-le");
		case "unicodefffe":  return iconv.encode(str, "utf16-be");
		case "windows-1251": return iconv.encode(str, "win1251");
		case "koi8-r":       return iconv.encode(str, "koi8-r");
		case "ascii":
		case "latin1":       return iconv.encode(str, "latin1");
		default:             return iconv.encode(str, String(charset));
	}
}

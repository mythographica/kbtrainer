import { describe, expect, it } from "vitest";
import { decodeBuf, encodeStr, stripBom } from "../src/lib/charset";

describe("decodeBuf", () => {
	it("decodes utf-8 and strips the BOM", () => {
		const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("abc", "utf8")]);
		expect(decodeBuf(buf, "utf-8")).toBe("abc");
	});

	it("decodes 'unicode' as utf16-le and strips the BOM", () => {
		const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("й", "utf16le")]);
		expect(decodeBuf(buf, "unicode")).toBe("й");
	});

	it("decodes 'unicodeFFFE' as utf16-be and strips the BOM", () => {
		const raw = Buffer.from("й", "utf16le");
		const be = Buffer.from([raw[1], raw[0]]);
		const buf = Buffer.concat([Buffer.from([0xfe, 0xff]), be]);
		expect(decodeBuf(buf, "unicodeFFFE")).toBe("й");
	});

	it("round-trips windows-1251", () => {
		const buf = encodeStr("Привет", "windows-1251");
		expect(decodeBuf(buf, "windows-1251")).toBe("Привет");
	});

	it("round-trips koi8-r", () => {
		const buf = encodeStr("Привет", "koi8-r");
		expect(decodeBuf(buf, "koi8-r")).toBe("Привет");
	});

	it("treats ascii as latin1", () => {
		expect(decodeBuf(Buffer.from([0xe9]), "ascii")).toBe("é");
	});

	it("defaults to utf-8 when no charset is given", () => {
		expect(decodeBuf(Buffer.from("héllo", "utf8"))).toBe("héllo");
	});

	it("matches charset names case-insensitively", () => {
		const buf = Buffer.from("abc", "utf8");
		expect(decodeBuf(buf, "UTF-8")).toBe("abc");
	});
});

describe("encodeStr", () => {
	it("round-trips utf16-le ('unicode')", () => {
		const buf = encodeStr("текст", "unicode");
		expect(decodeBuf(buf, "unicode")).toBe("текст");
	});
});

describe("stripBom", () => {
	it("removes a leading U+FEFF only", () => {
		expect(stripBom("\uFEFFx\uFEFF")).toBe("x\uFEFF");
	});
});

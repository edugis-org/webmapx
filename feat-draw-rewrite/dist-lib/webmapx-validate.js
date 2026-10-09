#!/usr/bin/env node
import { t as e } from "./validator-Cpi3ApwW.js";
import { readFile as t } from "node:fs/promises";
import n from "node:process";
//#region src/cli/validate-config.ts
var r = "webmapx-validate — validate webmapx config files\n\nUsage:\n  webmapx-validate <config.json> [more.json ...] [options]\n\nOptions:\n  --strict     treat warnings as failures (exit 1)\n  --quiet      print only failures, not the per-file summary\n  -h, --help   show this message\n\nExit status:\n  0  every file is valid (and, with --strict, warning-free)\n  1  a file has errors, could not be read, or is not valid JSON\n";
function i(e) {
	let t = {
		files: [],
		strict: !1,
		quiet: !1
	};
	for (let i of e) if (i === "-h" || i === "--help") return null;
	else i === "--strict" ? t.strict = !0 : i === "--quiet" ? t.quiet = !0 : i.startsWith("-") ? (n.stderr.write(`Unknown option: ${i}\n\n${r}`), n.exit(2)) : t.files.push(i);
	return t.files.length > 0 ? t : null;
}
function a(e) {
	let t = e.path ? ` ${e.path}` : "";
	return `  ${e.severity}:${t} ${e.message}`;
}
async function o(r, i) {
	let o;
	try {
		o = await t(r, "utf8");
	} catch (e) {
		return n.stderr.write(`${r}: cannot read — ${e.message}\n`), !1;
	}
	let s;
	try {
		s = JSON.parse(o);
	} catch (e) {
		return n.stderr.write(`${r}: not valid JSON — ${e.message}\n`), !1;
	}
	let c = e(s), l = c.errors.length > 0 || i.strict && c.warnings.length > 0;
	if (!i.quiet || l) {
		let e = `${c.errors.length} error(s), ${c.warnings.length} warning(s)`;
		n.stdout.write(`${r}: ${l ? "FAIL" : "ok"} — ${e}\n`);
		for (let e of [...c.errors, ...c.warnings]) n.stdout.write(`${a(e)}\n`);
	}
	return !l;
}
var s = i(n.argv.slice(2));
s || (n.stdout.write(r), n.exit(n.argv.length > 2 ? 0 : 2));
var c = !0;
for (let e of s.files) await o(e, s) || (c = !1);
n.exit(+!c);
//#endregion

//#region src/utils/spatial-worker-manager.ts
var e = null, t = /* @__PURE__ */ new Map(), n = 0;
function r() {
	let n = new Worker(new URL(
		/* @vite-ignore */
		"" + new URL("assets/spatial.worker-CfG1-GRz.js", import.meta.url).href,
		"" + import.meta.url
	), { type: "module" });
	return n.onmessage = (e) => {
		let n = e.data;
		if (n.status === "ready") return;
		let r = t.get(n.opId);
		if (r) {
			if (n.status === "progress") {
				r.onProgress?.(n.message);
				return;
			}
			t.delete(n.opId), n.status === "ok" ? r.resolve(n.result) : n.status === "inspected" ? r.resolve({
				sessionKey: n.sessionKey,
				layers: n.layers
			}) : n.status === "closed" ? r.resolve(void 0) : r.reject(Error(n.message ?? "Spatial operation failed"));
		}
	}, n.onerror = (n) => {
		let r = Error(n.message || "The spatial worker crashed. Try again with fewer features.");
		for (let e of t.values()) e.reject(r);
		t.clear(), e = null;
	}, n.onmessageerror = () => {
		let e = /* @__PURE__ */ Error("The result could not be transferred from the worker — it may be too large.");
		for (let n of t.values()) n.reject(e);
		t.clear();
	}, n;
}
function i() {
	return e ||= r(), e;
}
function a(e, r) {
	let a = `sop-${++n}`;
	return new Promise((n, o) => {
		t.set(a, {
			resolve: n,
			reject: o,
			onProgress: r
		});
		try {
			i().postMessage({
				opId: a,
				operation: e
			});
		} catch (e) {
			t.delete(a), o(e instanceof Error ? e : Error(String(e)));
		}
	});
}
function o(e, r) {
	let a = `sop-${++n}`;
	return new Promise((n, o) => {
		t.set(a, {
			resolve: n,
			reject: o
		});
		try {
			i().postMessage({
				opId: a,
				operation: {
					op: "inspectFile",
					data: e,
					filename: r
				}
			}, [e]);
		} catch (e) {
			t.delete(a), o(e instanceof Error ? e : Error(String(e)));
		}
	});
}
function s(e, r) {
	let a = `sop-${++n}`;
	return new Promise((n, o) => {
		t.set(a, {
			resolve: n,
			reject: o
		});
		try {
			i().postMessage({
				opId: a,
				operation: {
					op: "convertFileLayer",
					sessionKey: e,
					layerName: r
				}
			});
		} catch (e) {
			t.delete(a), o(e instanceof Error ? e : Error(String(e)));
		}
	});
}
function c(e) {
	let r = `sop-${++n}`;
	t.set(r, {
		resolve: () => {},
		reject: () => {}
	});
	try {
		i().postMessage({
			opId: r,
			operation: {
				op: "closeFile",
				sessionKey: e
			}
		});
	} catch {}
}
function l(e, r) {
	let a = `sop-${++n}`;
	return new Promise((n, o) => {
		t.set(a, {
			resolve: n,
			reject: o
		});
		try {
			i().postMessage({
				opId: a,
				operation: {
					op: "convertToGeoJSON",
					data: e,
					filename: r
				}
			}, [e]);
		} catch (e) {
			t.delete(a), o(e instanceof Error ? e : Error(String(e)));
		}
	});
}
function u() {
	let e = `sop-${++n}`;
	i().postMessage({
		opId: e,
		operation: { op: "ping" }
	});
}
function d() {
	if (!e) return;
	let n = /* @__PURE__ */ Error("Spatial worker terminated");
	for (let e of t.values()) e.reject(n);
	t.clear(), e.terminate(), e = null;
}
var f = class extends Error {
	constructor() {
		super("Calculation cancelled"), this.name = "SpatialOperationCancelled";
	}
};
function p() {
	let n = t.size;
	if (!n) return 0;
	let r = new f();
	for (let e of t.values()) e.reject(r);
	return t.clear(), e?.terminate(), e = null, n;
}
//#endregion
export { s as a, a as c, c as i, d as l, p as n, l as o, u as r, o as s, f as t };

//#region src/utils/dropped-config.ts
var e = "webmapx-dropped-config", t = "config", n = "pending", r = "webmapx-dropped-config-pending";
function i() {
	return new Promise((n, r) => {
		let i = indexedDB.open(e, 1);
		i.onupgradeneeded = () => i.result.createObjectStore(t), i.onsuccess = () => n(i.result), i.onerror = () => r(i.error);
	});
}
async function a(e) {
	let a = await i();
	await new Promise((r, i) => {
		let o = a.transaction(t, "readwrite");
		o.objectStore(t).put(e, n), o.oncomplete = () => r(), o.onerror = () => i(o.error);
	}), a.close(), sessionStorage.setItem(r, "1");
}
//#endregion
export { a as storeDroppedConfig };

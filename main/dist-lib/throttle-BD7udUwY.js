//#region src/utils/throttle.ts
var e = (e, t) => {
	let n = null, r = 0, i = null, a = function(...a) {
		let o = Date.now(), s = o - r;
		if (s >= t) {
			n &&= (clearTimeout(n), null), i = null, r = o, e.apply(this, a);
			return;
		}
		n && clearTimeout(n), i = a, n = setTimeout(() => {
			n = null, i = null, r = Date.now(), e.apply(this, a);
		}, t - s);
	};
	return a.flush = () => {
		if (!n) return;
		clearTimeout(n), n = null;
		let t = i ?? [];
		i = null, r = Date.now(), e(...t);
	}, a;
};
//#endregion
export { e as t };

//#region node_modules/robust-predicates/esm/util.js
var e = 11102230246251565e-32, t = 134217729, n = 3.000000000000001 * e;
function r(e, t, n, r, i) {
	let a, o, s, c, l = t[0], u = r[0], d = 0, f = 0;
	u > l == u > -l ? (a = l, l = t[++d]) : (a = u, u = r[++f]);
	let p = 0;
	if (d < e && f < n) for (u > l == u > -l ? (o = l + a, s = a - (o - l), l = t[++d]) : (o = u + a, s = a - (o - u), u = r[++f]), a = o, s !== 0 && (i[p++] = s); d < e && f < n;) u > l == u > -l ? (o = a + l, c = o - a, s = a - (o - c) + (l - c), l = t[++d]) : (o = a + u, c = o - a, s = a - (o - c) + (u - c), u = r[++f]), a = o, s !== 0 && (i[p++] = s);
	for (; d < e;) o = a + l, c = o - a, s = a - (o - c) + (l - c), l = t[++d], a = o, s !== 0 && (i[p++] = s);
	for (; f < n;) o = a + u, c = o - a, s = a - (o - c) + (u - c), u = r[++f], a = o, s !== 0 && (i[p++] = s);
	return (a !== 0 || p === 0) && (i[p++] = a), p;
}
function i(e, t, n, i, a, o, s, c) {
	return r(r(e, t, n, i, s), s, a, o, c);
}
function a(e, n, r, i) {
	let a, o, s, c, l, u, d, f, p, m, h;
	d = t * r, m = d - (d - r), h = r - m;
	let g = n[0];
	a = g * r, d = t * g, f = d - (d - g), p = g - f, s = p * h - (a - f * m - p * m - f * h);
	let _ = 0;
	s !== 0 && (i[_++] = s);
	for (let v = 1; v < e; v++) g = n[v], c = g * r, d = t * g, f = d - (d - g), p = g - f, l = p * h - (c - f * m - p * m - f * h), o = a + l, u = o - a, s = a - (o - u) + (l - u), s !== 0 && (i[_++] = s), a = c + o, s = o - (a - c), s !== 0 && (i[_++] = s);
	return (a !== 0 || _ === 0) && (i[_++] = a), _;
}
function o(e, t) {
	let n = t[0];
	for (let r = 1; r < e; r++) n += t[r];
	return n;
}
function s(e) {
	return new Float64Array(e);
}
//#endregion
//#region node_modules/robust-predicates/esm/orient2d.js
var c = (3 + 16 * e) * e, l = (2 + 12 * e) * e, u = (9 + 64 * e) * e * e, d = s(4), f = s(8), p = s(12), m = s(16), h = s(4);
function g(e, i, a, s, c, g, _) {
	let v, ee, te, ne, y, b, x, S, C, w, T, re, ie, ae, oe, se, ce, le, ue = e - c, de = a - c, fe = i - g, pe = s - g;
	ae = ue * pe, b = t * ue, x = b - (b - ue), S = ue - x, b = t * pe, C = b - (b - pe), w = pe - C, oe = S * w - (ae - x * C - S * C - x * w), se = fe * de, b = t * fe, x = b - (b - fe), S = fe - x, b = t * de, C = b - (b - de), w = de - C, ce = S * w - (se - x * C - S * C - x * w), T = oe - ce, y = oe - T, d[0] = oe - (T + y) + (y - ce), re = ae + T, y = re - ae, ie = ae - (re - y) + (T - y), T = ie - se, y = ie - T, d[1] = ie - (T + y) + (y - se), le = re + T, y = le - re, d[2] = re - (le - y) + (T - y), d[3] = le;
	let me = o(4, d), E = l * _;
	if (me >= E || -me >= E || (y = e - ue, v = e - (ue + y) + (y - c), y = a - de, te = a - (de + y) + (y - c), y = i - fe, ee = i - (fe + y) + (y - g), y = s - pe, ne = s - (pe + y) + (y - g), v === 0 && ee === 0 && te === 0 && ne === 0) || (E = u * _ + n * Math.abs(me), me += ue * ne + pe * v - (fe * te + de * ee), me >= E || -me >= E)) return me;
	ae = v * pe, b = t * v, x = b - (b - v), S = v - x, b = t * pe, C = b - (b - pe), w = pe - C, oe = S * w - (ae - x * C - S * C - x * w), se = ee * de, b = t * ee, x = b - (b - ee), S = ee - x, b = t * de, C = b - (b - de), w = de - C, ce = S * w - (se - x * C - S * C - x * w), T = oe - ce, y = oe - T, h[0] = oe - (T + y) + (y - ce), re = ae + T, y = re - ae, ie = ae - (re - y) + (T - y), T = ie - se, y = ie - T, h[1] = ie - (T + y) + (y - se), le = re + T, y = le - re, h[2] = re - (le - y) + (T - y), h[3] = le;
	let D = r(4, d, 4, h, f);
	ae = ue * ne, b = t * ue, x = b - (b - ue), S = ue - x, b = t * ne, C = b - (b - ne), w = ne - C, oe = S * w - (ae - x * C - S * C - x * w), se = fe * te, b = t * fe, x = b - (b - fe), S = fe - x, b = t * te, C = b - (b - te), w = te - C, ce = S * w - (se - x * C - S * C - x * w), T = oe - ce, y = oe - T, h[0] = oe - (T + y) + (y - ce), re = ae + T, y = re - ae, ie = ae - (re - y) + (T - y), T = ie - se, y = ie - T, h[1] = ie - (T + y) + (y - se), le = re + T, y = le - re, h[2] = re - (le - y) + (T - y), h[3] = le;
	let O = r(D, f, 4, h, p);
	return ae = v * ne, b = t * v, x = b - (b - v), S = v - x, b = t * ne, C = b - (b - ne), w = ne - C, oe = S * w - (ae - x * C - S * C - x * w), se = ee * te, b = t * ee, x = b - (b - ee), S = ee - x, b = t * te, C = b - (b - te), w = te - C, ce = S * w - (se - x * C - S * C - x * w), T = oe - ce, y = oe - T, h[0] = oe - (T + y) + (y - ce), re = ae + T, y = re - ae, ie = ae - (re - y) + (T - y), T = ie - se, y = ie - T, h[1] = ie - (T + y) + (y - se), le = re + T, y = le - re, h[2] = re - (le - y) + (T - y), h[3] = le, m[r(O, p, 4, h, m) - 1];
}
function _(e, t, n, r, i, a) {
	let o = (t - a) * (n - i), s = (e - i) * (r - a), l = o - s, u = Math.abs(o + s);
	return Math.abs(l) >= c * u ? l : -g(e, t, n, r, i, a, u);
}
(7 + 56 * e) * e, (3 + 28 * e) * e, (26 + 288 * e) * e * e, s(4), s(4), s(4), s(4), s(4), s(4), s(4), s(4), s(4), s(8), s(8), s(8), s(4), s(8), s(8), s(8), s(12), s(192), s(192);
//#endregion
//#region node_modules/robust-predicates/esm/incircle.js
var v = (10 + 96 * e) * e, ee = (4 + 48 * e) * e, te = (44 + 576 * e) * e * e, ne = s(4), y = s(4), b = s(4), x = s(4), S = s(4), C = s(4), w = s(4), T = s(4), re = s(8), ie = s(8), ae = s(8), oe = s(8), se = s(8), ce = s(8), le = s(8), ue = s(8), de = s(8), fe = s(4), pe = s(4), me = s(4), E = s(8), D = s(16), O = s(16), k = s(16), A = s(32), he = s(32), ge = s(48), _e = s(64), ve = s(1152), j = s(1152);
function ye(e, t, n) {
	e = r(e, ve, t, n, j);
	let i = ve;
	return ve = j, j = i, e;
}
function M(e, s, c, l, u, d, f, p, m) {
	let h, g, _, v, j, M, N, be, xe, Se, Ce, we, Te, Ee, De, Oe, ke, Ae, je, Me, Ne, P, F, I, L, R, z, B, V, H, U, W, G, K, q, J = e - f, Y = c - f, X = u - f, Z = s - p, Q = l - p, $ = d - p;
	U = Y * $, F = t * Y, I = F - (F - Y), L = Y - I, F = t * $, R = F - (F - $), z = $ - R, W = L * z - (U - I * R - L * R - I * z), G = X * Q, F = t * X, I = F - (F - X), L = X - I, F = t * Q, R = F - (F - Q), z = Q - R, K = L * z - (G - I * R - L * R - I * z), B = W - K, P = W - B, ne[0] = W - (B + P) + (P - K), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H - G, P = H - B, ne[1] = H - (B + P) + (P - G), q = V + B, P = q - V, ne[2] = V - (q - P) + (B - P), ne[3] = q, U = X * Z, F = t * X, I = F - (F - X), L = X - I, F = t * Z, R = F - (F - Z), z = Z - R, W = L * z - (U - I * R - L * R - I * z), G = J * $, F = t * J, I = F - (F - J), L = J - I, F = t * $, R = F - (F - $), z = $ - R, K = L * z - (G - I * R - L * R - I * z), B = W - K, P = W - B, y[0] = W - (B + P) + (P - K), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H - G, P = H - B, y[1] = H - (B + P) + (P - G), q = V + B, P = q - V, y[2] = V - (q - P) + (B - P), y[3] = q, U = J * Q, F = t * J, I = F - (F - J), L = J - I, F = t * Q, R = F - (F - Q), z = Q - R, W = L * z - (U - I * R - L * R - I * z), G = Y * Z, F = t * Y, I = F - (F - Y), L = Y - I, F = t * Z, R = F - (F - Z), z = Z - R, K = L * z - (G - I * R - L * R - I * z), B = W - K, P = W - B, b[0] = W - (B + P) + (P - K), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H - G, P = H - B, b[1] = H - (B + P) + (P - G), q = V + B, P = q - V, b[2] = V - (q - P) + (B - P), b[3] = q, h = r(r(r(a(a(4, ne, J, E), E, J, D), D, a(a(4, ne, Z, E), E, Z, O), O, A), A, r(a(a(4, y, Y, E), E, Y, D), D, a(a(4, y, Q, E), E, Q, O), O, he), he, _e), _e, r(a(a(4, b, X, E), E, X, D), D, a(a(4, b, $, E), E, $, O), O, A), A, ve);
	let Pe = o(h, ve), Fe = ee * m;
	if (Pe >= Fe || -Pe >= Fe || (P = e - J, g = e - (J + P) + (P - f), P = s - Z, j = s - (Z + P) + (P - p), P = c - Y, _ = c - (Y + P) + (P - f), P = l - Q, M = l - (Q + P) + (P - p), P = u - X, v = u - (X + P) + (P - f), P = d - $, N = d - ($ + P) + (P - p), g === 0 && _ === 0 && v === 0 && j === 0 && M === 0 && N === 0) || (Fe = te * m + n * Math.abs(Pe), Pe += (J * J + Z * Z) * (Y * N + $ * _ - (Q * v + X * M)) + 2 * (J * g + Z * j) * (Y * $ - Q * X) + ((Y * Y + Q * Q) * (X * j + Z * v - ($ * g + J * N)) + 2 * (Y * _ + Q * M) * (X * Z - $ * J)) + ((X * X + $ * $) * (J * M + Q * g - (Z * _ + Y * j)) + 2 * (X * v + $ * N) * (J * Q - Z * Y)), Pe >= Fe || -Pe >= Fe)) return Pe;
	if ((_ !== 0 || M !== 0 || v !== 0 || N !== 0) && (U = J * J, F = t * J, I = F - (F - J), L = J - I, W = L * L - (U - I * I - (I + I) * L), G = Z * Z, F = t * Z, I = F - (F - Z), L = Z - I, K = L * L - (G - I * I - (I + I) * L), B = W + K, P = B - W, x[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, x[1] = H - (B - P) + (G - P), q = V + B, P = q - V, x[2] = V - (q - P) + (B - P), x[3] = q), (v !== 0 || N !== 0 || g !== 0 || j !== 0) && (U = Y * Y, F = t * Y, I = F - (F - Y), L = Y - I, W = L * L - (U - I * I - (I + I) * L), G = Q * Q, F = t * Q, I = F - (F - Q), L = Q - I, K = L * L - (G - I * I - (I + I) * L), B = W + K, P = B - W, S[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, S[1] = H - (B - P) + (G - P), q = V + B, P = q - V, S[2] = V - (q - P) + (B - P), S[3] = q), (g !== 0 || j !== 0 || _ !== 0 || M !== 0) && (U = X * X, F = t * X, I = F - (F - X), L = X - I, W = L * L - (U - I * I - (I + I) * L), G = $ * $, F = t * $, I = F - (F - $), L = $ - I, K = L * L - (G - I * I - (I + I) * L), B = W + K, P = B - W, C[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, C[1] = H - (B - P) + (G - P), q = V + B, P = q - V, C[2] = V - (q - P) + (B - P), C[3] = q), g !== 0 && (be = a(4, ne, g, re), h = ye(h, i(a(be, re, 2 * J, D), D, a(a(4, C, g, E), E, Q, O), O, a(a(4, S, g, E), E, -$, k), k, A, ge), ge)), j !== 0 && (xe = a(4, ne, j, ie), h = ye(h, i(a(xe, ie, 2 * Z, D), D, a(a(4, S, j, E), E, X, O), O, a(a(4, C, j, E), E, -Y, k), k, A, ge), ge)), _ !== 0 && (Se = a(4, y, _, ae), h = ye(h, i(a(Se, ae, 2 * Y, D), D, a(a(4, x, _, E), E, $, O), O, a(a(4, C, _, E), E, -Z, k), k, A, ge), ge)), M !== 0 && (Ce = a(4, y, M, oe), h = ye(h, i(a(Ce, oe, 2 * Q, D), D, a(a(4, C, M, E), E, J, O), O, a(a(4, x, M, E), E, -X, k), k, A, ge), ge)), v !== 0 && (we = a(4, b, v, se), h = ye(h, i(a(we, se, 2 * X, D), D, a(a(4, S, v, E), E, Z, O), O, a(a(4, x, v, E), E, -Q, k), k, A, ge), ge)), N !== 0 && (Te = a(4, b, N, ce), h = ye(h, i(a(Te, ce, 2 * $, D), D, a(a(4, x, N, E), E, Y, O), O, a(a(4, S, N, E), E, -J, k), k, A, ge), ge)), g !== 0 || j !== 0) {
		if (_ !== 0 || M !== 0 || v !== 0 || N !== 0 ? (U = _ * $, F = t * _, I = F - (F - _), L = _ - I, F = t * $, R = F - (F - $), z = $ - R, W = L * z - (U - I * R - L * R - I * z), G = Y * N, F = t * Y, I = F - (F - Y), L = Y - I, F = t * N, R = F - (F - N), z = N - R, K = L * z - (G - I * R - L * R - I * z), B = W + K, P = B - W, w[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, w[1] = H - (B - P) + (G - P), q = V + B, P = q - V, w[2] = V - (q - P) + (B - P), w[3] = q, U = v * -Q, F = t * v, I = F - (F - v), L = v - I, F = t * -Q, R = F - (F - -Q), z = -Q - R, W = L * z - (U - I * R - L * R - I * z), G = X * -M, F = t * X, I = F - (F - X), L = X - I, F = t * -M, R = F - (F - -M), z = -M - R, K = L * z - (G - I * R - L * R - I * z), B = W + K, P = B - W, T[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, T[1] = H - (B - P) + (G - P), q = V + B, P = q - V, T[2] = V - (q - P) + (B - P), T[3] = q, De = r(4, w, 4, T, ue), U = _ * N, F = t * _, I = F - (F - _), L = _ - I, F = t * N, R = F - (F - N), z = N - R, W = L * z - (U - I * R - L * R - I * z), G = v * M, F = t * v, I = F - (F - v), L = v - I, F = t * M, R = F - (F - M), z = M - R, K = L * z - (G - I * R - L * R - I * z), B = W - K, P = W - B, pe[0] = W - (B + P) + (P - K), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H - G, P = H - B, pe[1] = H - (B + P) + (P - G), q = V + B, P = q - V, pe[2] = V - (q - P) + (B - P), pe[3] = q, Ae = 4) : (ue[0] = 0, De = 1, pe[0] = 0, Ae = 1), g !== 0) {
			let e = a(De, ue, g, k);
			h = ye(h, r(a(be, re, g, D), D, a(e, k, 2 * J, A), A, ge), ge);
			let t = a(Ae, pe, g, E);
			h = ye(h, i(a(t, E, 2 * J, D), D, a(t, E, g, O), O, a(e, k, g, A), A, he, _e), _e), M !== 0 && (h = ye(h, a(a(4, C, g, E), E, M, D), D)), N !== 0 && (h = ye(h, a(a(4, S, -g, E), E, N, D), D));
		}
		if (j !== 0) {
			let e = a(De, ue, j, k);
			h = ye(h, r(a(xe, ie, j, D), D, a(e, k, 2 * Z, A), A, ge), ge);
			let t = a(Ae, pe, j, E);
			h = ye(h, i(a(t, E, 2 * Z, D), D, a(t, E, j, O), O, a(e, k, j, A), A, he, _e), _e);
		}
	}
	if (_ !== 0 || M !== 0) {
		if (v !== 0 || N !== 0 || g !== 0 || j !== 0 ? (U = v * Z, F = t * v, I = F - (F - v), L = v - I, F = t * Z, R = F - (F - Z), z = Z - R, W = L * z - (U - I * R - L * R - I * z), G = X * j, F = t * X, I = F - (F - X), L = X - I, F = t * j, R = F - (F - j), z = j - R, K = L * z - (G - I * R - L * R - I * z), B = W + K, P = B - W, w[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, w[1] = H - (B - P) + (G - P), q = V + B, P = q - V, w[2] = V - (q - P) + (B - P), w[3] = q, Me = -$, Ne = -N, U = g * Me, F = t * g, I = F - (F - g), L = g - I, F = t * Me, R = F - (F - Me), z = Me - R, W = L * z - (U - I * R - L * R - I * z), G = J * Ne, F = t * J, I = F - (F - J), L = J - I, F = t * Ne, R = F - (F - Ne), z = Ne - R, K = L * z - (G - I * R - L * R - I * z), B = W + K, P = B - W, T[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, T[1] = H - (B - P) + (G - P), q = V + B, P = q - V, T[2] = V - (q - P) + (B - P), T[3] = q, Oe = r(4, w, 4, T, de), U = v * j, F = t * v, I = F - (F - v), L = v - I, F = t * j, R = F - (F - j), z = j - R, W = L * z - (U - I * R - L * R - I * z), G = g * N, F = t * g, I = F - (F - g), L = g - I, F = t * N, R = F - (F - N), z = N - R, K = L * z - (G - I * R - L * R - I * z), B = W - K, P = W - B, me[0] = W - (B + P) + (P - K), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H - G, P = H - B, me[1] = H - (B + P) + (P - G), q = V + B, P = q - V, me[2] = V - (q - P) + (B - P), me[3] = q, je = 4) : (de[0] = 0, Oe = 1, me[0] = 0, je = 1), _ !== 0) {
			let e = a(Oe, de, _, k);
			h = ye(h, r(a(Se, ae, _, D), D, a(e, k, 2 * Y, A), A, ge), ge);
			let t = a(je, me, _, E);
			h = ye(h, i(a(t, E, 2 * Y, D), D, a(t, E, _, O), O, a(e, k, _, A), A, he, _e), _e), N !== 0 && (h = ye(h, a(a(4, x, _, E), E, N, D), D)), j !== 0 && (h = ye(h, a(a(4, C, -_, E), E, j, D), D));
		}
		if (M !== 0) {
			let e = a(Oe, de, M, k);
			h = ye(h, r(a(Ce, oe, M, D), D, a(e, k, 2 * Q, A), A, ge), ge);
			let t = a(je, me, M, E);
			h = ye(h, i(a(t, E, 2 * Q, D), D, a(t, E, M, O), O, a(e, k, M, A), A, he, _e), _e);
		}
	}
	if (v !== 0 || N !== 0) {
		if (g !== 0 || j !== 0 || _ !== 0 || M !== 0 ? (U = g * Q, F = t * g, I = F - (F - g), L = g - I, F = t * Q, R = F - (F - Q), z = Q - R, W = L * z - (U - I * R - L * R - I * z), G = J * M, F = t * J, I = F - (F - J), L = J - I, F = t * M, R = F - (F - M), z = M - R, K = L * z - (G - I * R - L * R - I * z), B = W + K, P = B - W, w[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, w[1] = H - (B - P) + (G - P), q = V + B, P = q - V, w[2] = V - (q - P) + (B - P), w[3] = q, Me = -Z, Ne = -j, U = _ * Me, F = t * _, I = F - (F - _), L = _ - I, F = t * Me, R = F - (F - Me), z = Me - R, W = L * z - (U - I * R - L * R - I * z), G = Y * Ne, F = t * Y, I = F - (F - Y), L = Y - I, F = t * Ne, R = F - (F - Ne), z = Ne - R, K = L * z - (G - I * R - L * R - I * z), B = W + K, P = B - W, T[0] = W - (B - P) + (K - P), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H + G, P = B - H, T[1] = H - (B - P) + (G - P), q = V + B, P = q - V, T[2] = V - (q - P) + (B - P), T[3] = q, Ee = r(4, w, 4, T, le), U = g * M, F = t * g, I = F - (F - g), L = g - I, F = t * M, R = F - (F - M), z = M - R, W = L * z - (U - I * R - L * R - I * z), G = _ * j, F = t * _, I = F - (F - _), L = _ - I, F = t * j, R = F - (F - j), z = j - R, K = L * z - (G - I * R - L * R - I * z), B = W - K, P = W - B, fe[0] = W - (B + P) + (P - K), V = U + B, P = V - U, H = U - (V - P) + (B - P), B = H - G, P = H - B, fe[1] = H - (B + P) + (P - G), q = V + B, P = q - V, fe[2] = V - (q - P) + (B - P), fe[3] = q, ke = 4) : (le[0] = 0, Ee = 1, fe[0] = 0, ke = 1), v !== 0) {
			let e = a(Ee, le, v, k);
			h = ye(h, r(a(we, se, v, D), D, a(e, k, 2 * X, A), A, ge), ge);
			let t = a(ke, fe, v, E);
			h = ye(h, i(a(t, E, 2 * X, D), D, a(t, E, v, O), O, a(e, k, v, A), A, he, _e), _e), j !== 0 && (h = ye(h, a(a(4, S, v, E), E, j, D), D)), M !== 0 && (h = ye(h, a(a(4, x, -v, E), E, M, D), D));
		}
		if (N !== 0) {
			let e = a(Ee, le, N, k);
			h = ye(h, r(a(Te, ce, N, D), D, a(e, k, 2 * $, A), A, ge), ge);
			let t = a(ke, fe, N, E);
			h = ye(h, i(a(t, E, 2 * $, D), D, a(t, E, N, O), O, a(e, k, N, A), A, he, _e), _e);
		}
	}
	return ve[h - 1];
}
function N(e, t, n, r, i, a, o, s) {
	let c = e - o, l = n - o, u = i - o, d = t - s, f = r - s, p = a - s, m = l * p, h = u * f, g = c * c + d * d, _ = u * d, ee = c * p, te = l * l + f * f, ne = c * f, y = l * d, b = u * u + p * p, x = g * (m - h) + te * (_ - ee) + b * (ne - y), S = (Math.abs(m) + Math.abs(h)) * g + (Math.abs(_) + Math.abs(ee)) * te + (Math.abs(ne) + Math.abs(y)) * b, C = v * S;
	return x > C || -x > C ? x : M(e, t, n, r, i, a, o, s, S);
}
(16 + 224 * e) * e, (5 + 72 * e) * e, (71 + 1408 * e) * e * e, s(4), s(4), s(4), s(4), s(4), s(4), s(4), s(4), s(4), s(4), s(24), s(24), s(24), s(24), s(24), s(24), s(24), s(24), s(24), s(24), s(1152), s(1152), s(1152), s(1152), s(1152), s(2304), s(2304), s(3456), s(5760), s(8), s(8), s(8), s(16), s(24), s(48), s(48), s(96), s(192), s(384), s(384), s(384), s(768), s(96), s(96), s(96), s(1152);
//#endregion
//#region node_modules/delaunator/index.js
var be = 2 ** -52, xe = new Uint32Array(512), Se = class e {
	static from(t, n = Ae, r = je) {
		let i = t.length, a = new Float64Array(i * 2);
		for (let e = 0; e < i; e++) {
			let i = t[e];
			a[2 * e] = n(i), a[2 * e + 1] = r(i);
		}
		return new e(a);
	}
	constructor(e) {
		let t = e.length >> 1;
		if (t > 0 && typeof e[0] != "number") throw Error("Expected coords to contain numbers.");
		this.coords = e;
		let n = Math.max(2 * t - 5, 0);
		this._triangles = new Uint32Array(n * 3), this._halfedges = new Int32Array(n * 3), this._hashSize = Math.ceil(Math.sqrt(t)), this._hullPrev = new Uint32Array(t), this._hullNext = new Uint32Array(t), this._hullTri = new Uint32Array(t), this._hullHash = new Int32Array(this._hashSize), this._ids = new Uint32Array(t), this._dists = new Float64Array(t), this.update();
	}
	update() {
		let { coords: e, _hullPrev: t, _hullNext: n, _hullTri: r, _hullHash: i } = this, a = e.length >> 1, o = Infinity, s = Infinity, c = -Infinity, l = -Infinity;
		for (let t = 0; t < a; t++) {
			let n = e[2 * t], r = e[2 * t + 1];
			n < o && (o = n), r < s && (s = r), n > c && (c = n), r > l && (l = r), this._ids[t] = t;
		}
		let u = (o + c) / 2, d = (s + l) / 2, f, p, m;
		for (let t = 0, n = Infinity; t < a; t++) {
			let r = we(u, d, e[2 * t], e[2 * t + 1]);
			r < n && (f = t, n = r);
		}
		let h = e[2 * f], g = e[2 * f + 1];
		for (let t = 0, n = Infinity; t < a; t++) {
			if (t === f) continue;
			let r = we(h, g, e[2 * t], e[2 * t + 1]);
			r < n && r > 0 && (p = t, n = r);
		}
		let v = e[2 * p], ee = e[2 * p + 1], te = Infinity;
		for (let t = 0; t < a; t++) {
			if (t === f || t === p) continue;
			let n = Ee(h, g, v, ee, e[2 * t], e[2 * t + 1]);
			n < te && (m = t, te = n);
		}
		let ne = e[2 * m], y = e[2 * m + 1];
		if (te === Infinity) {
			for (let t = 0; t < a; t++) this._dists[t] = e[2 * t] - e[0] || e[2 * t + 1] - e[1];
			Oe(this._ids, this._dists, 0, a - 1);
			let t = new Uint32Array(a), n = 0;
			for (let e = 0, r = -Infinity; e < a; e++) {
				let i = this._ids[e], a = this._dists[i];
				a > r && (t[n++] = i, r = a);
			}
			this.hull = t.subarray(0, n), this.triangles = new Uint32Array(), this.halfedges = new Uint32Array();
			return;
		}
		if (_(h, g, v, ee, ne, y) < 0) {
			let e = p, t = v, n = ee;
			p = m, v = ne, ee = y, m = e, ne = t, y = n;
		}
		let b = De(h, g, v, ee, ne, y);
		this._cx = b.x, this._cy = b.y;
		for (let t = 0; t < a; t++) this._dists[t] = we(e[2 * t], e[2 * t + 1], b.x, b.y);
		Oe(this._ids, this._dists, 0, a - 1), this._hullStart = f;
		let x = 3;
		n[f] = t[m] = p, n[p] = t[f] = m, n[m] = t[p] = f, r[f] = 0, r[p] = 1, r[m] = 2, i.fill(-1), i[this._hashKey(h, g)] = f, i[this._hashKey(v, ee)] = p, i[this._hashKey(ne, y)] = m, this.trianglesLen = 0, this._addTriangle(f, p, m, -1, -1, -1);
		for (let a = 0, o, s; a < this._ids.length; a++) {
			let c = this._ids[a], l = e[2 * c], u = e[2 * c + 1];
			if (a > 0 && Math.abs(l - o) <= be && Math.abs(u - s) <= be || (o = l, s = u, c === f || c === p || c === m)) continue;
			let d = 0;
			for (let e = 0, t = this._hashKey(l, u); e < this._hashSize && (d = i[(t + e) % this._hashSize], !(d !== -1 && d !== n[d])); e++);
			d = t[d];
			let h = d, g;
			for (; g = n[h], _(l, u, e[2 * h], e[2 * h + 1], e[2 * g], e[2 * g + 1]) >= 0;) if (h = g, h === d) {
				h = -1;
				break;
			}
			if (h === -1) continue;
			let v = this._addTriangle(h, c, n[h], -1, -1, r[h]);
			r[c] = this._legalize(v + 2), r[h] = v, x++;
			let ee = n[h];
			for (; g = n[ee], _(l, u, e[2 * ee], e[2 * ee + 1], e[2 * g], e[2 * g + 1]) < 0;) v = this._addTriangle(ee, c, g, r[c], -1, r[ee]), r[c] = this._legalize(v + 2), n[ee] = ee, x--, ee = g;
			if (h === d) for (; g = t[h], _(l, u, e[2 * g], e[2 * g + 1], e[2 * h], e[2 * h + 1]) < 0;) v = this._addTriangle(g, c, h, -1, r[h], r[g]), this._legalize(v + 2), r[g] = v, n[h] = h, x--, h = g;
			this._hullStart = t[c] = h, n[h] = t[ee] = c, n[c] = ee, i[this._hashKey(l, u)] = c, i[this._hashKey(e[2 * h], e[2 * h + 1])] = h;
		}
		this.hull = new Uint32Array(x);
		for (let e = 0, t = this._hullStart; e < x; e++) this.hull[e] = t, t = n[t];
		this.triangles = this._triangles.subarray(0, this.trianglesLen), this.halfedges = this._halfedges.subarray(0, this.trianglesLen);
	}
	_hashKey(e, t) {
		return Math.floor(Ce(e - this._cx, t - this._cy) * this._hashSize) % this._hashSize;
	}
	_legalize(e) {
		let { _triangles: t, _halfedges: n, coords: r } = this, i = 0, a = 0;
		for (;;) {
			let o = n[e], s = e - e % 3;
			if (a = s + (e + 2) % 3, o === -1) {
				if (i === 0) break;
				e = xe[--i];
				continue;
			}
			let c = o - o % 3, l = s + (e + 1) % 3, u = c + (o + 2) % 3, d = t[a], f = t[e], p = t[l], m = t[u];
			if (Te(r[2 * d], r[2 * d + 1], r[2 * f], r[2 * f + 1], r[2 * p], r[2 * p + 1], r[2 * m], r[2 * m + 1])) {
				t[e] = m, t[o] = d;
				let r = n[u];
				if (r === -1) {
					let t = this._hullStart;
					do {
						if (this._hullTri[t] === u) {
							this._hullTri[t] = e;
							break;
						}
						t = this._hullPrev[t];
					} while (t !== this._hullStart);
				}
				this._link(e, r), this._link(o, n[a]), this._link(a, u);
				let s = c + (o + 1) % 3;
				i < xe.length && (xe[i++] = s);
			} else {
				if (i === 0) break;
				e = xe[--i];
			}
		}
		return a;
	}
	_link(e, t) {
		this._halfedges[e] = t, t !== -1 && (this._halfedges[t] = e);
	}
	_addTriangle(e, t, n, r, i, a) {
		let o = this.trianglesLen;
		return this._triangles[o] = e, this._triangles[o + 1] = t, this._triangles[o + 2] = n, this._link(o, r), this._link(o + 1, i), this._link(o + 2, a), this.trianglesLen += 3, o;
	}
};
function Ce(e, t) {
	let n = e / (Math.abs(e) + Math.abs(t));
	return (t > 0 ? 3 - n : 1 + n) / 4;
}
function we(e, t, n, r) {
	let i = e - n, a = t - r;
	return i * i + a * a;
}
function Te(e, t, n, r, i, a, o, s) {
	let c = e - o, l = t - s, u = n - o, d = r - s, f = i - o, p = a - s, m = c * c + l * l, h = u * u + d * d, g = f * f + p * p;
	return c * (d * g - h * p) - l * (u * g - h * f) + m * (u * p - d * f) < 0;
}
function Ee(e, t, n, r, i, a) {
	let o = n - e, s = r - t, c = i - e, l = a - t, u = o * o + s * s, d = c * c + l * l, f = .5 / (o * l - s * c), p = (l * u - s * d) * f, m = (o * d - c * u) * f;
	return p * p + m * m;
}
function De(e, t, n, r, i, a) {
	let o = n - e, s = r - t, c = i - e, l = a - t, u = o * o + s * s, d = c * c + l * l, f = .5 / (o * l - s * c);
	return {
		x: e + (l * u - s * d) * f,
		y: t + (o * d - c * u) * f
	};
}
function Oe(e, t, n, r) {
	if (r - n <= 20) for (let i = n + 1; i <= r; i++) {
		let r = e[i], a = t[r], o = i - 1;
		for (; o >= n && t[e[o]] > a;) e[o + 1] = e[o--];
		e[o + 1] = r;
	}
	else {
		let i = n + r >> 1, a = n + 1, o = r;
		ke(e, i, a), t[e[n]] > t[e[r]] && ke(e, n, r), t[e[a]] > t[e[r]] && ke(e, a, r), t[e[n]] > t[e[a]] && ke(e, n, a);
		let s = e[a], c = t[s];
		for (;;) {
			do
				a++;
			while (t[e[a]] < c);
			do
				o--;
			while (t[e[o]] > c);
			if (o < a) break;
			ke(e, a, o);
		}
		e[n + 1] = e[o], e[o] = s, r - a + 1 >= o - n ? (Oe(e, t, a, r), Oe(e, t, n, o - 1)) : (Oe(e, t, n, o - 1), Oe(e, t, a, r));
	}
}
function ke(e, t, n) {
	let r = e[t];
	e[t] = e[n], e[n] = r;
}
function Ae(e) {
	return e[0];
}
function je(e) {
	return e[1];
}
//#endregion
export { N as n, _ as r, Se as t };

/* Định tâm và Phân cung điểm hướng - module nhúng (TIEN.TQN)
   Dùng: <div id="tab-dinhtam"></div> ... DinhTamApp.mount(document.getElementById('tab-dinhtam')); */
/* ===== DinhTamCore: hình học thửa đất, hướng, phân cung (không phụ thuộc DOM) ===== */
var DinhTamCore = (function () {
'use strict';
var D2R = Math.PI / 180, R2D = 180 / Math.PI, ARC = D2R / 3600;
var WA = 6378137.0, WF = 1 / 298.257223563, E2 = WF * (2 - WF), EP2 = E2 / (1 - E2);
// Tham số chuyển datum VN-2000 <-> WGS-84 (Bursa-Wolf), đã đối chiếu với toạ độ mẫu (sai lệch < 5 cm)
var HELM = { dx: -191.90441429, dy: -39.30318279, dz: -111.45032835,
  rx: -0.00928836 * ARC, ry: 0.01975479 * ARC, rz: -0.00427372 * ARC, s: 0.252906278e-6 };

var PROVINCES = [
 ['Lai Châu',103],['Điện Biên',103],['Sơn La',104],['Lào Cai',104.75],['Yên Bái',104.75],['Hà Giang',105.5],['Tuyên Quang',106],
 ['Phú Thọ',104.75],['Vĩnh Phúc',105],['Hà Nội',105],['Bắc Ninh',105.5],['Bắc Giang',107],['Bắc Kạn',106.5],['Thái Nguyên',106.5],
 ['Cao Bằng',105.75],['Lạng Sơn',107.25],['Quảng Ninh',107.75],['Hải Phòng',105.75],['Hải Dương',105.5],['Hưng Yên',105.5],
 ['Thái Bình',105.5],['Hà Nam',105],['Nam Định',105.5],['Ninh Bình',105],['Hòa Bình',106],['Thanh Hóa',105],['Nghệ An',104.75],
 ['Hà Tĩnh',105.5],['Quảng Bình',106],['Quảng Trị',106.25],['Thừa Thiên Huế',107],['Đà Nẵng',107.75],['Quảng Nam',107.75],
 ['Quảng Ngãi',108],['Bình Định',108.25],['Phú Yên',108.5],['Khánh Hòa',108.25],['Ninh Thuận',108.25],['Bình Thuận',108.5],
 ['Kon Tum',107.5],['Gia Lai',108.5],['Đắk Lắk',108.5],['Đắk Nông',107.5],['Lâm Đồng',107.75],['Bình Phước',106.25],
 ['Bình Dương',105.75],['Đồng Nai',107.75],['Tây Ninh',105.5],['Bà Rịa - Vũng Tàu',107.75],['TP. Hồ Chí Minh',105.75],
 ['Long An',105.75],['Tiền Giang',105.75],['Bến Tre',105.75],['Trà Vinh',105.5],['Vĩnh Long',105.5],['Đồng Tháp',105],
 ['An Giang',104.75],['Kiên Giang',104.5],['Cần Thơ',105],['Hậu Giang',105],['Sóc Trăng',105.5],['Bạc Liêu',105],['Cà Mau',104.5]
];

// ---- tên cung / sơn ----
var CUNG8 = [
 { dir: 'Bắc', que: 'Khảm', son: ['Nhâm', 'Tý', 'Quý'] },
 { dir: 'Đông Bắc', que: 'Cấn', son: ['Sửu', 'Cấn', 'Dần'] },
 { dir: 'Đông', que: 'Chấn', son: ['Giáp', 'Mão', 'Ất'] },
 { dir: 'Đông Nam', que: 'Tốn', son: ['Thìn', 'Tốn', 'Tỵ'] },
 { dir: 'Nam', que: 'Ly', son: ['Bính', 'Ngọ', 'Đinh'] },
 { dir: 'Tây Nam', que: 'Khôn', son: ['Mùi', 'Khôn', 'Thân'] },
 { dir: 'Tây', que: 'Đoài', son: ['Canh', 'Dậu', 'Tân'] },
 { dir: 'Tây Bắc', que: 'Càn', son: ['Tuất', 'Càn', 'Hợi'] }
];
var SON24 = ['Tý','Quý','Sửu','Cấn','Dần','Giáp','Mão','Ất','Thìn','Tốn','Tỵ','Bính','Ngọ','Đinh','Mùi','Khôn','Thân','Canh','Dậu','Tân','Tuất','Càn','Hợi','Nhâm'];
var DIR4 = ['Bắc', 'Đông', 'Nam', 'Tây'];

function n360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
function n180(x) { x = n360(x); return x > 180 ? x - 360 : x; }
function fnum(x, nd) { if (!isFinite(x)) return '–'; var s = x.toFixed(nd); if (s === '-0' || /^-0(\.0+)?$/.test(s)) s = s.slice(1); return s.replace('.', ','); }
function fcm(m, nd) { return fnum(m * 100, nd == null ? 1 : nd) + ' cm'; }

function parseNum(s) {
  if (typeof s === 'number') return s;
  if (s == null) return NaN;
  var t = String(s).replace(/[°\s\u00a0mM²]/g, '').replace(/[^\d.,\-+eE]/g, '');
  if (!t) return NaN;
  var hasD = t.indexOf('.') >= 0, hasC = t.indexOf(',') >= 0;
  if (hasD && hasC) {
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(/,/g, '');
  } else if (hasC) {
    t = t.replace(',', '.');
    if ((t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  } else if (hasD && (t.match(/\./g) || []).length > 1) t = t.replace(/\./g, '');
  var v = Number(t);
  return isFinite(v) ? v : NaN;
}

// ---- trắc địa ----
function geoToEcef(lat, lon) {
  var la = lat * D2R, lo = lon * D2R, N = WA / Math.sqrt(1 - E2 * Math.sin(la) * Math.sin(la));
  return [N * Math.cos(la) * Math.cos(lo), N * Math.cos(la) * Math.sin(lo), N * (1 - E2) * Math.sin(la)];
}
function ecefToGeo(x, y, z) {
  var lo = Math.atan2(y, x), p = Math.hypot(x, y), la = Math.atan2(z, p * (1 - E2)), N, h;
  for (var i = 0; i < 10; i++) {
    N = WA / Math.sqrt(1 - E2 * Math.sin(la) * Math.sin(la)); h = p / Math.cos(la) - N;
    la = Math.atan2(z, p * (1 - E2 * N / (N + h)));
  }
  return { lat: la * R2D, lon: lo * R2D };
}
function wgs2vnGeo(lat, lon) {
  var p = geoToEcef(lat, lon), H = HELM, k = 1 - H.s;
  var X = p[0] - H.rz * p[1] + H.ry * p[2], Y = H.rz * p[0] + p[1] - H.rx * p[2], Z = -H.ry * p[0] + H.rx * p[1] + p[2];
  return ecefToGeo(-H.dx + k * X, -H.dy + k * Y, -H.dz + k * Z);
}
function vn2wgsGeo(lat, lon) {
  var q = geoToEcef(lat, lon), H = HELM, k = 1 - H.s;
  var u0 = (q[0] + H.dx) / k, u1 = (q[1] + H.dy) / k, u2 = (q[2] + H.dz) / k;
  return ecefToGeo(u0 + H.rz * u1 - H.ry * u2, -H.rz * u0 + u1 + H.rx * u2, H.ry * u0 - H.rx * u1 + u2);
}
function merArc(la) {
  var e4 = E2 * E2, e6 = e4 * E2;
  return WA * ((1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * la - (3 * E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * la) +
    (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * la) - (35 * e6 / 3072) * Math.sin(6 * la));
}
function tmFwd(lat, lon, P) {
  var la = lat * D2R, dl = (lon - P.cm) * D2R, s = Math.sin(la), c = Math.cos(la), t = Math.tan(la);
  var N = WA / Math.sqrt(1 - E2 * s * s), T = t * t, C = EP2 * c * c, A = dl * c;
  var E = P.k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * EP2) * Math.pow(A, 5) / 120) + P.fe;
  var Nn = P.k0 * (merArc(la) + N * t * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * EP2) * Math.pow(A, 6) / 720));
  return { E: E, N: Nn };
}
function tmInv(E, N, P) {
  var x = E - P.fe, M = N / P.k0, e4 = E2 * E2, e6 = e4 * E2;
  var mu = M / (WA * (1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
  var e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  var p1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) +
    (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
  var s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1);
  var N1 = WA / Math.sqrt(1 - E2 * s * s), T1 = t * t, C1 = EP2 * c * c, R1 = WA * (1 - E2) / Math.pow(1 - E2 * s * s, 1.5), d = x / (N1 * P.k0);
  var lat = p1 - (N1 * t / R1) * (d * d / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * Math.pow(d, 4) / 24 +
    (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * Math.pow(d, 6) / 720);
  var lon = P.cm * D2R + (d - (1 + 2 * T1 + C1) * Math.pow(d, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * Math.pow(d, 5) / 120) / c;
  return { lat: lat * R2D, lon: lon * R2D };
}
function convergence(lat, lon, cm) { return Math.atan(Math.tan((lon - cm) * D2R) * Math.sin(lat * D2R)) * R2D; }
function rotT(e, n, th) { var t = th * D2R; return [e * Math.cos(t) + n * Math.sin(t), -e * Math.sin(t) + n * Math.cos(t)]; }
function azOf(e, n) { return n360(Math.atan2(e, n) * R2D); }

// ---- phân tích cung / sơn ----
function sectorInfo(azTrue, ref, D) {
  var refAz = ref === 'mag' ? n360(azTrue - D) : n360(azTrue);
  var ci = Math.floor(((refAz + 22.5) % 360) / 45) % 8;
  var si = Math.floor(((refAz + 7.5) % 360) / 15) % 24;
  var pos = (refAz + 7.5) % 15;
  var off = ref === 'mag' ? D : 0;
  return { refAz: refAz, cung: ci, son: si, sonName: SON24[si], cungName: CUNG8[ci].dir, que: CUNG8[ci].que,
    toLower: pos, toUpper: 15 - pos, lowerTrue: n360(si * 15 - 7.5 + off), upperTrue: n360(si * 15 + 7.5 + off), centerTrue: n360(si * 15 + off) };
}

// ---- hình học đa giác (khung Bắc thật, gốc tại G; e = Đông, n = Bắc) ----
function rayHit(poly, azTrue) {
  var a = azTrue * D2R, dx = Math.sin(a), dy = Math.cos(a), n = poly.length, best = null;
  for (var i = 0; i < n; i++) {
    var p = poly[i], q = poly[(i + 1) % n], ex = q[0] - p[0], ey = q[1] - p[1];
    var den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) continue;
    var t = (p[0] * ey - p[1] * ex) / den, s = (p[0] * dy - p[1] * dx) / den;
    if (t > 1e-9 && s >= -1e-9 && s <= 1 + 1e-9 && (best === null || t < best.t)) best = { t: t, edge: i, u: Math.min(1, Math.max(0, s)), e: t * dx, n: t * dy };
  }
  return best;
}
function polyArea(p) { var A = 0, n = p.length; for (var i = 0; i < n; i++) { var q = p[(i + 1) % n]; A += p[i][0] * q[1] - q[0] * p[i][1]; } return A / 2; }
function clipHalf(poly, f) {
  var out = [], n = poly.length;
  for (var i = 0; i < n; i++) {
    var a = poly[i], b = poly[(i + 1) % n], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { var t = fa / (fa - fb); out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); }
  }
  return out;
}
function wedgeArea(poly, a1, a2) {
  var u1 = [Math.sin(a1 * D2R), Math.cos(a1 * D2R)], u2 = [Math.sin(a2 * D2R), Math.cos(a2 * D2R)];
  var c = clipHalf(poly, function (p) { return -(u1[0] * p[1] - u1[1] * p[0]); });
  if (c.length < 3) return 0;
  c = clipHalf(c, function (p) { return u2[0] * p[1] - u2[1] * p[0]; });
  return c.length < 3 ? 0 : Math.abs(polyArea(c));
}
function wedgePoly(poly, a1, a2) {
  var u1 = [Math.sin(a1 * D2R), Math.cos(a1 * D2R)], u2 = [Math.sin(a2 * D2R), Math.cos(a2 * D2R)];
  var c = clipHalf(poly, function (p) { return -(u1[0] * p[1] - u1[1] * p[0]); });
  if (c.length < 3) return [];
  c = clipHalf(c, function (p) { return u2[0] * p[1] - u2[1] * p[0]; });
  return c.length < 3 ? [] : c;
}
function inPoly(poly, x, y) {
  var c = false, n = poly.length;
  for (var i = 0, j = n - 1; i < n; j = i++) {
    if (((poly[i][1] > y) !== (poly[j][1] > y)) && (x < (poly[j][0] - poly[i][0]) * (y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])) c = !c;
  }
  return c;
}
function segX(p1, p2, p3, p4) {
  function cr(a, b, c) { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
  var d1 = cr(p3, p4, p1), d2 = cr(p3, p4, p2), d3 = cr(p1, p2, p3), d4 = cr(p1, p2, p4);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

var LET = 'abcdefgh';
function divId(kind, k) { // k: chỉ số điểm phân chia
  if (kind === 8) return LET[k];
  return (k % 3 === 1) ? LET[(k - 1) / 3] : ('s' + (k + 1));
}

function decs(v) { var s = String(v == null ? '' : v).trim().replace(',', '.').replace(/[eE].*$/, ''), i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; }
function computeAll(inp) {
  var warn = [], R = { warn: warn, ok: false };
  var proj = { cm: parseNum(inp.cm), k0: parseNum(inp.k0), fe: 500000 };
  if (!isFinite(proj.cm)) proj.cm = 108.5;
  if (!isFinite(proj.k0)) proj.k0 = 0.9999;
  var mode = inp.mode || 'vn2000';
  var raw = (inp.pts || []).map(function (p, i) { return { label: (p.label && String(p.label).trim()) || String(i + 1), a: parseNum(p.a), b: parseNum(p.b) }; })
    .filter(function (p) { return isFinite(p.a) && isFinite(p.b); });
  if (raw.length < 3) { R.error = 'Cần tối thiểu 3 điểm có toạ độ hợp lệ.'; return R; }
  var P = raw.map(function (p) {
    var o = { label: p.label };
    if (mode === 'vn2000') { o.E = p.b; o.N = p.a; }
    else if (mode === 'wgs84') {
      var g = wgs2vnGeo(p.a, p.b), t = tmFwd(g.lat, g.lon, proj); o.E = t.E; o.N = t.N; o.latW = p.a; o.lonW = p.b;
    } else { o.E = p.a; o.N = p.b; }
    return o;
  });
  if (mode === 'vn2000') { var sa = 0, sb = 0; raw.forEach(function (p) { sa += p.a; sb += p.b; }); if (sa < sb) warn.push('X (Bắc) đang nhỏ hơn Y (Đông): ở Việt Nam X luôn lớn hơn Y, có thể bạn đã nhập đảo cột X và Y (hướng sẽ sai).'); }
  // loại điểm trùng liên tiếp / điểm khép kín
  var Q = [];
  P.forEach(function (p) { var l = Q[Q.length - 1]; if (!l || Math.hypot(p.E - l.E, p.N - l.N) > 1e-6) Q.push(p); });
  if (Q.length > 1 && Math.hypot(Q[0].E - Q[Q.length - 1].E, Q[0].N - Q[Q.length - 1].N) < 1e-6) Q.pop();
  if (Q.length < 3) { R.error = 'Các điểm trùng nhau, không đủ 3 đỉnh khác nhau.'; return R; }
  P = Q; var n = P.length;
  var E0 = P[0].E, N0 = P[0].N;
  var loc = P.map(function (p) { return [p.E - E0, p.N - N0]; });
  var A2 = polyArea(loc), area = Math.abs(A2);
  if (area < 1e-6) { R.error = 'Diện tích bằng 0 (các điểm thẳng hàng).'; return R; }
  var cx = 0, cy = 0;
  for (var i = 0; i < n; i++) { var q = loc[(i + 1) % n], c = loc[i][0] * q[1] - q[0] * loc[i][1]; cx += (loc[i][0] + q[0]) * c; cy += (loc[i][1] + q[1]) * c; }
  cx /= 6 * A2; cy /= 6 * A2;
  var avg = [0, 0]; loc.forEach(function (p) { avg[0] += p[0] / n; avg[1] += p[1] / n; });
  var xs = loc.map(function (p) { return p[0]; }), ys = loc.map(function (p) { return p[1]; });
  var bb = [(Math.min.apply(0, xs) + Math.max.apply(0, xs)) / 2, (Math.min.apply(0, ys) + Math.max.apply(0, ys)) / 2];
  var cm = inp.center || 'area';
  var Gl = cm === 'vertex' ? avg : cm === 'bbox' ? bb : [cx, cy];
  var Gg = { E: E0 + Gl[0], N: N0 + Gl[1] };
  // hội tụ kinh tuyến / góc quay khung
  var theta = 0, gamma = 0, georef = false, Ggeo = null;
  if (mode === 'local') { theta = parseNum(inp.localTheta); if (!isFinite(theta)) theta = 0; }
  else {
    Ggeo = tmInv(Gg.E, Gg.N, proj);
    gamma = convergence(Ggeo.lat, Ggeo.lon, proj.cm); theta = gamma; georef = true;
    if (Ggeo.lat < 7 || Ggeo.lat > 24 || Ggeo.lon < 101 || Ggeo.lon > 112) warn.push('Toạ độ quy đổi nằm ngoài lãnh thổ Việt Nam (vĩ độ ' + fnum(Ggeo.lat, 4) + '°, kinh độ ' + fnum(Ggeo.lon, 4) + '°). Hãy kiểm tra tỉnh/kinh tuyến trục (KTT) và thứ tự X, Y.');
  }
  // khung Bắc thật gốc tại G
  var T = loc.map(function (p) { return rotT(p[0] - Gl[0], p[1] - Gl[1], theta); });
  var orient = polyArea(T) > 0 ? 1 : -1;
  // cạnh
  var edges = [], per = 0, cum = [0];
  for (i = 0; i < n; i++) {
    var p = T[i], q2 = T[(i + 1) % n], de = q2[0] - p[0], dn = q2[1] - p[1], len = Math.hypot(de, dn);
    var nx = orient > 0 ? dn : -dn, ny = orient > 0 ? -de : de;
    var azT = azOf(de, dn);
    edges.push({ i: i, from: P[i].label, to: P[(i + 1) % n].label, len: len, azTrue: azT, azGrid: n360(azT - theta), normTrue: azOf(nx, ny), normGrid: n360(azOf(nx, ny) - theta),
      mid: [(p[0] + q2[0]) / 2, (p[1] + q2[1]) / 2], nrm: [nx / len, ny / len], dE: loc[(i + 1) % n][0] - loc[i][0], dN: loc[(i + 1) % n][1] - loc[i][1] });
    per += len; cum.push(per);
  }
  // góc trong
  var angles = [];
  for (i = 0; i < n; i++) {
    var a0 = T[(i + n - 1) % n], a1 = T[i], a2 = T[(i + 1) % n];
    var ain = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), aout = Math.atan2(a2[1] - a1[1], a2[0] - a1[0]);
    var turn = n180((aout - ain) * R2D); angles.push(orient > 0 ? 180 - turn : 180 + turn);
  }
  // tự cắt
  var selfX = false;
  for (i = 0; i < n && !selfX; i++) for (var j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; if (segX(T[i], T[(i + 1) % n], T[j], T[(j + 1) % n])) { selfX = true; break; } }
  if (selfX) warn.push('Đa giác tự cắt nhau (thứ tự điểm sai?). Kết quả diện tích/tâm có thể không đúng.');
  var gIn = inPoly(T, 0, 0);
  if (!gIn) warn.push('Tâm G nằm ngoài ranh thửa đất (hình lõm). Các tia phân cung có thể không chính xác.');
  // hướng
  var D = parseNum(inp.decl); if (!isFinite(D)) D = 0;
  var fe = Math.max(0, Math.min(n - 1, parseInt(inp.front, 10) || 0)), fed = edges[fe];
  var axisTrue = azOf(fed.mid[0], fed.mid[1]);
  var dm = inp.dirMode || 'normal', huong;
  if (dm === 'axis') huong = axisTrue;
  else if (dm === 'manual' && isFinite(parseNum(inp.manualAz))) huong = n360(parseNum(inp.manualAz));
  else { dm = 'normal'; huong = fed.normTrue; }
  var ref = inp.ref === 'mag' ? 'mag' : 'true';
  var dir = {
    src: inp.dirSrc || '', mode: dm, true: huong, mag: n360(huong - D), grid: n360(huong - theta), decl: D, declSource: inp.declSource || 'manual',
    toaTrue: n360(huong + 180), toaMag: n360(huong + 180 - D), axisTrue: axisTrue, normTrue: fed.normTrue, theta: theta, gamma: gamma, georef: georef
  };
  dir.hInfo = sectorInfo(huong, ref, D); dir.hInfoTrue = sectorInfo(huong, 'true', D); dir.hInfoMag = sectorInfo(huong, 'mag', D);
  dir.tInfo = sectorInfo(dir.toaTrue, ref, D);
  var minDec = 99; (inp.pts || []).forEach(function (p) { if (isFinite(parseNum(p.a)) && isFinite(parseNum(p.b))) minDec = Math.min(minDec, decs(p.a), decs(p.b)); }); if (minDec === 99) minDec = 3;
  var sig = mode === 'wgs84' ? 0.5 * Math.pow(10, -minDec) * 111320 : 0.5 * Math.pow(10, -minDec); if (isFinite(parseNum(inp.sigma)) && parseNum(inp.sigma) > 0) sig = Math.max(sig, parseNum(inp.sigma));
  dir.uncert = Math.atan(2 * Math.SQRT2 * sig / Math.max(fed.len, 1e-9)) * R2D; dir.uncertSigma = sig; dir.minDec = minDec;
  if (dir.uncert > 0.1) warn.push('Độ chính xác của số liệu nhập (' + (mode === 'wgs84' ? 'toạ độ độ' : 'toạ độ mét') + ' chỉ có ' + minDec + ' chữ số thập phân, tương đương ±' + fnum(sig * 100, 1) + ' cm) khiến hướng có thể lệch tối đa khoảng ±' + fnum(dir.uncert, 2) + '°. Nên dùng toạ độ VN-2000 có đủ 3 chữ số thập phân (mm).');
  var thr = parseNum(inp.warnDeg); if (!isFinite(thr)) thr = 3;
  dir.nearBoundary = Math.min(dir.hInfo.toLower, dir.hInfo.toUpper) < thr; dir.warnDeg = thr;
  // điểm chia
  var shift = ref === 'mag' ? D : 0;
  function build(kind) {
    var cnt = kind, step = 360 / cnt, base0 = kind === 8 ? 22.5 : 7.5, pts = [];
    for (var k = 0; k < cnt; k++) {
      var azb = n360(base0 + step * k + shift), h = rayHit(T, azb);
      pts.push({ k: k, id: divId(kind, k), az: azb, refAz: n360(base0 + step * k), hit: h });
    }
    return pts;
  }
  function pointAtS(s) {
    s = ((s % per) + per) % per; for (var e = 0; e < n; e++) if (s <= cum[e + 1] + 1e-12) { var u = (s - cum[e]) / edges[e].len; var a = T[e], b = T[(e + 1) % n]; return [a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])]; }
    return T[0];
  }
  function partition(divs, kind) {
    var nodes = [];
    for (var v = 0; v < n; v++) nodes.push({ s: cum[v], id: P[v].label, kind: 'v' });
    divs.forEach(function (d) {
      if (!d.hit) return; var s = cum[d.hit.edge] + d.hit.u * edges[d.hit.edge].len;
      var dup = nodes.some(function (nd) { return Math.abs(nd.s - s) < 1e-6 || Math.abs(Math.abs(nd.s - s) - per) < 1e-6; });
      d.s = s; d.dist = d.hit.t; d.pos = [d.hit.e, d.hit.n]; d.edge = d.hit.edge; d.onVertex = dup;
      d.fromStart = d.hit.u * edges[d.hit.edge].len; d.fromEnd = (1 - d.hit.u) * edges[d.hit.edge].len;
      if (!dup) nodes.push({ s: s, id: d.id, kind: 'd', k: d.k });
    });
    nodes.sort(function (a, b) { return a.s - b.s || (a.kind === 'v' ? -1 : 1); });
    var segs = [];
    for (var m = 0; m < nodes.length; m++) {
      var a = nodes[m], b = nodes[(m + 1) % nodes.length], l = (m + 1 < nodes.length ? b.s : per) - a.s;
      if (l < 1e-6) continue;
      var mp = pointAtS(a.s + l / 2), az = azOf(mp[0], mp[1]), inf = sectorInfo(az, ref, D);
      var edgeIdx = 0; for (var e = 0; e < n; e++) if (a.s + l / 2 <= cum[e + 1]) { edgeIdx = e; break; }
      segs.push({ from: a.id, to: b.id, len: l, s0: a.s, s1: a.s + l, az: az, cung: inf.cung, son: inf.son, edge: edgeIdx, mid: mp, fromKind: a.kind, toKind: b.kind, k0: a.k, k1: b.k });
    }
    return { nodes: nodes, segs: segs };
  }
  var d8 = build(8), d24 = build(24), p8 = partition(d8, 8), p24 = partition(d24, 24);
  // thống kê từng cung / sơn
  function stats(kind, divs, parts) {
    var cnt = kind, step = 360 / cnt, out = [];
    for (var k = 0; k < cnt; k++) {
      var a1 = n360((kind === 8 ? -22.5 : -7.5) + step * k + shift), a2 = a1 + step;
      var segs = parts.segs.filter(function (s) { return (kind === 8 ? s.cung : s.son) === k; });
      var info = kind === 8 ? CUNG8[k] : null;
      out.push({ k: k, name: kind === 8 ? info.dir : SON24[k], que: kind === 8 ? info.que : null, sonNames: kind === 8 ? info.son : null,
        from: a1, to: n360(a2), center: n360(a1 + step / 2), area: wedgeArea(T, a1, a2), perim: segs.reduce(function (s, x) { return s + x.len; }, 0), segs: segs });
    }
    return out;
  }
  var cung = stats(8, d8, p8), son = stats(24, d24, p24);
  var Rmax = 0; T.forEach(function (p) { Rmax = Math.max(Rmax, Math.hypot(p[0], p[1])); });
  d8.concat(d24).forEach(function (d) { if (d.hit) Rmax = Math.max(Rmax, d.hit.t); });
  // toạ độ ra
  var toWGS = null;
  if (georef) toWGS = function (E, N) { var g = tmInv(E, N, proj), w = vn2wgsGeo(g.lat, g.lon); return { lat: w.lat, lon: w.lon, latVN: g.lat, lonVN: g.lon }; };
  var Mg = { E: E0 + (fed.mid[0] * 0 ), N: 0 };
  // M theo lưới: trung điểm cạnh mặt tiền trong hệ lưới
  var fa = loc[fe], fb = loc[(fe + 1) % n]; Mg = { E: E0 + (fa[0] + fb[0]) / 2, N: N0 + (fa[1] + fb[1]) / 2 };
  var verts = P.map(function (p, i) { var o = { label: p.label, E: p.E, N: p.N, t: T[i], angle: angles[i] }; if (mode === 'wgs84') { o.lat = p.latW; o.lon = p.lonW; } else if (toWGS) { var w = toWGS(p.E, p.N); o.lat = w.lat; o.lon = w.lon; } return o; });
  var Gout = { E: Gg.E, N: Gg.N }, Mout = { E: Mg.E, N: Mg.N };
  if (toWGS) { var gw = toWGS(Gg.E, Gg.N), mw = toWGS(Mg.E, Mg.N); Gout.lat = gw.lat; Gout.lon = gw.lon; Mout.lat = mw.lat; Mout.lon = mw.lon; }
  R = {
    ok: true, isHouse: !!inp.isHouse, warn: warn, mode: mode, proj: proj, name: inp.name || '', n: n, ref: ref, centerMode: cm, theta: theta, gamma: gamma, georef: georef,
    area: area, perimeter: per, G: Gout, M: Mout, Gvertex: [E0 + avg[0], N0 + avg[1]], Gbbox: [E0 + bb[0], N0 + bb[1]], Gdelta: { vertex: Math.hypot(avg[0] - cx, avg[1] - cy), bbox: Math.hypot(bb[0] - cx, bb[1] - cy) },
    verts: verts, T: T, edges: edges, orient: orient, front: fe, dir: dir, cung: cung, son: son, d8: d8, d24: d24, p8: p8, p24: p24,
    cum: cum, Rmax: Rmax, selfX: selfX, gIn: gIn, shift: shift, input: inp
  };
  return R;
}

// ---- quan hệ nhà - khu đất ----
function distSeg(p, a, b) {
  var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0, tc = Math.max(0, Math.min(1, t));
  var fx = a[0] + tc * dx, fy = a[1] + tc * dy; return { d: Math.hypot(p[0] - fx, p[1] - fy), foot: [fx, fy] };
}
function relate(R, H) {
  var g = R.G, th = R.theta, n = R.n, m = H.n;
  function toT(E, N) { return rotT(E - g.E, N - g.N, th); }
  var Ht = H.verts.map(function (v) { return toT(v.E, v.N); }), Gh = toT(H.G.E, H.G.N), Mh = toT(H.M.E, H.M.N), o = { Ht: Ht, Gh: Gh, Mh: Mh };
  o.dist = Math.hypot(Gh[0], Gh[1]); o.az = azOf(Gh[0], Gh[1]); o.gInfo = sectorInfo(o.az, R.ref, R.dir.decl);
  o.inside = Ht.map(function (p) { return inPoly(R.T, p[0], p[1]); }); o.allInside = o.inside.every(Boolean);
  o.cross = false;
  for (var i = 0; i < m && !o.cross; i++) for (var j = 0; j < n; j++) if (segX(Ht[i], Ht[(i + 1) % m], R.T[j], R.T[(j + 1) % n])) { o.cross = true; break; }
  o.areaPct = H.area / R.area * 100; o.dirDiff = n180(H.dir.true - R.dir.true);
  o.cungShare = R.cung.map(function (c) { return wedgeArea(Ht, c.from, c.from + 45); });
  o.sonShare = R.son.map(function (c) { return wedgeArea(Ht, c.from, c.from + 15); });
  o.setbacks = R.edges.map(function (e, j) {
    var a = R.T[j], b = R.T[(j + 1) % n], best = null;
    Ht.forEach(function (p, k) { var r = distSeg(p, a, b); if (!best || r.d < best.d) best = { d: r.d, ph: p, pl: r.foot, hv: H.verts[k].label }; });
    for (var k = 0; k < m; k++) [a, b].forEach(function (q, qi) { var r = distSeg(q, Ht[k], Ht[(k + 1) % m]); if (r.d < best.d - 1e-12) best = { d: r.d, ph: r.foot, pl: q, hv: H.verts[k].label + '–' + H.verts[(k + 1) % m].label }; });
    return { edge: j, from: e.from, to: e.to, d: best.d, ph: best.ph, pl: best.pl, hv: best.hv };
  });
  o.warn = [];
  if (!o.allInside) o.warn.push('Có ' + o.inside.filter(function (x) { return !x; }).length + ' đỉnh của nhà nằm ngoài ranh khu đất. Hãy kiểm tra toạ độ nhà hoặc khoảng lùi.');
  if (o.cross) o.warn.push('Ranh nhà cắt ranh khu đất.');
  return o;
}

// ---- diễn giải hướng dạng chữ ----
function cardinalText(az) {
  var best = 0, bd = 999;
  [0, 90, 180, 270].forEach(function (c, i) { var d = Math.abs(n180(az - c)); if (d < bd) { bd = d; best = i; } });
  var c = [0, 90, 180, 270][best], diff = n180(az - c);
  if (bd < 0.05) return DIR4[best];
  var toward = DIR4[((best + (diff > 0 ? 1 : -1)) % 4 + 4) % 4];
  return DIR4[best] + ', lệch về ' + toward + ' ' + fnum(bd, 1) + '°';
}
function nearestCardinal(az) { var best = 0, bd = 999; [0, 90, 180, 270].forEach(function (c, i) { var d = Math.abs(n180(az - c)); if (d < bd) { bd = d; best = i; } }); return { az: [0, 90, 180, 270][best], name: DIR4[best] }; }

function subj(R) { return R && R.isHouse ? { H: 'Hướng nhà', h: 'hướng nhà', T: 'Toạ nhà', back: 'lưng nhà', s: 'nhà' } : { H: 'Hướng đất', h: 'hướng đất', T: 'Toạ đất', back: 'lưng thửa', s: 'khu đất' }; }
function summaryLines(R) {
  var d = R.dir, h = d.hInfo, L = [], K = subj(R);
  var nm = function (x) { return fnum(x, 1) + '°'; };
  L.push({ t: K.H + ' (Bắc thật): ' + fnum(d.true, 1) + '°', b: 1 });
  L.push({ t: '= ' + cardinalText(d.true) + '.' });
  L.push({ t: 'Cung ' + CUNG8[R.dir.hInfoTrue.cung].dir + ' (' + CUNG8[R.dir.hInfoTrue.cung].que + '), sơn ' + R.dir.hInfoTrue.sonName + ' (' + nm(R.dir.hInfoTrue.lowerTrue) + ' - ' + nm(R.dir.hInfoTrue.upperTrue) + '), cách ranh gần nhất ' + fnum(Math.min(R.dir.hInfoTrue.toLower, R.dir.hInfoTrue.toUpper), 1) + '°.' });
  if (R.georef) L.push({ t: 'Bắc lưới VN-2000: ' + fnum(d.grid, 2) + '° (đã hiệu chỉnh độ hội tụ kinh tuyến ' + fnum(d.gamma, 2) + '° để ra Bắc thật).' });
  else L.push({ t: 'Bản vẽ cục bộ: trục Bắc bản vẽ lệch ' + fnum(d.theta, 2) + '° so với Bắc thật.' });
  L.push({ t: 'Bắc từ (la bàn): ' + fnum(d.mag, 1) + '° (độ lệch từ D = ' + (d.decl >= 0 ? '+' : '') + fnum(d.decl, 2) + '°, ' + (d.declSource === 'estimate' ? 'ước tính, cần chốt theo NOAA/WMM' : 'do người dùng nhập') + ').', b: 1 });
  L.push({ t: 'Độ không đảm bảo theo số liệu nhập (' + d.minDec + ' chữ số thập phân, ±' + fnum(d.uncertSigma * 100, 2) + ' cm mỗi toạ độ): tối đa khoảng ±' + fnum(d.uncert, d.uncert < 0.01 ? 3 : 2) + '° (cạnh mặt tiền dài ' + fnum(R.edges[R.front].len * 100, 1) + ' cm).' });
  L.push({ t: K.T + ' (' + K.back + '): ' + fnum(d.toaTrue, 1) + '° thật / ' + fnum(d.toaMag, 1) + '° từ - sơn ' + d.tInfo.sonName + '.' });
  return L;
}

// ---- phân tích văn bản (dán / OCR) ----
function parseText(text) {
  var pts = [], cur = null, idx = 0, cm = null;
  function start(label) { cur = { label: label || String(++idx), X: null, Y: null, lat: null, lon: null }; pts.push(cur); }
  var lines = String(text || '').split(/\r?\n/);
  lines.forEach(function (ln) {
    var mk = ln.match(/KTT\s*[:=]?\s*(\d{2,3}(?:[.,]\d+)?)/i); if (mk) cm = parseNum(mk[1]);
    var mh = ln.match(/^\W*(?:\[?\s*GeoCAD\s*[-–]\s*)?(?:Điểm|Diem|Point|Pt|Đỉnh|Dinh)\s*[:#]?\s*([A-Za-z0-9]+)\W*$/i);
    if (mh) { start(mh[1]); return; }
    var mx = ln.match(/(?:^|[^A-Za-z])X\s*[=:]\s*(-?\d[\d.,]*)/i), my = ln.match(/(?:^|[^A-Za-z])Y\s*[=:]\s*(-?\d[\d.,]*)/i);
    if (mx || my) {
      if (!cur) start();
      if (mx) { if (cur.X != null && cur.Y != null) start(); cur.X = parseNum(mx[1]); }
      if (my) cur.Y = parseNum(my[1]);
      return;
    }
    var toks = (ln.match(/-?\d[\d.,]*\d|\d/g) || []), nums = toks.map(parseNum).filter(isFinite);
    var vn = nums.filter(function (v) { return v >= 1e5 && v <= 3.4e6; });
    if (vn.length >= 2) {
      var lab = null, first = toks[0]; if (first && /^\d{1,3}$/.test(first) && nums.length >= 3) lab = first;
      var lb = ln.match(/^\s*([A-Za-z]{0,3}\d{1,3}[A-Za-z]?)[\s:;,.\t]/); if (!lab && lb) lab = lb[1];
      start(lab); cur.X = Math.max(vn[0], vn[1]); cur.Y = Math.min(vn[0], vn[1]); return;
    }
    var lat = null, lon = null;
    for (var i = 0; i + 1 < toks.length; i++) {
      var a = parseNum(toks[i]), b = parseNum(toks[i + 1]);
      if (/[.,]/.test(toks[i]) && /[.,]/.test(toks[i + 1]) && a >= 5 && a <= 25 && b >= 100 && b <= 112) { lat = a; lon = b; break; }
    }
    if (lat != null) { if (!cur || cur.lat != null) start(); cur.lat = lat; cur.lon = lon; }
  });
  var okVN = pts.length >= 3 && pts.every(function (p) { return p.X != null && p.Y != null; });
  var okW = pts.length >= 3 && pts.every(function (p) { return p.lat != null && p.lon != null; });
  var kind = okVN ? 'vn2000' : okW ? 'wgs84' : null;
  return { kind: kind, pts: pts, cm: cm, count: pts.length };
}

return {
  PROVINCES: PROVINCES, CUNG8: CUNG8, SON24: SON24, DIR4: DIR4, HELM: HELM, LET: LET,
  parseNum: parseNum, fnum: fnum, fcm: fcm, n360: n360, n180: n180, parseText: parseText,
  wgs2vnGeo: wgs2vnGeo, vn2wgsGeo: vn2wgsGeo, tmFwd: tmFwd, tmInv: tmInv, convergence: convergence,
  subj: subj, computeAll: computeAll, sectorInfo: sectorInfo, cardinalText: cardinalText, nearestCardinal: nearestCardinal, summaryLines: summaryLines,
  relate: relate, rotT: rotT, azOf: azOf, rayHit: rayHit, polyArea: polyArea, wedgePoly: wedgePoly
};
})();
if (typeof module !== 'undefined') module.exports = DinhTamCore;

/* ===== DinhTamDraw: dựng 4 trang bản vẽ SVG khổ A4, đơn vị mm, tỷ lệ chính xác ===== */
var DinhTamDraw = (function (C) {
'use strict';
var D2R = Math.PI / 180;
var FONT = "'DejaVu Sans',Verdana,Arial,Helvetica,sans-serif";
var STD = [1, 2, 5, 10, 20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 20000];
var INK = '#14202e', GREY = '#5b6673', LIGHT = '#aeb7c1', BLUE = '#1f5fa8', RED = '#c8452b', BRASS = '#a9791c', TEAL = '#0d6b57';
var fnum = C.fnum;

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function f2(x) { return (Math.round(x * 100) / 100).toString(); }
function tx(x, y, s, o) {
  o = o || {};
  return '<text x="' + f2(x) + '" y="' + f2(y) + '" font-size="' + (o.sz || 2.6) + '" text-anchor="' + (o.a || 'start') + '" fill="' + (o.c || INK) + '" class="dtp-t' + (o.b ? ' dtp-b' : '') + (o.h ? ' dtp-h' : '') + '"' +
    (o.rot ? ' transform="rotate(' + o.rot + ' ' + f2(x) + ' ' + f2(y) + ')"' : '') + '>' + esc(s) + '</text>';
}
function ln(x1, y1, x2, y2, c, w, dash) {
  return '<line x1="' + f2(x1) + '" y1="' + f2(y1) + '" x2="' + f2(x2) + '" y2="' + f2(y2) + '" stroke="' + (c || INK) + '" stroke-width="' + (w || 0.25) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
}
function circ(x, y, r, fill, stroke, w) { return '<circle cx="' + f2(x) + '" cy="' + f2(y) + '" r="' + r + '" fill="' + (fill || 'none') + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (w || 0.25) + '"' : '') + '/>'; }
function arrowSvg(x1, y1, x2, y2, c, w, hl) {
  var a = Math.atan2(y2 - y1, x2 - x1), h = hl || 3.2, s = ln(x1, y1, x2 - Math.cos(a) * h * 0.7, y2 - Math.sin(a) * h * 0.7, c, w);
  var p1 = [x2 - h * Math.cos(a - 0.38), y2 - h * Math.sin(a - 0.38)], p2 = [x2 - h * Math.cos(a + 0.38), y2 - h * Math.sin(a + 0.38)];
  return s + '<polygon points="' + f2(x2) + ',' + f2(y2) + ' ' + f2(p1[0]) + ',' + f2(p1[1]) + ' ' + f2(p2[0]) + ',' + f2(p2[1]) + '" fill="' + c + '"/>';
}
function poly(pts, fill, stroke, w, extra) {
  return '<polygon points="' + pts.map(function (p) { return f2(p[0]) + ',' + f2(p[1]); }).join(' ') + '" fill="' + (fill || 'none') + '" stroke="' + (stroke || 'none') + '" stroke-width="' + (w || 0.25) + '" stroke-linejoin="round"' + (extra || '') + '/>';
}
function strW(s, sz) { return String(s).length * sz * 0.6; }
function wrap(s, sz, maxW) {
  var words = String(s).split(/\s+/), lines = [], cur = '';
  words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (strW(t, sz) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
  if (cur) lines.push(cur); return lines;
}
function lenTxt(m, o) { return o.unit === 'm' ? fnum(m, 3) + ' m' : fnum(m * 100, 1) + ' cm'; }
function nice(l) { var a = [1, 2, 5]; for (var e = -1; e < 6; e++) for (var i = 0; i < 3; i++) { var v = a[i] * Math.pow(10, e); if (v >= l) return v; } return l; }

function pageWrap(inner, title, sub, no, total, R, o) {
  title = title.replace(/^Bản vẽ (\d+)/, function (m, x) { return 'Bản vẽ ' + (+x + (o.bvOff || 0)); }); if (o.isHouse) title = title.replace(/^Phụ lục/, 'Phụ lục nhà');
  no = no + (o.pgOff || 0); total = o.pgTotal || total;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" width="210mm" height="297mm" class="dtp-page">' +
    '<style>.dtp-t{font-family:' + FONT + '}.dtp-b{font-weight:700}.dtp-h{paint-order:stroke;stroke:#fff;stroke-width:.9px;stroke-linejoin:round}</style>' +
    '<rect width="210" height="297" fill="#fff"/>';
  s += tx(12, 14, title, { sz: 4.6, b: 1 }) + tx(12, 19.6, sub, { sz: 2.7, c: GREY }) + ln(12, 22, 198, 22, LIGHT, 0.25);
  s += inner;
  // chân trang + thước kiểm tra 100 mm
  s += ln(55, 288.5, 155, 288.5, INK, 0.3);
  for (var i = 0; i <= 10; i++) s += ln(55 + i * 10, 288.5, 55 + i * 10, i % 5 === 0 ? 286.2 : 287.3, INK, 0.25);
  s += tx(105, 285.2, 'Thước kiểm tra in: 100 mm (in ở 100%, không chọn "Fit to page")', { sz: 2.1, a: 'middle', c: GREY });
  s += tx(12, 293.5, 'Thửa đất: ' + (R.name || '(chưa đặt tên)') + '  |  ' + (R.mode === 'local' ? 'Toạ độ cục bộ' : 'VN-2000 KTT ' + fnum(R.proj.cm, 2) + '°') + '  |  Hướng tính theo Bắc thật', { sz: 2.2, c: GREY });
  s += tx(198, 293.5, 'Trang ' + no + '/' + total, { sz: 2.2, a: 'end', c: GREY });
  return s + '</svg>';
}

function pickScale(extentFn, o, fits) {
  if (o.scaleMode === 'manual' && o.scaleN > 0) return o.scaleN;
  for (var i = 0; i < STD.length; i++) if (fits(STD[i])) return STD[i];
  return STD[STD.length - 1];
}

function bbox(T) {
  var a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
  T.forEach(function (p) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); });
  return { x0: a, x1: b, y0: c, y1: d, w: b - a, h: d - c, cx: (a + b) / 2, cy: (c + d) / 2 };
}
function outNormalAt(R, i) { // pháp tuyến ngoài (svg: y xuống) tại đỉnh i - trung bình 2 cạnh kề
  var n = R.n, e1 = R.edges[(i + n - 1) % n], e2 = R.edges[i];
  var x = e1.nrm[0] + e2.nrm[0], y = -(e1.nrm[1] + e2.nrm[1]), l = Math.hypot(x, y) || 1; return [x / l, y / l];
}
function placeLabel(mx, my, nx, ny, s, sz, o, gap) {
  gap = gap == null ? 2.4 : gap;
  var x = mx + nx * gap, y = my + ny * gap, a = 'middle';
  if (nx > 0.5) a = 'start'; else if (nx < -0.5) a = 'end';
  var yy = y + (Math.abs(ny) > 0.5 ? (ny > 0 ? sz * 0.95 : -sz * 0.15) : sz * 0.35);
  var oo = Object.assign({ sz: sz, a: a, h: 1 }, o || {});
  return tx(x, yy, s, oo);
}
function scaleBar(x, y, k, N) {
  var L = nice(30 / k), len = L * k, s = '';
  s += '<rect x="' + f2(x) + '" y="' + f2(y - 1) + '" width="' + f2(len / 2) + '" height="1" fill="' + INK + '"/>';
  s += '<rect x="' + f2(x + len / 2) + '" y="' + f2(y - 1) + '" width="' + f2(len / 2) + '" height="1" fill="#fff" stroke="' + INK + '" stroke-width=".2"/>';
  s += ln(x, y - 1, x, y + 1.6, INK, .25) + ln(x + len / 2, y - 1, x + len / 2, y + 1, INK, .2) + ln(x + len, y - 1, x + len, y + 1.6, INK, .25);
  s += tx(x, y + 4.4, '0', { sz: 2.2, a: 'middle' }) + tx(x + len / 2, y + 4.4, fnum(L / 2, L < 2 ? 1 : 0), { sz: 2.2, a: 'middle' }) + tx(x + len, y + 4.4, fnum(L, 0) + ' m', { sz: 2.2, a: 'middle' });
  s += tx(x, y - 3, 'Tỷ lệ 1:' + N, { sz: 2.9, b: 1 });
  return s;
}
function northArrow(x, y, label) {
  return arrowSvg(x, y + 12, x, y, INK, 0.45, 3) + tx(x, y - 2, label || 'Bắc thật', { sz: 2.6, b: 1, a: 'middle' });
}

// ---------- TRANG 1 ----------
function page1(R, o) {
  var K = C.subj(R);
  var T = R.T, n = R.n, AW = 118, AH = 168, mxm = 27, mym = 9, fe0 = R.edges[R.front], az0 = R.dir.true;
  function bbN(N) { var ext = 24 * N / 1000; return bbox(T.concat([[fe0.mid[0] + Math.sin(az0 * D2R) * ext, fe0.mid[1] + Math.cos(az0 * D2R) * ext]])); }
  var N = pickScale(null, o, function (N) { var b = bbN(N); return b.w * 1000 / N + 2 * mxm <= AW && b.h * 1000 / N + 2 * mym <= AH; });
  var bb = bbN(N);
  var k = 1000 / N, cx = 12 + AW / 2, cy = 26 + AH / 2;
  var X = function (e) { return cx + (e - bb.cx) * k; }, Y = function (nn) { return cy - (nn - bb.cy) * k; };
  var V = T.map(function (p) { return [X(p[0]), Y(p[1])]; });
  var G = [X(0), Y(0)], Mm = [X(R.edges[R.front].mid[0]), Y(R.edges[R.front].mid[1])];
  var s = '';
  s += poly(V, '#e6f0f7', BLUE, 0.7);
  // cạnh mặt tiền đậm
  var fa = V[R.front], fb = V[(R.front + 1) % n];
  s += ln(fa[0], fa[1], fb[0], fb[1], RED, 1.1);
  // nhãn cạnh
  R.edges.forEach(function (e, i) {
    var p = V[i], q = V[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    if (i === R.front) { var t25 = [p[0] + (q[0] - p[0]) * 0.2, p[1] + (q[1] - p[1]) * 0.2]; s += placeLabel(t25[0], t25[1], -e.nrm[0], e.nrm[1], e.from + '–' + e.to + ': ' + lenTxt(e.len, o), 2.7, { b: 1, c: RED }, 2.2); }
    else s += placeLabel(mx, my, e.nrm[0], -e.nrm[1], e.from + '–' + e.to + ': ' + lenTxt(e.len, o), 2.7, { b: 1, c: INK }, 2.2);
  });
  // đỉnh
  V.forEach(function (p, i) { s += circ(p[0], p[1], 0.9, INK); var nn = outNormalAt(R, i); s += tx(p[0] + nn[0] * 4.4, p[1] + nn[1] * 4.4 + 1.5, R.verts[i].label, { sz: 4, b: 1, a: 'middle', h: 1 }); });
  // G–M
  s += ln(G[0], G[1], Mm[0], Mm[1], BRASS, 0.3, '1.6 1');
  var az = R.dir.true, dv = [Math.sin(az * D2R), -Math.cos(az * D2R)], L = 16;
  var cd = C.nearestCardinal(az), cv = [Math.sin(cd.az * D2R), -Math.cos(cd.az * D2R)];
  s += ln(Mm[0], Mm[1], Mm[0] + cv[0] * L, Mm[1] + cv[1] * L, GREY, 0.25, '1.2 1');
  s += arrowSvg(Mm[0], Mm[1], Mm[0] + dv[0] * L, Mm[1] + dv[1] * L, RED, 0.8, 3.4);
  if (R.dir.mode === 'normal') {
    var ed = [fb[0] - fa[0], fb[1] - fa[1]], el = Math.hypot(ed[0], ed[1]); ed = [ed[0] / el, ed[1] / el];
    if (ed[0] * 0 + (ed[0] * dv[1] - ed[1] * dv[0]) < 0) ed = [-ed[0], -ed[1]];
    var q = 2.6; s += '<polyline points="' + f2(Mm[0] + ed[0] * q) + ',' + f2(Mm[1] + ed[1] * q) + ' ' + f2(Mm[0] + ed[0] * q + dv[0] * q) + ',' + f2(Mm[1] + ed[1] * q + dv[1] * q) + ' ' + f2(Mm[0] + dv[0] * q) + ',' + f2(Mm[1] + dv[1] * q) + '" fill="none" stroke="' + RED + '" stroke-width=".3"/>';
  }
  var pe = [Mm[0] + dv[0] * L, Mm[1] + dv[1] * L], pc = [Mm[0] + cv[0] * L, Mm[1] + cv[1] * L], perp = [-dv[1], dv[0]];
  var sgn = ((pc[0] - pe[0]) * perp[0] + (pc[1] - pe[1]) * perp[1]) >= 0 ? 1 : -1; // phía của đường tham chiếu
  s += placeLabel(pe[0] + dv[0] * 0.5 - sgn * perp[0] * 2.5, pe[1] + dv[1] * 0.5 - sgn * perp[1] * 2.5, dv[0] * 0.3 - sgn * perp[0], dv[1] * 0.3 - sgn * perp[1], K.H + ' ' + fnum(az, 1) + '°', 3, { b: 1, c: RED }, 2.5);
  s += placeLabel(pc[0] + sgn * perp[0] * 1, pc[1] + sgn * perp[1] * 1, sgn * perp[0], sgn * perp[1], cd.name + ' ' + cd.az + '°', 2.4, { c: GREY }, 2);
  s += circ(G[0], G[1], 1.7, BRASS, '#fff', 0.3) + circ(Mm[0], Mm[1], 1.7, RED, '#fff', 0.3);
  s += tx(G[0], G[1] - 3.6, 'G - tâm hình học', { sz: 2.8, b: 1, c: BRASS, h: 1, a: 'middle' });
  s += tx(Mm[0] + 3, Mm[1] + 9.5, 'M - tâm mặt tiền', { sz: 2.8, b: 1, c: RED, h: 1, a: 'start' });
  s += northArrow(20, 34);
  // khung kết quả bên phải
  var bx = 132, by = 26, bw = 66, y = by + 7, lines = C.summaryLines(R), box = '';
  box += tx(bx + 3, y, 'KẾT QUẢ XÁC ĐỊNH HƯỚNG', { sz: 3, b: 1, c: RED }); y += 5.2;
  lines.forEach(function (l) { wrap(l.t, 2.5, bw - 6).forEach(function (w) { box += tx(bx + 3, y, w, { sz: 2.5, b: l.b }); y += 3.5; }); y += 1.2; });
  R.warn.forEach(function (wm) { wrap('! ' + wm, 2.3, bw - 6).forEach(function (w) { box += tx(bx + 3, y, w, { sz: 2.3, c: RED }); y += 3.2; }); });
  if (R.dir.nearBoundary) wrap('Hướng gần ranh sơn (< ' + fnum(R.dir.warnDeg, 1) + '°): nên đo la bàn trực tiếp tại cửa chính để chốt.', 2.3, bw - 6).forEach(function (w) { box += tx(bx + 3, y, w, { sz: 2.3, c: BRASS, b: 1 }); y += 3.2; });
  y += 1;
  s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + f2(y - by) + '" rx="1.5" fill="#fbf1ee" stroke="' + RED + '" stroke-width=".3"/>' + box;
  // thông tin hình học
  var iy = y + 6;
  s += tx(bx, iy, 'THÔNG SỐ HÌNH HỌC', { sz: 3, b: 1, c: BLUE }); iy += 5;
  [['Diện tích', fnum(R.area, 2) + ' m²'], ['Chu vi', fnum(R.perimeter * 100, 1) + ' cm'], ['Số đỉnh', String(n)], ['Tâm', R.centerMode === 'area' ? 'Trọng tâm diện tích' : R.centerMode === 'vertex' ? 'TB các đỉnh' : 'Tâm khung bao']].forEach(function (r) {
    s += tx(bx, iy, r[0], { sz: 2.5, c: GREY }) + tx(bx + bw, iy, r[1], { sz: 2.5, a: 'end', b: 1 }); iy += 3.8;
  });
  s += scaleBar(bx + 3, Math.min(190, Math.max(iy + 10, 176)), k, N);
  // cách xác định
  var fe = R.edges[R.front], py = 199;
  s += tx(12, py, 'Cách xác định', { sz: 3.2, b: 1 }); py += 4.6;
  var paras = [];
  paras.push('1) Mặt tiền là cạnh ' + fe.from + '–' + fe.to + ' (dài ' + fnum(fe.len * 100, 1) + ' cm). Vectơ ' + fe.from + '→' + fe.to + ': Đông ' + fnum(fe.dE, 3) + ' m, Bắc ' + fnum(fe.dN, 3) + ' m.');
  paras.push('2) Phương vị cạnh = ' + fnum(fe.azGrid, 2) + '° (lưới)' + (R.georef ? ' → cộng độ hội tụ kinh tuyến ' + fnum(R.gamma, 2) + '° = ' + fnum(fe.azTrue, 2) + '° (Bắc thật)' : ', quy về Bắc thật ' + fnum(fe.azTrue, 2) + '°') + '.');
  paras.push('3) Pháp tuyến vuông góc cạnh: ' + fnum(fe.azTrue, 2) + '° ± 90° → ' + fnum(C.n360(fe.azTrue + 90), 2) + '° hoặc ' + fnum(C.n360(fe.azTrue - 90), 2) + '°. Chọn phía hướng ra ngoài thửa (xa tâm G): ' + fnum(fe.normTrue, 2) + '°.');
  if (R.dir.mode === 'axis') paras.push('4) Đang dùng hướng theo trục G→M: ' + fnum(R.dir.axisTrue, 2) + '°.');
  else if (R.dir.mode === 'manual') paras.push(R.dir.src === 'door' ? '4) Hướng lấy theo cửa chính đã vẽ trong Công cụ vẽ (hướng đi ra ngoài): ' + fnum(R.dir.true, 2) + '° (Bắc thật).' : '4) Đang dùng hướng nhập tay: ' + fnum(R.dir.true, 2) + '°.');
  else paras.push('4) Trục G→M có phương vị ' + fnum(R.dir.axisTrue, 2) + '° (lệch ' + fnum(Math.abs(C.n180(R.dir.axisTrue - fe.normTrue)), 2) + '° so với pháp tuyến do thửa không đối xứng); quy ước dùng pháp tuyến mặt tiền.');
  paras.push('5) Bắc từ = Bắc thật − D, với D = ' + (R.dir.decl >= 0 ? '+' : '') + fnum(R.dir.decl, 2) + '° (dương: lệch Đông) → ' + fnum(R.dir.true, 2) + '° − (' + fnum(R.dir.decl, 2) + '°) = ' + fnum(R.dir.mag, 2) + '°.');
  paras.forEach(function (p) { wrap(p, 2.5, 186).forEach(function (w) { s += tx(12, py, w, { sz: 2.5 }); py += 3.4; }); py += 0.8; });
  // bảng toạ độ
  py += 3; s += tx(12, py, 'Bảng toạ độ', { sz: 3.2, b: 1 }); py += 4.2;
  var rows = [], hasW = R.verts.every(function (v) { return v.lat != null; });
  var head = R.mode === 'local' ? ['Điểm', 'x - Đông (m)', 'y - Bắc (m)'] : ['Điểm', 'X - Bắc (m)', 'Y - Đông (m)'].concat(hasW ? ['WGS-84 vĩ độ', 'WGS-84 kinh độ'] : []);
  var fmtRow = function (lab, E, N, la, lo) { var r = [lab, fnum(N, 3), fnum(E, 3)]; if (R.mode === 'local') r = [lab, fnum(E, 3), fnum(N, 3)]; else if (hasW) r.push(la != null ? fnum(la, 6) + '°' : '–', lo != null ? fnum(lo, 6) + '°' : '–'); return r; };
  R.verts.forEach(function (v) { rows.push(fmtRow(v.label, v.E, v.N, v.lat, v.lon)); });
  rows.push(fmtRow('G (tâm)', R.G.E, R.G.N, R.G.lat, R.G.lon)); rows.push(fmtRow('M (mặt tiền)', R.M.E, R.M.N, R.M.lat, R.M.lon));
  var xs = [12, 44, 84, 124, 160];
  head.forEach(function (h, i) { s += tx(xs[i], py, h, { sz: 2.4, b: 1, c: GREY }); }); py += 3.8;
  var rh = Math.min(3.7, (283 - py) / (rows.length + 0.5));
  rows.forEach(function (r) { r.forEach(function (c, i) { s += tx(xs[i], py, c, { sz: 2.4 }); }); py += rh; });
  R._N1 = N;
  return pageWrap(s, 'Bản vẽ 1 - Mặt bằng thửa đất, tâm hình học G và ' + K.h, 'Tỷ lệ 1:' + N + ' (1 m ngoài thực tế = ' + fnum(k, 2) + ' mm trên giấy). Cạnh đỏ: mặt tiền. Mũi tên đỏ: ' + K.h + ', quay ra phía ngoài thửa.', 1, 4, R, o);
}

// ---------- TRANG 2 ----------
function page2(R, o) {
  var K = C.subj(R);
  var s = '', cx = 105, cy = 92, Rr = 50, d = R.dir, h = d.hInfo, off = R.shift;
  var P = function (a, r) { var t = a * D2R; return [cx + r * Math.sin(t), cy - r * Math.cos(t)]; };
  // nêm sơn chứa hướng
  var wp = [[cx, cy]]; for (var a = h.lowerTrue; a <= h.lowerTrue + 15.0001; a += 0.5) wp.push(P(a, Rr));
  s += poly(wp, '#cfeae0', 'none');
  s += circ(cx, cy, Rr, 'none', INK, 0.5) + circ(cx, cy, Rr - 8, 'none', INK, 0.2);
  for (var t = 0; t < 360; t += 5) { var big = t % 15 === 0, r2 = Rr + (t % 90 === 0 ? 3.6 : big ? 2.6 : 1.4), q1 = P(t + off, Rr), q2 = P(t + off, r2); s += ln(q1[0], q1[1], q2[0], q2[1], INK, big ? 0.3 : 0.18); }
  for (var i = 0; i < 24; i++) { var pp = P(i * 15 + off, Rr + 6.2), hot = (i === h.son); s += tx(pp[0], pp[1] + 0.9, C.SON24[i], { sz: 2.4, a: 'middle', b: hot, c: hot ? TEAL : INK }); }
  for (t = 0; t < 360; t += 30) { var pd = P(t + off, Rr - 4), lab = (o.ref === 'mag' || R.ref === 'mag' ? '' : '') + t + '°'; s += tx(pd[0], pd[1] + 0.8, lab, { sz: 2, a: 'middle', c: GREY }); }
  var dn = ['BẮC', 'ĐB', 'ĐÔNG', 'ĐN', 'NAM', 'TN', 'TÂY', 'TB'];
  for (i = 0; i < 8; i++) { var pn = P(i * 45 + off, Rr - 12); s += tx(pn[0], pn[1] + 0.9, dn[i], { sz: 2.6, a: 'middle', b: 1 }); }
  [h.lowerTrue, h.upperTrue].forEach(function (b) { var q = P(b, Rr); s += ln(cx, cy, q[0], q[1], TEAL, 0.25, '1.4 1'); });
  var ax = P(d.axisTrue, Rr); s += ln(cx, cy, ax[0], ax[1], BRASS, 0.3, '2 1');
  var mg = P(d.true + (R.shift && false ? 0 : 0), Rr); // hướng thật
  var mgm = P(d.true, Rr);
  // đường Bắc từ (hướng la bàn đọc được so với Bắc thật không đổi; vẽ chỉ báo Bắc từ)
  s += arrowSvg(cx, cy - 0.001, P(d.decl, Rr + 4.2)[0], P(d.decl, Rr + 4.2)[1], BLUE, 0.2, 1.8);
  s += arrowSvg(cx, cy, mgm[0], mgm[1], RED, 0.7, 3.4) + circ(cx, cy, 1.1, INK);
  s += arrowSvg(214 - 22, 34 + 12, 214 - 22, 34, INK, 0.45, 3) + tx(192, 31, 'Bắc thật', { sz: 2.6, b: 1, a: 'middle' });
  s += tx(cx, cy + Rr + 14.5, 'Mặt tròn: ' + (R.ref === 'mag' ? 'ranh cung/sơn đo theo Bắc từ, vẽ lệch D so với Bắc thật.' : 'ranh cung/sơn đo theo Bắc thật.') + ' Mũi tên xanh mảnh: hướng Bắc từ (lệch D = ' + fnum(d.decl, 2) + '°).', { sz: 2.1, a: 'middle', c: GREY });
  // chú giải
  var ly = 168;
  [[RED, null, K.H + ' (Bắc thật) ' + fnum(d.true, 2) + '°'], [BLUE, '1.4 1', 'Số đọc la bàn (Bắc từ) ' + fnum(d.mag, 2) + '°' + (d.declSource === 'estimate' ? ' - ước tính, D chưa xác nhận' : '')],
   [BRASS, '2 1', 'Trục G→M của thửa ' + fnum(d.axisTrue, 2) + '° (tham khảo)'], [TEAL, '1.4 1', 'Ranh sơn ' + h.sonName + ': ' + fnum(h.lowerTrue, 1) + '° và ' + fnum(h.upperTrue, 1) + '°']].forEach(function (it, i) {
    s += ln(14, ly + i * 5 - 1, 30, ly + i * 5 - 1, it[0], it[1] ? 0.35 : 0.8, it[1]) + tx(33, ly + i * 5, it[2], { sz: 2.7 });
  });
  // thước phóng đại
  var rc = d.true, lo = Math.floor((rc - 15) / 5) * 5, hi = Math.ceil((rc + 15) / 5) * 5, cen = (lo + hi) / 2, rw = 176, ppd = rw / (hi - lo), rx0 = 17, ry = 226;
  var RX = function (a) { return rx0 + rw / 2 + C.n180(a - cen) * ppd; };
  s += tx(rx0, ry - 28, 'Thước phóng đại ' + C.n360(lo) + '° - ' + C.n360(hi) + '° (1° = ' + fnum(ppd, 2) + ' mm)', { sz: 3.2, b: 1 });
  var x1 = RX(h.lowerTrue), x2 = RX(h.upperTrue); s += '<rect x="' + f2(Math.max(rx0, x1)) + '" y="' + (ry - 1) + '" width="' + f2(Math.min(rx0 + rw, x2) - Math.max(rx0, x1)) + '" height="8" fill="#cfeae0"/>';
  if (d.declSource === 'estimate') { var b1 = RX(d.true + 0.5 - 0.0), b2 = RX(d.true); /* dải la bàn ±0,5° quanh số đọc ước tính */ var m1 = RX(d.mag - 0.5), m2 = RX(d.mag + 0.5); s += '<rect x="' + f2(Math.min(m1, m2)) + '" y="' + (ry - 1) + '" width="' + f2(Math.abs(m2 - m1)) + '" height="8" fill="#b9d4f2"/>'; }
  s += ln(rx0, ry, rx0 + rw, ry, INK, 0.5);
  for (var q = lo; q <= hi + 1e-9; q += 1) { var xx = RX(q), five = Math.round(q) % 5 === 0; s += ln(xx, ry, xx, ry + (five ? 3.2 : 1.8), INK, 0.2); if (five) s += tx(xx, ry - 1.6, C.n360(q) + '°', { sz: 2.2, a: 'middle', c: GREY }); }
  for (q = lo; q < hi; q += 0.5) if (Math.abs(q % 1) > 1e-9) { var x5 = RX(q); s += ln(x5, ry, x5, ry + 1, GREY, 0.12); }
  function mark(az, col, level, label, anchor, above, dash, bold) {
    if (Math.abs(C.n180(az - cen)) > (hi - lo) / 2) return ''; var x = RX(az), y2 = above ? ry - 8 - level * 5.6 : ry + 11 + level * 5.6;
    return ln(x, ry, x, y2, col, bold ? 0.6 : 0.3, dash) + tx(x + (anchor === 'start' ? 1.2 : -1.2), above ? y2 - 0.6 : y2 + 2.2, label, { sz: 2.5, b: 1, c: col, a: anchor, h: 1 });
  }
  s += mark(h.lowerTrue, TEAL, 0, fnum(h.lowerTrue, 1) + '° ranh ' + (C.SON24[(h.son + 23) % 24]) + ' | ' + h.sonName, 'end', true, '1.4 1');
  s += mark(d.axisTrue, BRASS, 1, fnum(d.axisTrue, 1) + '° trục G-M', d.axisTrue < d.true ? 'end' : 'start', true, '2 1');
  s += mark(d.true, RED, 2, fnum(d.true, 1) + '° ' + K.H.toUpperCase() + ' (Bắc thật)', 'start', true, null, 1);
  s += mark(d.mag, BLUE, 0, fnum(d.mag, 1) + '° la bàn' + (d.declSource === 'estimate' ? ' (ước tính)' : ''), 'end', false, '1.4 1');
  var cd = C.nearestCardinal(d.true); s += mark(cd.az, INK, 1, cd.name + ' ' + cd.az + '°', 'start', false, null);
  s += mark(h.upperTrue, TEAL, 0, fnum(h.upperTrue, 1) + '° ranh ' + h.sonName + ' | ' + (C.SON24[(h.son + 1) % 24]), 'start', false, '1.4 1');
  // ghi chú
  var ny = 255, notes = [];
  var dl = Math.min(h.toLower, h.toUpper);
  notes.push('Cách đọc: ' + K.h + ' thuộc sơn ' + h.sonName + ' (cung ' + h.cungName + ' - ' + h.que + '), cách ranh dưới ' + fnum(h.toLower, 1) + '° và ranh trên ' + fnum(h.toUpper, 1) + '°. Nếu lấy theo trục G-M (' + fnum(d.axisTrue, 1) + '°) thì sơn là ' + C.sectorInfo(d.axisTrue, R.ref, d.decl).sonName + '.');
  notes.push('Đổi Bắc thật sang số đọc la bàn: hướng từ = hướng thật − D (D dương: lệch Đông; âm: lệch Tây). Ở đây D = ' + fnum(d.decl, 2) + '° nên la bàn đọc ' + fnum(d.mag, 2) + '°. ' + (d.declSource === 'estimate' ? 'Giá trị D là ước tính, cần tra mô hình WMM của NOAA tại đúng toạ độ để chốt. ' : '') + 'Nhiễu từ do sắt thép, xe máy, điện thoại có thể gây sai lệch lớn hơn độ lệch từ.');
  if (d.nearBoundary) notes.push('Cảnh báo: hướng cách ranh sơn ' + fnum(dl, 1) + '° (ngưỡng ' + fnum(d.warnDeg, 1) + '°). Nên đo la bàn trực tiếp tại cửa chính để chốt.');
  notes.forEach(function (p) { wrap(p, 2.5, 186).forEach(function (w) { s += tx(12, ny, w, { sz: 2.5 }); ny += 3.4; }); ny += 0.8; });
  return pageWrap(s, 'Bản vẽ 2 - Mặt phương vị: Bắc thật, Bắc từ và 24 sơn', 'Góc đo từ Bắc theo chiều kim đồng hồ. Thước phóng đại bên dưới để đọc chính xác vị trí hướng so với ranh sơn.', 2, 4, R, o);
}

// ---------- TRANG 3 ----------
function page3(R, o) {
  var K = C.subj(R);
  var T = R.T, n = R.n, Rm = R.Rmax * 1.03 + 0.2, gx = 105, gy = 125;
  var N = pickScale(null, o, function (N) { return Rm * 1000 / N <= 86; });
  var k = 1000 / N, RR = Rm * k, X = function (e) { return gx + e * k; }, Y = function (nn) { return gy - nn * k; };
  var s = '', V = T.map(function (p) { return [X(p[0]), Y(p[1])]; }), shift = R.shift;
  var P = function (a, r) { var t = a * D2R; return [gx + r * Math.sin(t), gy - r * Math.cos(t)]; };
  // tô cung & sơn chứa hướng
  var hi = R.dir.hInfo, cg = R.cung[hi.cung], sn = R.son[hi.son];
  var wc = C.wedgePoly(T, cg.from, cg.from + 45), ws = C.wedgePoly(T, sn.from, sn.from + 15);
  var ov = o.overlay, HVp = ov ? ov.rel.Ht.map(function (p) { return [X(p[0]), Y(p[1])]; }) : null;
  if (wc.length) s += poly(wc.map(function (p) { return [X(p[0]), Y(p[1])]; }), '#fbeed2', 'none');
  if (ws.length) s += poly(ws.map(function (p) { return [X(p[0]), Y(p[1])]; }), '#f3d28f', 'none');
  s += circ(gx, gy, RR, 'none', LIGHT, 0.3);
  // tia 24 sơn (nét đứt mảnh) và 8 cung (nét liền)
  if (o.draw24 !== false) R.d24.forEach(function (d) { if (d.k % 3 === 1) return; var q = P(d.az, RR); s += ln(gx, gy, q[0], q[1], GREY, 0.12, '1.2 0.9'); });
  R.d8.forEach(function (d) { var q = P(d.az, RR); s += ln(gx, gy, q[0], q[1], INK, 0.3); });
  if (ov) s += poly(HVp, '#f6c9b0', 'none') + '';
  s += poly(V, 'none', TEAL, 0.8);
  if (ov) s += poly(HVp, 'none', RED, 0.6);
  // tên sơn / cung quanh vòng
  for (var i = 0; i < 24; i++) { var p2 = P(i * 15 + shift, RR + 3.4), hot = i === hi.son; s += tx(p2[0], p2[1] + 0.8, C.SON24[i], { sz: 2, a: 'middle', b: hot, c: hot ? RED : GREY }); }
  for (i = 0; i < 8; i++) {
    var ang = i * 45 + shift, sx = Math.sin(ang * D2R), p3 = P(ang, RR + (Math.abs(sx) > 0.5 ? 7.2 : 8.8)), a = Math.abs(sx) < 0.2 ? 'middle' : (sx > 0 ? 'start' : 'end'), hot2 = i === hi.cung;
    s += tx(p3[0], p3[1] + 1, C.CUNG8[i].dir, { sz: 3, a: a, b: 1, c: hot2 ? RED : INK });
    if (ov && ov.rel.cungShare[i] > 0.005) s += tx(p3[0], p3[1] + 4.4, fnum(ov.rel.cungShare[i], 2) + ' m²', { sz: 2.1, a: a, b: 1, c: RED });
  }
  R.d8.forEach(function (d) { var q = P(d.az, RR - 3.2); s += tx(q[0], q[1] + 0.8, fnum(d.refAz, 1) + '°', { sz: 1.9, a: 'middle', c: GREY, h: 1 }); });
  // mũi tên hướng nhà từ M
  var fe = R.edges[R.front], Mm = [X(fe.mid[0]), Y(fe.mid[1])], az = R.dir.true;
  var tip = Math.max(5, Math.min(14, RR - Math.hypot(Mm[0] - gx, Mm[1] - gy) - 1));
  s += arrowSvg(Mm[0], Mm[1], Mm[0] + Math.sin(az * D2R) * tip, Mm[1] - Math.cos(az * D2R) * tip, RED, 0.7, 3);
  // nhãn đoạn
  var segs = R.p8.segs;
  segs.forEach(function (sg) {
    var mp = sg.mid, e = R.edges[sg.edge], plen = sg.len * k, extra = plen < 10 ? 6 : 0, gap = 2.3 + extra;
    if (sg.edge === R.front && R.dir.mode === 'normal') { var sM = R.cum[sg.edge] + e.len / 2; if (sg.s0 < sM - 1e-6 && sg.s1 > sM + 1e-6) { var A0 = T[sg.edge], B0 = T[(sg.edge + 1) % n], useA = (sM - sg.s0) >= (sg.s1 - sM), q0 = useA ? sg.s0 : sM, q1 = useA ? sM : sg.s1, um = ((q0 + q1) / 2 - R.cum[sg.edge]) / e.len; mp = [A0[0] + um * (B0[0] - A0[0]), A0[1] + um * (B0[1] - A0[1])]; } }
    var mm = [X(mp[0]), Y(mp[1])];
    if (extra) s += ln(mm[0], mm[1], mm[0] + e.nrm[0] * gap, mm[1] - e.nrm[1] * gap, GREY, 0.15);
    s += placeLabel(mm[0], mm[1], e.nrm[0], -e.nrm[1], sg.from + '–' + sg.to + ' = ' + lenTxt(sg.len, o), 2.5, { b: 1 }, gap);
  });
  if (o.label24) R.p24.segs.forEach(function (sg) {
    if (sg.fromKind === 'd' && sg.toKind === 'd' && R.p8.segs.some(function (z) { return Math.abs(z.s0 - sg.s0) < 1e-9 && Math.abs(z.s1 - sg.s1) < 1e-9; })) return;
    var mm = [X(sg.mid[0]), Y(sg.mid[1])], e = R.edges[sg.edge]; s += placeLabel(mm[0], mm[1], -e.nrm[0], e.nrm[1], fnum(sg.len * 100, 1), 1.8, { c: GREY }, 1.4);
  });
  // đỉnh, điểm chia, G
  V.forEach(function (p, j) { s += circ(p[0], p[1], 0.9, INK); var nn = outNormalAt(R, j); s += tx(p[0] + nn[0] * 5, p[1] + nn[1] * 5 + 1.6, R.verts[j].label, { sz: 4, b: 1, a: 'middle', h: 1 }); });
  R.d8.forEach(function (d) {
    if (!d.hit) return; var p = [X(d.pos[0]), Y(d.pos[1])], u = [Math.sin(d.az * D2R), -Math.cos(d.az * D2R)];
    s += circ(p[0], p[1], 1.1, RED, '#fff', 0.2) + tx(p[0] - u[0] * 3.6, p[1] - u[1] * 3.6 + 1.3, d.id, { sz: 3.4, b: 1, c: RED, a: 'middle', h: 1 });
  });
  if (ov) { HVp.forEach(function (p) { s += circ(p[0], p[1], 0.7, RED); }); var gh = [X(ov.rel.Gh[0]), Y(ov.rel.Gh[1])]; s += circ(gh[0], gh[1], 1.5, RED, '#fff', 0.3) + tx(gh[0] + 2.4, gh[1] - 1.8, 'Gn', { sz: 3, b: 1, c: RED, h: 1 }); var Mh8 = [X(ov.rel.Mh[0]), Y(ov.rel.Mh[1])], ah8 = ov.H.dir.true * D2R; s += arrowSvg(Mh8[0], Mh8[1], Mh8[0] + Math.sin(ah8) * 9, Mh8[1] - Math.cos(ah8) * 9, RED, 0.5, 2.4); }
  s += circ(gx, gy, 1.7, BRASS, '#fff', 0.3) + tx(gx + 2.8, gy - 1.6, 'G', { sz: 3.4, b: 1, c: BRASS, h: 1 });
  s += northArrow(190, 40) + scaleBar(14, 40, k, N);
  var lg = 268;
  [['Nét liền: ranh 8 cung (cung rộng 45°)', INK, null], ['Nét đứt mảnh: ranh 24 sơn (sơn rộng 15°)', GREY, '1.2 0.9'], [ov ? 'Đỏ: nhà, tâm Gn, hướng nhà ' + fnum(ov.H.dir.true, 1) + '°; số đỏ cạnh tên cung = diện tích nhà (m²)' : 'Mũi tên đỏ: ' + K.h + ' ' + fnum(R.dir.true, 1) + '° (Bắc thật)', RED, null]].forEach(function (it, i) {
    s += ln(12, lg + i * 4.2 - 0.9, 22, lg + i * 4.2 - 0.9, it[1], it[2] ? 0.15 : 0.4, it[2]) + tx(24, lg + i * 4.2, it[0], { sz: 2.3 });
  });
  s += '<rect x="108" y="' + (lg - 2.4) + '" width="10" height="3" fill="#fbeed2"/><rect x="108" y="' + (lg + 1.8) + '" width="10" height="3" fill="#f3d28f"/>' + tx(120, lg, 'Vùng nhạt: cung chứa hướng (' + cg.name + ')', { sz: 2.3 }) + tx(120, lg + 4.2, 'Vùng đậm: sơn chứa hướng (' + sn.name + ')', { sz: 2.3 });
  if (R.ref === 'mag') s += tx(108, lg + 8.4, 'Ranh chia đo theo Bắc từ (D = ' + fnum(R.dir.decl, 2) + '°).', { sz: 2.3, c: BRASS, b: 1 });
  // bảng đoạn
  var ty = 226; s += tx(12, ty, 'Độ dài các đoạn dọc ranh đất sau khi phân 8 cung (dùng để đo ngoài thực tế)', { sz: 3, b: 1 }); ty += 5;
  var cols = Math.min(4, Math.ceil(segs.length / 6)), per = Math.ceil(segs.length / cols), cw = 186 / cols;
  segs.forEach(function (sg, j) {
    var c = Math.floor(j / per), r = j % per, x = 12 + c * cw, y = ty + r * 4.4;
    s += tx(x, y, sg.from + ' → ' + sg.to, { sz: 2.5 }) + tx(x + 18, y, C.CUNG8[sg.cung].dir, { sz: 2.1, c: GREY }) + tx(x + cw - 4, y, lenTxt(sg.len, { unit: 'cm' }), { sz: 2.5, b: 1, a: 'end' });
  });
  var sum = segs.reduce(function (a, b) { return a + b.len; }, 0);
  s += tx(12, ty + per * 4.4 + 3, 'Kiểm tra: tổng các đoạn = ' + fnum(sum * 100, 1) + ' cm; chu vi = ' + fnum(R.perimeter * 100, 1) + ' cm.', { sz: 2.3, c: GREY });
  R._N3 = N;
  if (ov) return pageWrap(s, 'Bản vẽ 3 - Phân 8 cung và 24 sơn khu đất, có nhà trong khu đất', 'Tỷ lệ 1:' + N + ' (1 m ngoài thực tế = ' + fnum(k, 2) + ' mm trên giấy). Cung và sơn chia từ tâm G của khu đất (hướng đất ' + fnum(R.dir.true, 1) + '°); vùng đỏ là căn nhà (hướng nhà ' + fnum(ov.H.dir.true, 1) + '°).', 3, 4, R, Object.assign({}, o, { pgOff: 3, bvOff: 2, pgTotal: 10 }));
  return pageWrap(s, 'Bản vẽ 3 - Phân 8 cung và 24 sơn từ tâm hình học G', 'Tỷ lệ 1:' + N + ' (1 m ngoài thực tế = ' + fnum(k, 2) + ' mm trên giấy). Điểm chia ' + R.d8.map(function (d) { return d.id; }).join(',') + ' là giao của tia phân cung với ranh đất.', 3, 4, R, o);
}

// ---------- TRANG 4: PHỤ LỤC ----------
function table(x, y, cols, rows, sz, rh) {
  var s = '';
  cols.forEach(function (c) { s += tx(x + c.x, y, c.h, { sz: sz, b: 1, c: GREY, a: c.a || 'start' }); });
  s += ln(x, y + 1.2, x + 186, y + 1.2, LIGHT, 0.15); y += rh;
  rows.forEach(function (r) { cols.forEach(function (c, i) { s += tx(x + c.x, y, r[i] == null ? '' : r[i], { sz: sz, a: c.a || 'start', b: c.b }); }); y += rh; });
  return { s: s, y: y };
}
function page4(R, o) {
  var s = '', y = 31, rh = 3.7, sz = 2.4, t;
  s += tx(12, y, 'A. Các cạnh của thửa đất', { sz: 3.2, b: 1, c: BLUE }); y += 5;
  t = table(12, y, [{ h: 'Cạnh', x: 0 }, { h: 'Dài (cm)', x: 40, a: 'end' }, { h: 'Dài (m)', x: 62, a: 'end' }, { h: 'Phương vị lưới', x: 96, a: 'end' }, { h: 'Phương vị Bắc thật', x: 128, a: 'end' }, { h: 'Góc trong tại đỉnh đầu', x: 172, a: 'end' }],
    R.edges.map(function (e, i) { return [e.from + '–' + e.to + (i === R.front ? '  (mặt tiền)' : ''), fnum(e.len * 100, 1), fnum(e.len, 3), fnum(e.azGrid, 2) + '°', fnum(e.azTrue, 2) + '°', fnum(R.verts[i].angle, 2) + '°']; }), sz, rh);
  s += t.s; y = t.y + 5;
  s += tx(12, y, 'B. Tám cung (Bát quái) - góc chia theo ' + (R.ref === 'mag' ? 'Bắc từ' : 'Bắc thật'), { sz: 3.2, b: 1, c: BLUE }); y += 5;
  t = table(12, y, [{ h: 'Cung', x: 0 }, { h: 'Quái', x: 24 }, { h: 'Ba sơn', x: 40 }, { h: 'Từ → đến', x: 82 }, { h: 'Chu vi (cm)', x: 138, a: 'end' }, { h: 'Diện tích (m²)', x: 172, a: 'end' }],
    R.cung.map(function (c, i) { return [c.name, c.que, c.sonNames.join(' - '), fnum(C.n360(i * 45 - 22.5), 1) + '° → ' + fnum(C.n360(i * 45 + 22.5), 1) + '°', fnum(c.perim * 100, 1), fnum(c.area, 2)]; }), sz, rh);
  s += t.s; y = t.y + 5;
  s += tx(12, y, 'C. Điểm phân chia 8 cung trên ranh đất', { sz: 3.2, b: 1, c: BLUE }); y += 5;
  t = table(12, y, [{ h: 'Điểm', x: 0 }, { h: 'Góc tia', x: 22, a: 'end' }, { h: 'Nằm trên cạnh', x: 30 }, { h: 'Cách đỉnh đầu (cm)', x: 100, a: 'end' }, { h: 'Cách đỉnh cuối (cm)', x: 138, a: 'end' }, { h: 'Cách G (cm)', x: 172, a: 'end' }],
    R.d8.map(function (d) { return d.hit ? [d.id, fnum(d.refAz, 1) + '°', R.edges[d.edge].from + '–' + R.edges[d.edge].to, fnum(d.fromStart * 100, 1), fnum(d.fromEnd * 100, 1), fnum(d.dist * 100, 1)] : [d.id, fnum(d.refAz, 1) + '°', 'không cắt', '', '', '']; }), sz, rh);
  s += t.s; y = t.y + 5;
  s += tx(12, y, 'D. Các đoạn dọc ranh đất sau khi phân 24 sơn (đo ngoài thực tế, cm)', { sz: 3.2, b: 1, c: BLUE }); y += 5;
  var sg = R.p24.segs, cols3 = 3, per = Math.ceil(sg.length / cols3), cw = 62, avail = Math.floor((283 - y) / 3.5);
  sz = per > avail ? 2.1 : 2.4; var rh2 = per > avail ? Math.max(2.9, (283 - y) / per) : 3.5;
  sg.forEach(function (z, j) { var c = Math.floor(j / per), r = j % per, x = 12 + c * cw, yy = y + r * rh2; s += tx(x, yy, z.from + ' → ' + z.to, { sz: sz }) + tx(x + 22, yy, C.SON24[z.son], { sz: sz - 0.2, c: GREY }) + tx(x + cw - 5, yy, fnum(z.len * 100, 1), { sz: sz, b: 1, a: 'end' }); });
  var sum24 = sg.reduce(function (a, b) { return a + b.len; }, 0);
  s += tx(12, Math.min(283, y + per * rh2 + 3), 'Kiểm tra: tổng ' + sg.length + ' đoạn = ' + fnum(sum24 * 100, 1) + ' cm; chu vi = ' + fnum(R.perimeter * 100, 1) + ' cm. Mã sơn s1…s24 là điểm tia 24 sơn không trùng ranh cung (s' + 'k nằm tại góc ' + fnum(7.5, 1) + '° + 15°·(k−1)).', { sz: 2.1, c: GREY });
  return pageWrap(s, 'Phụ lục - Bảng số liệu chi tiết', 'Toàn bộ chiều dài tính bằng cm (độ chính xác theo toạ độ nhập vào). Dùng để đối chiếu và đo trực tiếp ngoài hiện trường.', 4, 4, R, o);
}

var HOUSE_SUBS = [['Mặt bằng thửa đất', 'Mặt bằng nhà'], ['Phân 8 cung và 24 sơn từ tâm hình học G', 'Phân 8 cung và 24 sơn từ tâm nhà Gn'], ['G - tâm hình học', 'Gn - tâm nhà'], ['M - tâm mặt tiền', 'Mn - tâm mặt tiền nhà'],
  ['tâm hình học G', 'tâm nhà Gn'], ['>G<', '>Gn<'], ['Trục G→M', 'Trục Gn→Mn'], ['trục G-M', 'trục Gn-Mn'], ['G→M', 'Gn→Mn'], ['G-M', 'Gn-Mn'], ['G (tâm)', 'Gn (tâm)'], ['M (mặt tiền)', 'Mn (mặt tiền)'],
  ['tâm G', 'tâm Gn'], ['Cách G', 'Cách Gn'], ['Thửa đất: ', 'Nhà - '], ['ngoài thửa', 'ngoài nhà'], ['của thửa', 'của nhà'], ['Các cạnh của thửa đất', 'Các cạnh của nhà'], ['ranh đất', 'chu vi nhà'], ['thửa', 'nhà']];
function houseify(svg) { HOUSE_SUBS.forEach(function (r) { svg = svg.split(r[0]).join(r[1]); }); return svg; }

function pageRel(R, H, rel, o) {
  var T = R.T, n = R.n, AW = 124, AH = 170, mxm = 22, mym = 12, s = '', fe = R.edges[R.front], he = H.edges[H.front];
  function ext(N) { var e = 16 * N / 1000, a = R.dir.true * D2R, b = H.dir.true * D2R; return rel.Ht.concat(T, [[fe.mid[0] + Math.sin(a) * e, fe.mid[1] + Math.cos(a) * e], [rel.Mh[0] + Math.sin(b) * e, rel.Mh[1] + Math.cos(b) * e]]); }
  var N = pickScale(null, o, function (N) { var b = bbox(ext(N)); return b.w * 1000 / N + 2 * mxm <= AW && b.h * 1000 / N + 2 * mym <= AH; });
  var bb = bbox(ext(N)), k = 1000 / N, cx = 12 + AW / 2, cy = 26 + AH / 2;
  var X = function (e) { return cx + (e - bb.cx) * k; }, Y = function (nn) { return cy - (nn - bb.cy) * k; };
  var V = T.map(function (p) { return [X(p[0]), Y(p[1])]; }), HV = rel.Ht.map(function (p) { return [X(p[0]), Y(p[1])]; });
  var G = [X(0), Y(0)], Gh = [X(rel.Gh[0]), Y(rel.Gh[1])];
  s += poly(V, '#e6f0f7', BLUE, 0.6);
  // tia 8 cung của khu đất + tên cung
  R.d8.forEach(function (dd) { if (dd.hit) s += ln(G[0], G[1], X(dd.pos[0]), Y(dd.pos[1]), LIGHT, 0.15); });
  for (var i = 0; i < 8; i++) { var az = i * 45 + R.shift, h = C.rayHit(T, az); if (h) { var u = [Math.sin(az * D2R), -Math.cos(az * D2R)], px = X(h.e) + u[0] * 4.2, py = Y(h.n) + u[1] * 4.2; s += tx(px, py + 0.9, C.CUNG8[i].dir, { sz: 2.1, a: 'middle', c: GREY, h: 1 }); } }
  // nhà
  s += poly(HV, '#f6d3c0', RED, 0.6);
  H.edges.forEach(function (e, i) { var p = HV[i], q = HV[(i + 1) % H.n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; s += placeLabel(mx, my, e.nrm[0], -e.nrm[1], fnum(e.len * 100, 1) + ' cm', 2.2, { c: RED, b: i === H.front }, 1.6); });
  // khoảng lùi
  rel.setbacks.forEach(function (sb) {
    var a = [X(sb.ph[0]), Y(sb.ph[1])], b = [X(sb.pl[0]), Y(sb.pl[1])]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.8) return;
    s += ln(a[0], a[1], b[0], b[1], TEAL, 0.25) + circ(a[0], a[1], 0.5, TEAL) + circ(b[0], b[1], 0.5, TEAL);
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    s += placeLabel((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, nx, ny, fnum(sb.d * 100, 1) + ' cm', 2.2, { c: TEAL, b: 1 }, 1.4);
  });
  // mũi tên: khu đất (xanh) và nhà (đỏ)
  var Ml = [X(fe.mid[0]), Y(fe.mid[1])], Mh = [X(rel.Mh[0]), Y(rel.Mh[1])], al = R.dir.true * D2R, ah = H.dir.true * D2R;
  s += arrowSvg(Ml[0], Ml[1], Ml[0] + Math.sin(al) * 14, Ml[1] - Math.cos(al) * 14, BLUE, 0.6, 2.8);
  s += arrowSvg(Mh[0], Mh[1], Mh[0] + Math.sin(ah) * 14, Mh[1] - Math.cos(ah) * 14, RED, 0.7, 3);
  s += tx(Ml[0] + Math.sin(al) * 16, Ml[1] - Math.cos(al) * 16 + 3, 'Hướng đất ' + fnum(R.dir.true, 1) + '°', { sz: 2.4, b: 1, c: BLUE, a: 'middle', h: 1 });
  s += tx(Mh[0] + Math.sin(ah) * 14 + 2, Mh[1] - Math.cos(ah) * 14 + 0.5, 'Hướng nhà ' + fnum(H.dir.true, 1) + '°', { sz: 2.4, b: 1, c: RED, a: 'start', h: 1 });
  V.forEach(function (p, i) { s += circ(p[0], p[1], 0.8, BLUE); var nn = outNormalAt(R, i); s += tx(p[0] + nn[0] * 4, p[1] + nn[1] * 4 + 1.4, R.verts[i].label, { sz: 3.4, b: 1, a: 'middle', c: BLUE, h: 1 }); });
  HV.forEach(function (p, i) { s += circ(p[0], p[1], 0.7, RED); var nn = outNormalAt(H, i); s += tx(p[0] + nn[0] * 3.2, p[1] + nn[1] * 3.2 + 1.2, H.verts[i].label, { sz: 2.6, b: 1, a: 'middle', c: RED, h: 1 }); });
  s += ln(G[0], G[1], Gh[0], Gh[1], BRASS, 0.3, '1.4 1');
  s += circ(G[0], G[1], 1.6, BRASS, '#fff', 0.3) + tx(G[0] - 2.4, G[1] - 2, 'G', { sz: 3, b: 1, c: BRASS, a: 'end', h: 1 });
  s += circ(Gh[0], Gh[1], 1.6, RED, '#fff', 0.3) + tx(Gh[0] + 2.4, Gh[1] - 2, 'Gn', { sz: 3, b: 1, c: RED, a: 'start', h: 1 });
  s += northArrow(20, 34) + scaleBar(145, 190, k, N);
  // cột phải
  var bx = 142, by = 26, bw = 56, y = by + 6, box = '';
  box += tx(bx + 3, y, 'NHÀ TRONG KHU ĐẤT', { sz: 2.9, b: 1, c: RED }); y += 5;
  var L = [
    { t: 'Diện tích nhà ' + fnum(H.area, 2) + ' m² = ' + fnum(rel.areaPct, 1) + '% diện tích khu đất (' + fnum(R.area, 2) + ' m²).', b: 1 },
    { t: 'Hướng nhà ' + fnum(H.dir.true, 1) + '° (sơn ' + H.dir.hInfoTrue.sonName + '); hướng đất ' + fnum(R.dir.true, 1) + '° (sơn ' + R.dir.hInfoTrue.sonName + '); chênh ' + fnum(rel.dirDiff, 1) + '°.' },
    { t: 'Tâm nhà Gn cách tâm khu đất G ' + fnum(rel.dist * 100, 1) + ' cm, phương vị ' + fnum(rel.az, 1) + '° (Bắc thật).' },
    { t: 'Gn nằm trong cung ' + C.CUNG8[rel.gInfo.cung].dir + ' (' + C.CUNG8[rel.gInfo.cung].que + '), sơn ' + rel.gInfo.sonName + ' của khu đất.', b: 1 }
  ];
  L.forEach(function (l) { wrap(l.t, 2.4, bw - 6).forEach(function (w) { box += tx(bx + 3, y, w, { sz: 2.4, b: l.b }); y += 3.4; }); y += 1; });
  rel.warn.forEach(function (w) { wrap('! ' + w, 2.3, bw - 6).forEach(function (z) { box += tx(bx + 3, y, z, { sz: 2.3, c: RED, b: 1 }); y += 3.2; }); });
  y += 1; s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + f2(y - by) + '" rx="1.5" fill="#fbf1ee" stroke="' + RED + '" stroke-width=".3"/>' + box;
  var ly = y + 8; s += tx(bx, ly, 'Chú giải', { sz: 2.7, b: 1, c: BLUE }); ly += 4.4;
  [[BLUE, 'Ranh khu đất, tâm G, hướng đất'], [RED, 'Ranh nhà, tâm nhà Gn, hướng nhà'], [TEAL, 'Khoảng lùi tối thiểu nhà → ranh (cm)'], [LIGHT, 'Ranh 8 cung của khu đất (từ G)']].forEach(function (it) { s += ln(bx, ly - 0.9, bx + 8, ly - 0.9, it[0], 0.6) + tx(bx + 10, ly, it[1], { sz: 2.1 }); ly += 4.1; });
  // bảng
  var ty = 206; s += tx(12, ty, 'Khoảng lùi tối thiểu từ nhà đến từng ranh khu đất', { sz: 2.9, b: 1, c: BLUE }); ty += 4.4;
  var t1 = table(12, ty, [{ h: 'Ranh', x: 0 }, { h: 'Điểm nhà gần nhất', x: 20 }, { h: 'Khoảng lùi (cm)', x: 78, a: 'end' }], rel.setbacks.map(function (b) { return [b.from + '–' + b.to, b.hv, fnum(b.d * 100, 1)]; }), 2.3, 3.5);
  s += t1.s;
  s += tx(108, 206, 'Phân bố diện tích nhà theo 8 cung của khu đất', { sz: 2.9, b: 1, c: BLUE });
  var t2 = table(108, 210.4, [{ h: 'Cung', x: 0 }, { h: 'Diện tích (m²)', x: 54, a: 'end' }, { h: '%', x: 80, a: 'end' }], R.cung.map(function (c, i) { return [c.name + ' (' + c.que + ')', fnum(rel.cungShare[i], 2), fnum(rel.cungShare[i] / H.area * 100, 1)]; }), 2.3, 3.5);
  s += t2.s;
  var cy2 = Math.max(t1.y, t2.y) + 4; s += tx(12, cy2, 'Toạ độ các đỉnh nhà và vị trí so với tâm khu đất G', { sz: 2.9, b: 1, c: BLUE }); cy2 += 4.4;
  var geo = R.mode !== 'local', rows = H.verts.map(function (v, i) { return [v.label, fnum(geo ? v.N : v.E, 3), fnum(geo ? v.E : v.N, 3), fnum(rel.Ht[i][0] * 100, 1), fnum(rel.Ht[i][1] * 100, 1)]; });
  rows.push(['Gn', fnum(geo ? H.G.N : H.G.E, 3), fnum(geo ? H.G.E : H.G.N, 3), fnum(rel.Gh[0] * 100, 1), fnum(rel.Gh[1] * 100, 1)]);
  var rh = Math.min(3.5, (283 - cy2) / (rows.length + 1));
  var t3 = table(12, cy2, [{ h: 'Điểm', x: 0 }, { h: geo ? 'X - Bắc (m)' : 'x (m)', x: 56, a: 'end' }, { h: geo ? 'Y - Đông (m)' : 'y (m)', x: 96, a: 'end' }, { h: 'Đông so với G (cm)', x: 140, a: 'end' }, { h: 'Bắc so với G (cm)', x: 184, a: 'end' }], rows, 2.3, rh);
  s += t3.s; R._NR = N;
  return pageWrap(s, 'Bản vẽ 4 - Nhà trong khu đất: vị trí, khoảng lùi và quan hệ hướng', 'Tỷ lệ 1:' + N + ' (1 m ngoài thực tế = ' + fnum(k, 2) + ' mm trên giấy). Tổng thể khu đất (xanh) và vị trí căn nhà (đỏ).', 5, 10, R, Object.assign({}, o, { pgOff: 0, bvOff: 0, pgTotal: 10 }));
}

function buildPages(R, o, H, rel) {
  o = Object.assign({ unit: 'cm', scaleMode: 'auto', scaleN: 0, draw24: true, label24: false }, o || {});
  if (!R.ok) return null;
  var hasH = !!(H && H.ok && rel), ol = Object.assign({}, o, { pgTotal: hasH ? 10 : 4 });
  var p1 = page1(R, ol), p2 = page2(R, ol), p3 = page3(R, ol), p4 = page4(R, ol), out = { pages: [p1, p2, p3, p4], names: ['Bản vẽ 1 - Mặt bằng khu đất', 'Bản vẽ 2 - Phương vị khu đất', 'Bản vẽ 3 - Phân cung khu đất', 'Phụ lục khu đất'], scale1: R._N1, scale3: R._N3 };
  out.scales = [R._N1, null, R._N3, null];
  if (hasH) {
    var oh = Object.assign({}, o, { isHouse: true, bvOff: 5, pgOff: 6, pgTotal: 10 });
    out.pages.push(pageRel(R, H, rel, o)); out.names.push('Bản vẽ 4 - Nhà trong khu đất'); out.scaleRel = R._NR; out.scales.push(R._NR);
    out.pages.push(page3(R, Object.assign({}, o, { overlay: { H: H, rel: rel }, pgTotal: 10 }))); out.names.push('Bản vẽ 5 - Khu đất có nhà, phân cung'); out.scale8 = R._N3; out.scales.push(R._N3);
    out.pages.push(houseify(page1(H, oh))); out.names.push('Bản vẽ 6 - Mặt bằng nhà'); out.scaleH1 = H._N1; out.scales.push(H._N1);
    out.pages.push(houseify(page2(H, oh))); out.names.push('Bản vẽ 7 - Phương vị nhà'); out.scales.push(null);
    out.pages.push(houseify(page3(H, oh))); out.names.push('Bản vẽ 8 - Phân cung nhà'); out.scaleH3 = H._N3; out.scales.push(H._N3);
    out.pages.push(houseify(page4(H, oh))); out.names.push('Phụ lục nhà'); out.scales.push(null);
  }
  return out;
}

function thumb(R, sel) {
  var T = R.T, bb = bbox(T), S = 100, pad = 14, k = (S - 2 * pad) / Math.max(bb.w, bb.h, 1e-6), W = bb.w * k + 2 * pad, H = bb.h * k + 2 * pad;
  var X = function (e) { return pad + (e - bb.x0) * k; }, Y = function (n) { return pad + (bb.y1 - n) * k; };
  var V = T.map(function (p) { return [X(p[0]), Y(p[1])]; }), s = '<svg viewBox="0 0 ' + f2(W) + ' ' + f2(H) + '" xmlns="http://www.w3.org/2000/svg" class="dt-thumb">';
  s += poly(V, '#e6f0f7', 'none');
  R.edges.forEach(function (e, i) { var a = V[i], b = V[(i + 1) % R.n]; s += '<line x1="' + f2(a[0]) + '" y1="' + f2(a[1]) + '" x2="' + f2(b[0]) + '" y2="' + f2(b[1]) + '" stroke="' + (i === sel ? RED : BLUE) + '" stroke-width="' + (i === sel ? 2.2 : 1) + '" stroke-linecap="round"/><line data-edge="' + i + '" x1="' + f2(a[0]) + '" y1="' + f2(a[1]) + '" x2="' + f2(b[0]) + '" y2="' + f2(b[1]) + '" stroke="transparent" stroke-width="9" style="cursor:pointer"/>'; });
  V.forEach(function (p, i) { s += '<text x="' + f2(p[0] + outNormalAt(R, i)[0] * 6) + '" y="' + f2(p[1] + outNormalAt(R, i)[1] * 6 + 2.5) + '" font-size="6.5" text-anchor="middle" font-weight="700" fill="' + INK + '">' + esc(R.verts[i].label) + '</text>'; });
  s += '<circle cx="' + f2(X(0)) + '" cy="' + f2(Y(0)) + '" r="2.4" fill="' + BRASS + '"/>';
  var fe = R.edges[sel] || R.edges[0], ar = R.dir.true * D2R, mx = X(fe.mid[0]), my = Y(fe.mid[1]);
  s += '<line x1="' + f2(mx) + '" y1="' + f2(my) + '" x2="' + f2(mx + 12 * Math.sin(ar)) + '" y2="' + f2(my - 12 * Math.cos(ar)) + '" stroke="' + RED + '" stroke-width="1.6"/><circle cx="' + f2(mx + 12 * Math.sin(ar)) + '" cy="' + f2(my - 12 * Math.cos(ar)) + '" r="2" fill="' + RED + '"/>';
  return s + '</svg>';
}

return { buildPages: buildPages, thumb: thumb, STD: STD };
})(DinhTamCore);
if (typeof module !== 'undefined') module.exports = DinhTamDraw;

/* ===== DinhTamApp: giao diện "Định tâm và Phân cung điểm hướng" ===== */
var DinhTamApp = (function (C, Dw) {
'use strict';
var KEY = 'tientqn.dinhtam.input.v1', KEYR = 'tientqn.dinhtam.result.v1';
var fnum = C.fnum, R2D = 180 / Math.PI;
var DEFAULT_PROV = 38; // Bình Thuận
var SAMPLE = {
  name: 'Thửa đất 12/10/2026 - Nhà', prov: '38', mode: 'vn2000', cm: '108.5', k0: '0.9999', front: 2, house: { enabled: true, mode: 'rect', rect: { W: '8', D: '12', L: '3.5', F: '5', rot: '0' }, front: 'auto', dirMode: 'normal', manualAz: '' },
  data: {
    vn2000: [['1', '1177495.586', '415366.697'], ['2', '1177496.282', '415379.905'], ['3', '1177459.697', '415384.234'], ['4', '1177458.913', '415369.467']],
    wgs84: [['1', '10.646774', '107.728221'], ['2', '10.646780', '107.728342'], ['3', '10.646450', '107.728383'], ['4', '10.646442', '107.728248']],
    local: [['1', '0', '0'], ['2', '10', '0'], ['3', '10', '10'], ['4', '0', '10']]
  }
};
var DOORS = { lot: null, house: null };
function houseBlank() { return { enabled: false, mode: 'rect', rect: { W: '', D: '', L: '', F: '', rot: '0' }, uv: [['N1', '', ''], ['N2', '', ''], ['N3', '', ''], ['N4', '', '']], abs: { vn2000: [['N1', '', ''], ['N2', '', ''], ['N3', '', ''], ['N4', '', '']], wgs84: [['N1', '', ''], ['N2', '', ''], ['N3', '', ''], ['N4', '', '']], local: [['N1', '', ''], ['N2', '', ''], ['N3', '', ''], ['N4', '', '']] }, front: 'auto', dirMode: 'normal', manualAz: '', snap: { pt: true, or: true, gr: true, step: '0.05' }, trav: { u0: '', v0: '', ang: '0', dir: 'cw', rows: [['', ''], ['', ''], ['', '']] } }; }
function blank() {
  return { name: '', prov: '', tm: 'vn2000', house: houseBlank(), mode: 'vn2000', cm: '108.5', k0: '0.9999', front: 0, dirMode: 'normal', manualAz: '', decl: '-0.5', declSource: 'estimate', ref: 'true', center: 'area', warnDeg: '3',
    localTheta: '0', unit: 'cm', scaleMode: 'auto', scaleN: '', draw24: true, label24: false,
    data: { vn2000: [['1', '', ''], ['2', '', ''], ['3', '', ''], ['4', '', '']], wgs84: [['1', '', ''], ['2', '', ''], ['3', '', ''], ['4', '', '']], local: [['1', '', ''], ['2', '', ''], ['3', '', ''], ['4', '', '']] } };
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

var TRAV = null, S = blank(), R = null, H = null, REL = null, pages = null, root = null, curPage = 0, timer = null, listeners = [], IMG = null;

function load() { try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.data) { S = Object.assign(blank(), j); S.house = Object.assign(houseBlank(), j.house || {}); } } catch (e) { } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

var HTML = '' +
'<div class="dt-root">' +
' <header class="dt-head"><div><h2>Định tâm và Phân cung điểm hướng</h2><p>Từ toạ độ VN-2000 hoặc bản vẽ: tâm hình học, hướng thật/từ, 8 cung, 24 sơn và bộ 3 bản vẽ đúng tỷ lệ.</p></div>' +
'  <div class="dt-head-btn"><button class="dt-btn" data-act="sample">Nạp ví dụ</button><button class="dt-btn" data-act="reset">Xoá hết</button></div></header>' +
' <nav class="dt-nav"><a href="#dt-s1">1 Dữ liệu</a><a href="#dt-s2">2 Hình học</a><a href="#dt-s3">3 Hướng</a><a href="#dt-s4">4 Phân cung</a><a href="#dt-sh">5 Nhà</a><a href="#dt-s5">6 Bản vẽ</a><a href="#dt-s6">7 Liên kết</a></nav>' +
' <div id="dt-msg" class="dt-msg" hidden></div>' +
' <section class="dt-card" id="dt-s1"><h3>1. Dữ liệu thửa đất</h3>' +
'  <div class="dt-row"><label class="dt-f dt-grow">Tên thửa / ghi chú<input id="dt-name" placeholder="VD: Thửa 12, tờ bản đồ 5"></label></div>' +
'  <div class="dt-tabs" id="dt-modes"><button data-mode="vn2000">Toạ độ VN-2000</button><button data-mode="wgs84">Toạ độ WGS-84</button><button data-mode="local">Toạ độ cục bộ (m)</button><button data-mode="scan">Dán / quét số liệu</button><button data-mode="image">Bản vẽ hình ảnh</button><button data-mode="draw">Từ Công cụ vẽ</button></div>' +
'  <div id="dt-pane-table">' +
'   <div class="dt-row" id="dt-projrow"><label class="dt-f">Tỉnh / TP (kinh tuyến trục)<select id="dt-prov"></select></label><label class="dt-f">KTT (độ)<input id="dt-cm" inputmode="decimal"></label><label class="dt-f">Múi chiếu<select id="dt-k0"><option value="0.9999">3° (k = 0,9999) - Hội nhập</option><option value="0.9996">6° (k = 0,9996)</option></select></label></div>' +
'   <p class="dt-hint" id="dt-srchint"><b>Lưu ý nguồn số liệu:</b> toạ độ trên giấy chứng nhận hoặc trích đo là toạ độ đo đạc (mm đến cm). Toạ độ lấy bằng cách chấm lên bản đồ hay ảnh vệ tinh (Google, GeoCAD...) thường có sai số thực tế lớn hơn nhiều (có thể từ vài chục cm đến vài mét) dù con số hiển thị có 3 chữ số thập phân, và sai số đó làm hướng lệch nhiều độ. Chỉ nên coi kết quả là chính xác khi toạ độ đầu vào là toạ độ đo đạc.</p>'  +
'   <p class="dt-hint" id="dt-projhint">Kinh tuyến trục theo tỉnh chỉ để tham khảo: luôn lấy đúng giá trị ghi trên giấy chứng nhận / bản đồ (ví dụ "KTT 108°30\'" = 108,5).</p>' +
'   <div class="dt-row" id="dt-localrow" hidden><label class="dt-f">Trục Bắc của bản vẽ lệch so với Bắc thật (độ, chiều kim đồng hồ)<input id="dt-ltheta" inputmode="decimal"></label></div>' +
'   <div class="dt-tablewrap"><table class="dt-pts"><thead><tr><th>Điểm</th><th id="dt-ha">X (Bắc)</th><th id="dt-hb">Y (Đông)</th><th></th></tr></thead><tbody id="dt-body"></tbody></table></div>' +
'   <div class="dt-row"><button class="dt-btn" data-act="addrow">+ Thêm điểm</button><span class="dt-hint">Nhập theo thứ tự đi vòng quanh ranh (thuận hoặc ngược chiều kim đồng hồ). Có thể dán nguyên bảng vào ô đầu tiên.</span></div>' +
'  </div>' +
'  <div id="dt-pane-scan" hidden>' +
'   <p class="dt-hint">Dán nội dung từ giấy chứng nhận, bảng toạ độ, file GeoCAD, hoặc tải ảnh/PDF để quét tự động. Số liệu sau khi quét luôn được đưa vào bảng để bạn kiểm tra lại.</p>' +
'   <textarea id="dt-paste" rows="7" placeholder="Ví dụ:\n1  1177495.586  415366.697\n2  1177496.282  415379.905\n... hoặc dán nguyên khối [GeoCAD - Điểm 1] ..."></textarea>' +
'   <div class="dt-row"><button class="dt-btn dt-primary" data-act="parse">Phân tích văn bản</button>' +
'    <label class="dt-btn dt-file">Tải ảnh / PDF / TXT<input type="file" id="dt-file" accept="image/*,.pdf,.txt,.csv,text/plain"></label>' +
'    <button class="dt-btn" data-act="ocr" id="dt-ocrbtn" disabled>Quét OCR ảnh đã tải</button><button class="dt-btn" data-act="toimage" id="dt-toimg" disabled>Dùng ảnh này để chấm điểm</button></div>' +
'   <div id="dt-scanstat" class="dt-hint"></div><canvas id="dt-scanprev" class="dt-prev" hidden></canvas>' +
'  </div>' +
'  <div id="dt-pane-image" hidden>' +
'   <p class="dt-hint">Dùng khi chỉ có bản vẽ theo tỷ lệ (ảnh chụp/scan). Bước 1: hiệu chuẩn tỷ lệ. Bước 2: chấm các đỉnh theo thứ tự. Bước 3 (tuỳ chọn): chỉ mũi tên Bắc trên bản vẽ. Độ chính xác phụ thuộc chất lượng ảnh, nên ưu tiên toạ độ VN-2000 nếu có.</p>' +
'   <div class="dt-row"><label class="dt-btn dt-file">Chọn ảnh bản vẽ<input type="file" id="dt-imgfile" accept="image/*,.pdf"></label>' +
'    <div class="dt-seg" id="dt-imgstep"><button data-step="scale">1 Hiệu chuẩn</button><button data-step="verts">2 Chấm đỉnh khu đất</button><button data-step="house">3 Chấm đỉnh nhà (nếu có)</button><button data-step="north">4 Chỉ hướng Bắc</button></div>' +
'    <label class="dt-f dt-sm">Phóng<input type="range" id="dt-zoom" min="0.2" max="3" step="0.05" value="1"></label></div>' +
'   <div class="dt-row"><label class="dt-f dt-sm">Khoảng cách thật giữa 2 điểm hiệu chuẩn (m)<input id="dt-calib" inputmode="decimal" placeholder="VD: 13.22"></label>' +
'    <span class="dt-or">hoặc</span><label class="dt-f dt-sm">Tỷ lệ bản vẽ 1:<input id="dt-ratio" inputmode="numeric" placeholder="500"></label><label class="dt-f dt-sm">Độ phân giải ảnh (dpi)<input id="dt-dpi" inputmode="numeric" placeholder="300"></label></div>' +
'   <div class="dt-canvaswrap"><canvas id="dt-cv"></canvas><div id="dt-cvhint" class="dt-cvhint">Chưa có ảnh. Hãy chọn ảnh bản vẽ.</div></div>' +
'   <div class="dt-row"><span id="dt-imgstat" class="dt-hint dt-grow"></span><button class="dt-btn" data-act="imgundo">Hoàn tác</button><button class="dt-btn" data-act="imgclear">Xoá điểm</button><button class="dt-btn dt-primary" data-act="imguse">Dùng các điểm này</button></div>' +
'  </div>' +
'  <div id="dt-pane-draw" hidden>' +
'   <p class="dt-hint">Nhận khu đất và nhà đã vẽ bằng <b>Công cụ vẽ</b>: toạ độ mét chính xác và hướng Bắc thật theo bản vẽ. Khi hai công cụ cùng nằm trong một trang, bản vẽ gửi từ Công cụ vẽ được nhận tự động.</p>' +
'   <div class="dt-row"><button class="dt-btn dt-primary" data-act="drawlast">Nhận bản vẽ gần nhất</button><label class="dt-btn dt-file">Mở tệp .dinhtam.json<input type="file" id="dt-drawfile" accept=".json,application/json"></label></div>' +
'   <textarea id="dt-drawpaste" rows="4" placeholder="Hoặc dán nội dung JSON bản vẽ vào đây"></textarea><div class="dt-row"><button class="dt-btn" data-act="drawparse">Nhận từ nội dung đã dán</button></div>' +
'  </div>' +
' </section>' +
' <section class="dt-card" id="dt-s2"><h3>2. Hình học và tâm khu đất</h3><div class="dt-row"><button class="dt-btn" data-act="todraw">Gửi sang Công cụ vẽ để vẽ chi tiết</button></div><div id="dt-geo" class="dt-empty">Nhập tối thiểu 3 điểm để xem kết quả.</div></section>' +
' <section class="dt-card" id="dt-s3"><h3>3. Mặt tiền và hướng đất</h3>' +
'  <div class="dt-grid2"><div><div class="dt-lab">Chọn cạnh mặt tiền (bấm vào cạnh trên hình hoặc chọn danh sách)</div><div id="dt-thumb" class="dt-thumbbox"></div>' +
'   <label class="dt-f">Cạnh mặt tiền<select id="dt-front"></select></label></div>' +
'   <div class="dt-opts"><label class="dt-f">Cách xác định hướng đất<select id="dt-dirmode"><option value="normal">Vuông góc mặt tiền (quy ước, khuyến nghị)</option><option value="axis">Theo trục G → M (tâm thửa đến tâm mặt tiền)</option><option value="door">Theo cửa chính (từ Công cụ vẽ)</option><option value="manual">Nhập tay hướng (Bắc thật)</option></select></label>' +
'    <p class="dt-hint" id="dt-doorhint" hidden></p>' +
'    <label class="dt-f" id="dt-manrow" hidden>Hướng nhập tay (độ, Bắc thật)<input id="dt-manual" inputmode="decimal"></label>' +
'    <label class="dt-f">Độ lệch từ D tại thửa (độ, dương = lệch Đông, âm = lệch Tây)<input id="dt-decl" inputmode="decimal"></label>' +
'    <div class="dt-hint" id="dt-declhint"></div>' +
'    <label class="dt-f">Mốc Bắc để chia cung / sơn<select id="dt-ref"><option value="true">Bắc thật</option><option value="mag">Bắc từ (la bàn)</option></select></label>' +
'    <label class="dt-f">Tâm hình học<select id="dt-center"><option value="area">Trọng tâm diện tích (khuyến nghị)</option><option value="vertex">Trung bình các đỉnh</option><option value="bbox">Tâm khung bao</option></select></label>' +
'    <label class="dt-f">Ngưỡng cảnh báo gần ranh sơn (độ)<input id="dt-warn" inputmode="decimal"></label></div></div>' +
'  <div id="dt-dir"></div></section>' +
' <section class="dt-card" id="dt-s4"><h3>4. Phân 8 cung và 24 sơn của khu đất</h3><div id="dt-sec" class="dt-empty">Chưa có kết quả.</div></section>' +
' <section class="dt-card" id="dt-sh"><h3>5. Nhà trong khu đất (khu đất lớn, nhà xây trên một phần)</h3>' +
'  <label class="dt-chk"><input type="checkbox" id="dt-henable"> Nhà chỉ chiếm một phần khu đất: thêm hình nhà để định tâm, hướng và phân cung riêng cho nhà</label>' +
'  <p class="dt-hint">Nếu nhà xây kín toàn bộ thửa thì không cần mục này. Khi bật, bản vẽ có thêm trang tổng thể "nhà trong khu đất" và bộ bản vẽ chi tiết của nhà.</p>' +
'  <div id="dt-hbody" hidden>' +
'   <div class="dt-tabs" id="dt-hmodes"><button data-hmode="rect">Chữ nhật theo khoảng lùi</button><button data-hmode="uv">Vẽ trực tiếp / bảng (u, v)</button><button data-hmode="trav">Cạnh + góc (đo tại chỗ)</button><button data-hmode="abs">Toạ độ cùng hệ khu đất</button><button data-hmode="image">Chấm trên bản vẽ ảnh</button></div>' +
'   <div id="dt-hp-rect"><p class="dt-hint" id="dt-hframe"></p><div class="dt-row">' +
'    <label class="dt-f dt-sm">Rộng nhà W (m)<input id="dt-hW" inputmode="decimal" placeholder="8"></label><label class="dt-f dt-sm">Sâu nhà D (m)<input id="dt-hD" inputmode="decimal" placeholder="12"></label>' +
'    <label class="dt-f dt-sm">Cách đầu mặt tiền L (m)<input id="dt-hL" inputmode="decimal" placeholder="3.5"></label><label class="dt-f dt-sm">Lùi trước F (m)<input id="dt-hF" inputmode="decimal" placeholder="5"></label>' +
'    <label class="dt-f dt-sm">Xoay nhà (độ, + theo chiều kim đồng hồ)<input id="dt-hrot" inputmode="decimal" placeholder="0"></label></div>' +
'    <p class="dt-hint">W đo dọc theo mặt tiền khu đất, D đo vào trong. L là khoảng từ gốc trục u tới cạnh bên của nhà; F là khoảng từ ranh mặt tiền tới mặt trước nhà. Các số này lấy từ bản vẽ thiết kế (khoảng lùi).</p></div>' +
'   <div id="dt-hp-uv" hidden><p class="dt-hint" id="dt-hframe2"></p>' +
'    <p class="dt-hint"><b>Cách nhanh nhất cho nhà đa giác:</b> bấm lên khung vẽ để đặt từng đỉnh (kéo để chỉnh), có bắt dính vào đỉnh/ranh khu đất, vuông góc hoặc song song mặt tiền và lưới. Mọi đỉnh tự ghi vào bảng (u, v) bên dưới, bạn sửa số cho đúng từng cm.</p>' +
'    <div class="dt-row"><label class="dt-chk"><input type="checkbox" id="dt-snpt"> Bắt dính đỉnh/ranh khu đất</label><label class="dt-chk"><input type="checkbox" id="dt-snor"> Bắt dính vuông góc/song song</label><label class="dt-chk"><input type="checkbox" id="dt-sngr"> Lưới</label><label class="dt-f dt-sm">Bước lưới (m)<input id="dt-gstep" inputmode="decimal"></label><label class="dt-f dt-sm">Phóng<input type="range" id="dt-hzoom" min="1" max="8" step="0.25" value="1"></label></div>' +
'    <div class="dt-canvaswrap" id="dt-hcvwrap"><canvas id="dt-hcv"></canvas></div>' +
'    <div class="dt-row"><span id="dt-hcvstat" class="dt-hint dt-grow"></span><button class="dt-btn" data-act="hundo">Hoàn tác điểm cuối</button><button class="dt-btn" data-act="hclear">Xoá hình nhà</button></div>' +
'    <div class="dt-tablewrap"><table class="dt-pts"><thead><tr><th>Điểm</th><th>u (m, dọc mặt tiền)</th><th>v (m, vào trong)</th><th></th></tr></thead><tbody id="dt-hbody-uv"></tbody></table></div><div class="dt-row"><button class="dt-btn" data-act="haddrow" data-t="uv">+ Thêm điểm</button></div></div>' +
'   <div id="dt-hp-trav" hidden><p class="dt-hint">Đo hoặc đọc từ bản vẽ thiết kế: xuất phát từ một góc nhà, đi vòng theo chu vi, nhập <b>chiều dài từng cạnh</b> và <b>góc trong tại cuối cạnh đó</b>. Cạnh cuối tự khép về điểm xuất phát (không cần nhập). Nhà có n đỉnh thì nhập n - 1 cạnh.</p>' +
'    <div class="dt-row"><label class="dt-f dt-sm">Điểm xuất phát u (m)<input id="dt-tu0" inputmode="decimal"></label><label class="dt-f dt-sm">Điểm xuất phát v (m)<input id="dt-tv0" inputmode="decimal"></label><label class="dt-f dt-sm">Hướng cạnh 1 so với mặt tiền (độ)<input id="dt-tang" inputmode="decimal"></label><label class="dt-f dt-sm">Chiều đi<select id="dt-tdir"><option value="cw">Thuận chiều kim đồng hồ</option><option value="ccw">Ngược chiều kim đồng hồ</option></select></label></div>' +
'    <p class="dt-hint">Hướng cạnh 1: 0° = song song mặt tiền khu đất, đi theo chiều từ gốc u sang đầu kia; số dương xoay theo chiều kim đồng hồ trên bản vẽ. Với chiều đi thuận kim đồng hồ và hướng 0°, cạnh 1 chạy dọc mặt tiền rồi rẽ vào trong khu đất.</p>' +
'    <div class="dt-tablewrap"><table class="dt-pts"><thead><tr><th>Cạnh</th><th>Dài (m)</th><th>Góc trong ở cuối cạnh (độ)</th><th></th></tr></thead><tbody id="dt-hbody-trav"></tbody></table></div><div class="dt-row"><button class="dt-btn" data-act="haddrow" data-t="trav">+ Thêm cạnh</button></div><div id="dt-htrav-out"></div></div>' +
'   <div id="dt-hp-abs" hidden><p class="dt-hint">Nhập toạ độ các đỉnh nhà cùng hệ và cùng loại toạ độ với khu đất (đang chọn ở mục 1).</p><div class="dt-tablewrap"><table class="dt-pts"><thead><tr><th>Điểm</th><th id="dt-hha"></th><th id="dt-hhb"></th><th></th></tr></thead><tbody id="dt-hbody-abs"></tbody></table></div><div class="dt-row"><button class="dt-btn" data-act="haddrow" data-t="abs">+ Thêm điểm</button></div></div>' +
'   <div id="dt-hp-image" hidden><p class="dt-hint">Dùng công cụ ở mục 1 (tab "Bản vẽ hình ảnh"): hiệu chuẩn tỷ lệ, chấm đỉnh khu đất, chuyển sang bước "3 Chấm đỉnh nhà", chấm các đỉnh nhà rồi bấm "Dùng các điểm này". Nhà và khu đất sẽ cùng một hệ toạ độ.</p><button class="dt-btn" data-act="gotoimage">Mở công cụ chấm điểm trên ảnh</button></div>' +
'   <div id="dt-hmsg"></div>' +
'   <div class="dt-grid2" style="margin-top:12px"><div><div class="dt-lab">Chọn cạnh mặt tiền của nhà (bấm vào cạnh trên hình)</div><div id="dt-hthumb" class="dt-thumbbox"></div><label class="dt-f">Mặt tiền của nhà<select id="dt-hfront"></select></label></div>' +
'    <div class="dt-opts"><label class="dt-f">Cách xác định hướng nhà<select id="dt-hdirmode"><option value="normal">Vuông góc mặt tiền nhà (quy ước)</option><option value="axis">Theo trục Gn → Mn</option><option value="door">Theo cửa chính (từ Công cụ vẽ)</option><option value="manual">Nhập tay hướng (Bắc thật)</option></select></label>' +
'     <p class="dt-hint" id="dt-hdoorhint" hidden></p>' +
'     <label class="dt-f" id="dt-hmanrow" hidden>Hướng nhập tay (độ, Bắc thật)<input id="dt-hmanual" inputmode="decimal"></label>' +
'     <p class="dt-hint">Độ lệch từ D, mốc Bắc chia cung, loại tâm và ngưỡng cảnh báo dùng chung với khu đất (mục 3). Chế độ "Tự động" chọn cạnh nhà quay cùng hướng với mặt tiền khu đất.</p></div></div>' +
'   <div id="dt-hrel"></div><h4>Hình học của nhà</h4><div id="dt-hgeo"></div><h4>Hướng của nhà</h4><div id="dt-hdir"></div><h4>Phân cung của nhà (từ tâm nhà Gn)</h4><div id="dt-hsec"></div>' +
'  </div></section>' +
' <section class="dt-card" id="dt-s5"><h3>6. Bản vẽ (A4, tỷ lệ chính xác)</h3>' +
'  <div class="dt-row"><label class="dt-f dt-sm">Đơn vị nhãn cạnh<select id="dt-unit"><option value="cm">cm</option><option value="m">m</option></select></label>' +
'   <label class="dt-f dt-sm">Tỷ lệ<select id="dt-smode"><option value="auto">Tự chọn tỷ lệ chuẩn lớn nhất vừa khổ giấy</option><option value="manual">Nhập tay</option></select></label><label class="dt-f dt-sm" id="dt-nrow" hidden>1 :<input id="dt-sn" inputmode="numeric" placeholder="250"></label>' +
'   <label class="dt-chk"><input type="checkbox" id="dt-d24"> Vẽ nét đứt 24 sơn</label><label class="dt-chk"><input type="checkbox" id="dt-l24"> Ghi độ dài đoạn 24 sơn trên hình</label></div>' +
'  <div class="dt-tabs" id="dt-ptabs"></div><div id="dt-preview" class="dt-preview"></div>' +
'  <div class="dt-row"><button class="dt-btn dt-primary" data-act="pdfall">Tải PDF tất cả bản vẽ</button><button class="dt-btn" data-act="pdfone">Tải PDF trang đang xem</button><button class="dt-btn" data-act="print">In (hộp thoại in)</button><button class="dt-btn" data-act="svg">Tải SVG trang đang xem</button><button class="dt-btn" data-act="json">Tải JSON kết quả</button><button class="dt-btn" data-act="csv">Tải CSV các đoạn</button></div>' +
'  <div id="dt-pdfstat" class="dt-hint" aria-live="polite"></div><p class="dt-hint">Nút "Tải PDF" tạo trực tiếp file PDF chỉ gồm các bản vẽ (khổ A4, ảnh 250 dpi, không kèm trang web). Khi in file PDF, chọn khổ A4 và tỷ lệ 100% (không chọn "Fit to page"); dùng thước 100 mm ở chân mỗi trang để kiểm tra tỷ lệ. Nút "In" chỉ dành cho máy tính có hộp thoại in.</p></section>' +
' <section class="dt-card" id="dt-s6"><h3>7. Liên kết với tab Lạc Việt và Huyền Không Phi Tinh</h3><div id="dt-link"></div></section>' +
'</div>';

var CSS = '' +
'.dt-root [hidden]{display:none!important}' +
'.dt-root{--ink:#14202e;--mut:#5b6673;--line:#d5dbe2;--paper:#f3f5f8;--card:#fff;--blue:#1f5fa8;--red:#c8452b;--brass:#a9791c;--teal:#0d6b57;font:14px/1.5 "Segoe UI","SF Pro Text",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--ink);background:var(--paper);padding:14px;font-variant-numeric:tabular-nums;max-width:1080px;margin:0 auto}' +
'.dt-root *{box-sizing:border-box}.dt-root h2{margin:0;font-size:22px;letter-spacing:-.01em}.dt-root h3{margin:0 0 10px;font-size:16px;color:var(--blue)}.dt-root p{margin:2px 0 0;color:var(--mut)}' +
'.dt-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:8px}.dt-head-btn{display:flex;gap:6px}' +
'.dt-nav{display:flex;gap:6px;overflow:auto;position:sticky;top:0;background:var(--paper);padding:6px 0;z-index:5;border-bottom:1px solid var(--line);margin-bottom:10px}.dt-nav a{white-space:nowrap;padding:5px 10px;border:1px solid var(--line);border-radius:6px;color:var(--ink);text-decoration:none;background:#fff;font-size:13px}.dt-nav a:hover{border-color:var(--blue);color:var(--blue)}' +
'.dt-card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:12px}' +
'.dt-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin:8px 0}.dt-grow{flex:1 1 220px}.dt-f{display:flex;flex-direction:column;gap:3px;font-size:12.5px;color:var(--mut);min-width:140px}.dt-sm{min-width:110px}.dt-or{color:var(--mut);padding-bottom:8px}' +
'.dt-root input[type=text],.dt-root input:not([type]),.dt-root select,.dt-root textarea{font:inherit;color:var(--ink);padding:7px 9px;border:1px solid #b9c2cc;border-radius:6px;background:#fff;width:100%}.dt-root input:focus,.dt-root select:focus,.dt-root textarea:focus,.dt-root button:focus-visible{outline:2px solid var(--blue);outline-offset:1px}' +
'.dt-root textarea{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}' +
'.dt-btn{font:inherit;font-size:13px;padding:7px 12px;border:1px solid #b9c2cc;border-radius:6px;background:#fff;color:var(--ink);cursor:pointer;display:inline-block}.dt-btn:hover{border-color:var(--blue);color:var(--blue)}.dt-primary{background:var(--blue);border-color:var(--blue);color:#fff}.dt-primary:hover{background:#174c87;color:#fff}.dt-file input{display:none}' +
'.dt-tabs{display:flex;gap:0;flex-wrap:wrap;border-bottom:2px solid var(--line);margin:10px 0}.dt-tabs button{font:inherit;font-size:13px;padding:8px 12px;border:0;background:none;color:var(--mut);cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px}.dt-tabs button.on{color:var(--blue);border-bottom-color:var(--blue);font-weight:600}' +
'.dt-seg{display:flex}.dt-seg button{font:inherit;font-size:12.5px;padding:6px 10px;border:1px solid #b9c2cc;background:#fff;cursor:pointer;margin-left:-1px}.dt-seg button.on{background:var(--blue);color:#fff;border-color:var(--blue)}' +
'.dt-tablewrap{overflow:auto}.dt-pts{border-collapse:collapse;width:100%;min-width:420px}.dt-pts th{font-size:12px;color:var(--mut);text-align:left;font-weight:600;padding:4px 6px}.dt-pts td{padding:2px 4px}.dt-pts td:first-child{width:90px}.dt-pts input{padding:6px 8px}.dt-del{border:0;background:none;color:var(--red);cursor:pointer;font-size:18px;line-height:1}' +
'.dt-hint{font-size:12.5px;color:var(--mut)}.dt-msg{border-left:4px solid var(--red);background:#fdf1ee;padding:8px 12px;border-radius:4px;margin:8px 0;font-size:13px}.dt-msg.ok{border-color:var(--teal);background:#e8f5f0}' +
'.dt-prev{max-width:100%;border:1px solid var(--line);margin-top:8px}.dt-canvaswrap{position:relative;overflow:auto;max-height:560px;border:1px solid var(--line);background:#e8ecf0;border-radius:6px}.dt-canvaswrap canvas{display:block;touch-action:none;cursor:crosshair}.dt-cvhint{position:absolute;left:12px;top:12px;font-size:13px;color:var(--mut);pointer-events:none}' +
'.dt-empty{color:var(--mut)}.dt-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px}.dt-kpi{border:1px solid var(--line);border-radius:8px;padding:10px;background:#fafbfc}.dt-kpi b{display:block;font-size:19px;letter-spacing:-.01em}.dt-kpi span{font-size:12px;color:var(--mut)}' +
'.dt-big{font-size:38px;font-weight:700;color:var(--red);letter-spacing:-.02em;line-height:1.05}' +
'.dt-grid2{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:16px}.dt-opts{display:grid;gap:8px;align-content:start}@media(max-width:720px){.dt-grid2{grid-template-columns:1fr}}' +
'.dt-thumbbox{border:1px solid var(--line);border-radius:6px;background:#fafbfc;padding:6px;margin-bottom:8px}.dt-thumb{width:100%;height:auto;max-height:300px}.dt-lab{font-size:12.5px;color:var(--mut);margin-bottom:4px}' +
'.dt-t{border-collapse:collapse;width:100%;font-size:13px;margin:6px 0 12px}.dt-t th{background:#f0f3f6;text-align:left;padding:5px 8px;font-size:12px;color:var(--mut);border-bottom:1px solid var(--line)}.dt-t td{padding:4px 8px;border-bottom:1px solid #eef1f4}.dt-t td.n,.dt-t th.n{text-align:right}.dt-t tr.hot td{background:#fdf1ee;font-weight:600}' +
'.dt-wrap{overflow:auto}.dt-kv{display:grid;grid-template-columns:auto 1fr;gap:3px 14px;font-size:13.5px;margin:8px 0}.dt-kv dt{color:var(--mut)}.dt-kv dd{margin:0;font-weight:600}' +
'.dt-warn{color:var(--red)}.dt-flag{display:inline-block;background:#fbf0d8;color:#7a5410;border:1px solid #e5c97f;border-radius:4px;padding:1px 6px;font-size:12px;margin-left:6px}.dt-warnbox{border:1px solid #e5c97f;background:#fdf7e7;border-radius:6px;padding:8px 10px;margin:8px 0;font-size:13px}' +
'.dt-preview{border:1px solid var(--line);background:#8a929b;padding:10px;border-radius:6px;overflow:auto;max-height:760px}.dt-preview svg{width:100%;max-width:640px;height:auto;display:block;margin:0 auto;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.3)}' +
'.dt-pre{background:#101c2b;color:#d7e3f1;border-radius:6px;padding:10px;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;overflow:auto;max-height:260px;white-space:pre}' +
'@media(max-width:560px){.dt-root{padding:8px}.dt-card{padding:10px}.dt-big{font-size:32px}}';

function $(id) { return root.querySelector('#' + id); }
function msg(t, ok) { var m = $('dt-msg'); if (!t) { m.hidden = true; return; } m.hidden = false; m.className = 'dt-msg' + (ok ? ' ok' : ''); m.textContent = t; }

// ---------- bảng điểm ----------
function modeLabels() {
  if (tmode() === 'wgs84') return ['Vĩ độ (°)', 'Kinh độ (°)'];
  if (tmode() === 'local') return ['x - Đông (m)', 'y - Bắc (m)'];
  return ['X - Bắc (m)', 'Y - Đông (m)'];
}
function tmode() { return (S.mode === 'vn2000' || S.mode === 'wgs84' || S.mode === 'local') ? S.mode : (S.tm || 'vn2000'); }
function rows() { return S.data[tmode()]; }
function renderTable() {
  var m = S.mode; if (m === 'scan' || m === 'image' || m === 'draw') return;
  var l = modeLabels(); $('dt-ha').textContent = l[0]; $('dt-hb').textContent = l[1];
  var d = S.data[m], h = '';
  d.forEach(function (r, i) {
    h += '<tr data-i="' + i + '"><td><input data-c="0" value="' + esc(r[0]) + '" aria-label="Tên điểm"></td><td><input data-c="1" inputmode="decimal" value="' + esc(r[1]) + '" aria-label="' + esc(l[0]) + '"></td><td><input data-c="2" inputmode="decimal" value="' + esc(r[2]) + '" aria-label="' + esc(l[1]) + '"></td><td><button class="dt-del" data-del="' + i + '" title="Xoá điểm" aria-label="Xoá điểm ' + esc(r[0]) + '">×</button></td></tr>';
  });
  $('dt-body').innerHTML = h;
  $('dt-projrow').hidden = m === 'local'; $('dt-projhint').hidden = m === 'local'; $('dt-localrow').hidden = m !== 'local';
}
function syncForm() {
  $('dt-name').value = S.name; $('dt-cm').value = S.cm; $('dt-k0').value = S.k0; $('dt-ltheta').value = S.localTheta; $('dt-decl').value = S.decl; $('dt-warn').value = S.warnDeg;
  $('dt-dirmode').value = S.dirMode; $('dt-manual').value = S.manualAz; $('dt-manrow').hidden = S.dirMode !== 'manual'; $('dt-ref').value = S.ref; $('dt-center').value = S.center;
  $('dt-unit').value = S.unit; $('dt-smode').value = S.scaleMode; $('dt-sn').value = S.scaleN; $('dt-nrow').hidden = S.scaleMode !== 'manual'; $('dt-d24').checked = !!S.draw24; $('dt-l24').checked = !!S.label24;
  syncProv();
  var tabs = $('dt-modes').querySelectorAll('button'); for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].dataset.mode === S.mode);
  if (S.mode === 'vn2000' || S.mode === 'wgs84' || S.mode === 'local') S.tm = S.mode;
  var m = S.mode; $('dt-pane-table').hidden = (m === 'scan' || m === 'image' || m === 'draw'); $('dt-pane-draw').hidden = m !== 'draw'; $('dt-pane-scan').hidden = m !== 'scan'; $('dt-pane-image').hidden = m !== 'image';
  updateDeclHint();
}
function syncProv() {
  var m = []; C.PROVINCES.forEach(function (p, i) { if (Math.abs(p[1] - C.parseNum(S.cm)) < 1e-9) m.push(i); });
  var pick = 'custom'; if (m.length === 1) pick = String(m[0]); else if (m.length > 1 && S.prov !== '' && m.indexOf(parseInt(S.prov, 10)) >= 0) pick = String(S.prov);
  $('dt-prov').value = pick;
}
function updateDeclHint() {
  $('dt-declhint').innerHTML = (S.declSource === 'estimate' ? '<span class="dt-flag">Ước tính, chưa xác nhận</span> ' : '<span class="dt-flag" style="background:#e8f5f0;border-color:#9fd3c1;color:#0d6b57">Do bạn nhập</span> ') +
    'Độ lệch từ thay đổi theo vị trí và năm. Chốt giá trị tại <a href="https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml#declination" target="_blank" rel="noopener">máy tính độ lệch từ của NOAA (WMM)</a> bằng toạ độ G rồi nhập vào đây. Giá trị mặc định -0,5° chỉ là ước tính chung cho Nam Bộ.';
}

// ---------- tính toán ----------
function input() {
  var d = S.data[tmode()], mode = tmode();
  return { name: S.name, mode: mode, cm: S.cm, k0: S.k0, localTheta: S.localTheta, front: S.front, dirMode: (S.dirMode === 'door' ? (DOORS.lot != null ? 'manual' : 'normal') : S.dirMode), manualAz: (S.dirMode === 'door' && DOORS.lot != null ? String(DOORS.lot) : S.manualAz), dirSrc: (S.dirMode === 'door' && DOORS.lot != null ? 'door' : ''), decl: S.decl, declSource: S.declSource, ref: S.ref, center: S.center, warnDeg: S.warnDeg, sigma: (tmode() === 'local' ? S.localSigma : ''),
    pts: d.map(function (r) { return { label: r[0], a: r[1], b: r[2] }; }) };
}
function schedule() { clearTimeout(timer); timer = setTimeout(recompute, 140); save(); }
function lotFrame() {
  if (!R || !R.ok) return null; var n = R.n, pa = R.verts[R.front], pb = R.verts[(R.front + 1) % n], L = Math.hypot(pb.E - pa.E, pb.N - pa.N), ue = (pb.E - pa.E) / L, un = (pb.N - pa.N) / L;
  return { pa: pa, ue: ue, un: un, ve: R.orient > 0 ? -un : un, vn: R.orient > 0 ? ue : -ue, L: L, from: pa.label, to: pb.label };
}
function uvGrid(f, u, v) { return [f.pa.E + u * f.ue + v * f.ve, f.pa.N + u * f.un + v * f.vn]; }
function hdm(h) { return h.dirMode === 'door' ? (DOORS.house != null ? 'manual' : 'normal') : h.dirMode; }
function hma(h) { return h.dirMode === 'door' && DOORS.house != null ? String(DOORS.house) : h.manualAz; }
function hsrc(h) { return h.dirMode === 'door' && DOORS.house != null ? 'door' : ''; }
function houseInput() {
  var h = S.house, base = input(), f = lotFrame(); if (!f) return { error: 'Cần nhập xong khu đất (mục 1) trước.' };
  var geo = base.mode !== 'local', pts = [], mode = base.mode;
  if (h.mode === 'abs') { return Object.assign({}, base, { isHouse: true, name: 'Nhà - ' + (S.name || ''), pts: h.abs[tmode()].map(function (r) { return { label: r[0], a: r[1], b: r[2] }; }), front: 0, dirMode: hdm(h), manualAz: hma(h), dirSrc: hsrc(h) }); }
  var uv = []; TRAV = null;
  if (h.mode === 'trav') {
    var tv = h.trav, u0 = C.parseNum(tv.u0), v0 = C.parseNum(tv.v0), a0 = C.parseNum(tv.ang), sg = tv.dir === 'ccw' ? -1 : 1; if (!isFinite(a0)) a0 = 0;
    var rws = tv.rows.map(function (r) { return [C.parseNum(r[0]), C.parseNum(r[1])]; }); while (rws.length && !isFinite(rws[rws.length - 1][0])) rws.pop();
    if (!isFinite(u0) || !isFinite(v0)) return { error: 'Nhập điểm xuất phát (u, v) của góc nhà đầu tiên.' };
    if (rws.length < 2 || rws.some(function (r) { return !(r[0] > 0); })) return { error: 'Nhập tối thiểu 2 cạnh có chiều dài hợp lệ (cạnh cuối tự khép).' };
    for (var q = 0; q < rws.length - 1; q++) if (!isFinite(rws[q][1])) return { error: 'Nhập góc trong ở cuối cạnh ' + (q + 1) + '.' };
    var p0 = uvGrid(f, u0, v0), al = Math.atan2(f.ue, f.un) * 180 / Math.PI + a0, P = [p0], hd = [al];
    for (var k = 0; k < rws.length; k++) { var pr = P[P.length - 1], rr = al * Math.PI / 180; P.push([pr[0] + rws[k][0] * Math.sin(rr), pr[1] + rws[k][0] * Math.cos(rr)]); if (k < rws.length - 1) { al += sg * (180 - rws[k][1]); hd.push(al); } }
    var last = P[P.length - 1], clo = Math.hypot(P[0][0] - last[0], P[0][1] - last[1]), ch = Math.atan2(P[0][0] - last[0], P[0][1] - last[1]) * 180 / Math.PI;
    var angM = 180 - sg * C.n180(ch - hd[hd.length - 1]), ang0 = 180 - sg * C.n180(hd[0] - ch);
    TRAV = { close: clo, angM: angM, ang0: ang0, devM: isFinite(rws[rws.length - 1][1]) ? rws[rws.length - 1][1] - angM : null, n: P.length };
    if (clo < 1e-6) return { error: 'Cạnh khép có chiều dài 0: các cạnh và góc đã khép kín sẵn, hãy bỏ bớt cạnh cuối.' };
    P.forEach(function (pp, i) { uv.push({ label: 'N' + (i + 1), E: pp[0], N: pp[1] }); });
  } else if (h.mode === 'rect') {
    var W = C.parseNum(h.rect.W), D = C.parseNum(h.rect.D), L = C.parseNum(h.rect.L), F = C.parseNum(h.rect.F), rot = C.parseNum(h.rect.rot);
    if (!(W > 0 && D > 0 && isFinite(L) && isFinite(F))) return { error: 'Nhập đủ rộng W, sâu D, khoảng cách L và lùi trước F (mét).' };
    if (!isFinite(rot)) rot = 0;
    var cu = L + W / 2, cv = F + D / 2, ce = uvGrid(f, cu, cv), r = rot * Math.PI / 180;
    [[L, F], [L + W, F], [L + W, F + D], [L, F + D]].forEach(function (p, i) {
      var du = p[0] - cu, dv = p[1] - cv, we = du * f.ue + dv * f.ve, wn = du * f.un + dv * f.vn;
      uv.push({ label: 'N' + (i + 1), E: ce[0] + we * Math.cos(r) + wn * Math.sin(r), N: ce[1] - we * Math.sin(r) + wn * Math.cos(r) });
    });
  } else {
    h.uv.forEach(function (rw, i) { var u = C.parseNum(rw[1]), v = C.parseNum(rw[2]); if (isFinite(u) && isFinite(v)) { var g = uvGrid(f, u, v); uv.push({ label: rw[0] || ('N' + (i + 1)), E: g[0], N: g[1] }); } });
    if (uv.length < 3) return { error: 'Nhập tối thiểu 3 điểm (u, v) của nhà.' };
  }
  pts = uv.map(function (p) { return { label: p.label, a: geo ? p.N : p.E, b: geo ? p.E : p.N }; });
  return Object.assign({}, base, { isHouse: true, name: 'Nhà - ' + (S.name || ''), mode: geo ? 'vn2000' : 'local', pts: pts, front: 0, dirMode: hdm(h), manualAz: hma(h), dirSrc: hsrc(h) });
}
function computeHouse() {
  H = null; REL = null; if (!S.house.enabled || !R || !R.ok) return null;
  var hi = houseInput(); if (hi.error) return hi.error;
  var h = C.computeAll(hi); if (!h.ok) return h.error;
  var fr = S.house.front;
  if (fr === 'auto' || fr === '' || fr == null) {
    var best = 0, bd = 999; h.edges.forEach(function (e, i) { var dd = Math.abs(C.n180(e.normTrue - R.dir.true)); if (dd < bd) { bd = dd; best = i; } });
    hi.front = best; if (best !== 0) h = C.computeAll(hi);
  } else { hi.front = Math.min(parseInt(fr, 10) || 0, h.n - 1); h = C.computeAll(hi); }
  H = h; REL = C.relate(R, H); return null;
}
function doorHints() {
  var a = $('dt-doorhint'), b = $('dt-hdoorhint'); if (a) { a.hidden = S.dirMode !== 'door'; a.textContent = DOORS.lot != null ? 'Hướng cửa chính của khu đất từ Công cụ vẽ: ' + fnum(DOORS.lot, 2) + '° (Bắc thật).' : 'Chưa có cửa chính của khu đất từ Công cụ vẽ: đang dùng hướng vuông góc mặt tiền.'; }
  if (b) { b.hidden = S.house.dirMode !== 'door'; b.textContent = DOORS.house != null ? 'Hướng cửa chính của nhà từ Công cụ vẽ: ' + fnum(DOORS.house, 2) + '° (Bắc thật).' : 'Chưa có cửa chính của nhà từ Công cụ vẽ: đang dùng hướng vuông góc mặt tiền nhà.'; }
}
function recompute() {
  doorHints();
  R = C.computeAll(input());
  if (R.front !== undefined && S.front >= R.n) S.front = 0;
  var herr = computeHouse();
  renderGeo($('dt-geo'), R); renderFront(); renderDir($('dt-dir'), R); renderSec($('dt-sec'), R); renderHouse(herr); renderPages(); renderLink(); publish();
}
function renderHouse(err) {
  var on = S.house.enabled; $('dt-hbody').hidden = !on; $('dt-henable').checked = on; if (!on) return;
  var f = lotFrame(), hint = f ? 'Gốc (u = 0, v = 0) đặt tại điểm ' + esc(f.from) + '; trục u chạy dọc mặt tiền khu đất từ ' + esc(f.from) + ' đến ' + esc(f.to) + ' (dài ' + fnum(f.L * 100, 1) + ' cm); trục v đi vào trong khu đất, vuông góc mặt tiền. Mặt tiền khu đất đổi ở mục 3.' : 'Cần nhập xong khu đất để có hệ trục mặt tiền.';
  $('dt-hframe').innerHTML = hint; $('dt-hframe2').innerHTML = hint;
  var tabs = $('dt-hmodes').querySelectorAll('button'); for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].dataset.hmode === S.house.mode);
  ['rect', 'uv', 'trav', 'abs', 'image'].forEach(function (m) { $('dt-hp-' + m).hidden = S.house.mode !== m; });
  var to = $('dt-htrav-out'); to.innerHTML = (S.house.mode === 'trav' && TRAV) ? '<div class="dt-warnbox" style="background:#eef6fb;border-color:#a9c8e4">Cạnh khép dài <b>' + fnum(TRAV.close * 100, 1) + ' cm</b>. Góc trong tại ' + 'N' + TRAV.n + ': <b>' + fnum(TRAV.angM, 2) + '°</b>; tại N1: <b>' + fnum(TRAV.ang0, 2) + '°</b>.' + (TRAV.devM != null ? ' Bạn nhập góc cuối ' + fnum(TRAV.angM + TRAV.devM, 2) + '°, lệch ' + fnum(TRAV.devM, 2) + '° so với tính được' + (Math.abs(TRAV.devM) > 0.5 ? ' (nên kiểm tra lại số đo).' : ' (khớp).') : ' Hãy đối chiếu với kích thước trên bản vẽ thiết kế.') + '</div>' : '';
  if (S.house.mode === 'uv') hcDraw();
  var hm = $('dt-hmsg'); hm.innerHTML = err ? '<div class="dt-warnbox">' + esc(err) + '</div>' : '';
  var sel = $('dt-hfront'), o = '<option value="auto">Tự động (cạnh hướng gần nhất với hướng khu đất)</option>';
  if (H && H.ok) H.edges.forEach(function (e, k) { o += '<option value="' + k + '">Cạnh ' + esc(e.from) + ' – ' + esc(e.to) + ' (' + fnum(e.len * 100, 1) + ' cm)</option>'; });
  sel.innerHTML = o; sel.value = String(S.house.front);
  $('dt-hdirmode').value = S.house.dirMode; $('dt-hmanrow').hidden = S.house.dirMode !== 'manual'; $('dt-hmanual').value = S.house.manualAz;
  $('dt-hthumb').innerHTML = H && H.ok ? Dw.thumb(H, H.front) : '<div class="dt-empty">Chưa có hình nhà.</div>';
  if (!(H && H.ok)) { $('dt-hrel').innerHTML = ''; ['dt-hgeo', 'dt-hdir', 'dt-hsec'].forEach(function (k) { $(k).innerHTML = ''; }); return; }
  renderRel(); renderGeo($('dt-hgeo'), H); renderDir($('dt-hdir'), H); renderSec($('dt-hsec'), H);
}
function renderRel() {
  var el = $('dt-hrel'), g = R.mode !== 'local', x = '';
  REL.warn.concat(H.warn || []).forEach(function (w) { x += '<div class="dt-warnbox">⚠ ' + esc(w) + '</div>'; });
  x += '<div class="dt-cards"><div class="dt-kpi"><b>' + fnum(H.area, 2) + ' m²</b><span>Diện tích nhà = ' + fnum(REL.areaPct, 1) + '% khu đất</span></div><div class="dt-kpi"><b>' + fnum(H.dir.true, 2) + '°</b><span>Hướng nhà (Bắc thật), sơn ' + esc(H.dir.hInfoTrue.sonName) + '</span></div><div class="dt-kpi"><b>' + (REL.dirDiff >= 0 ? '+' : '') + fnum(REL.dirDiff, 2) + '°</b><span>Chênh với hướng đất (' + fnum(R.dir.true, 2) + '°)</span></div><div class="dt-kpi"><b>' + fnum(REL.dist * 100, 1) + ' cm</b><span>Tâm nhà Gn cách tâm khu đất G, phương vị ' + fnum(REL.az, 1) + '°</span></div></div>';
  x += '<p>Tâm nhà Gn nằm trong cung <b>' + esc(C.CUNG8[REL.gInfo.cung].dir) + ' (' + esc(C.CUNG8[REL.gInfo.cung].que) + ')</b>, sơn <b>' + esc(REL.gInfo.sonName) + '</b> của khu đất (tính từ G).</p>';
  x += '<h4>Khoảng lùi tối thiểu từ nhà đến từng ranh khu đất</h4>' + tbl([['Ranh'], ['Điểm nhà gần nhất'], ['Khoảng lùi (cm)', 1], ['Khoảng lùi (m)', 1]], REL.setbacks.map(function (b) { return tr([[esc(b.from + '–' + b.to)], [esc(b.hv)], [fnum(b.d * 100, 1), 1], [fnum(b.d, 3), 1]]); }).join(''));
  x += '<h4>Phân bố diện tích nhà theo 8 cung của khu đất</h4>' + tbl([['Cung (quái)'], ['Diện tích nhà (m²)', 1], ['% diện tích nhà', 1]], R.cung.map(function (c, i) { return tr([[esc(c.name + ' (' + c.que + ')')], [fnum(REL.cungShare[i], 2), 1], [fnum(REL.cungShare[i] / H.area * 100, 1), 1]], REL.cungShare[i] === Math.max.apply(0, REL.cungShare)); }).join(''));
  x += '<h4>Toạ độ các đỉnh nhà</h4>' + tbl([['Điểm'], [g ? 'X - Bắc (m)' : 'x (m)', 1], [g ? 'Y - Đông (m)' : 'y (m)', 1], ['Đông so với G (cm)', 1], ['Bắc so với G (cm)', 1]],
    H.verts.map(function (v, i) { return tr([[esc(v.label)], [fnum(g ? v.N : v.E, 3), 1], [fnum(g ? v.E : v.N, 3), 1], [fnum(REL.Ht[i][0] * 100, 1), 1], [fnum(REL.Ht[i][1] * 100, 1), 1]]); }).join('') + tr([['<b>Gn (tâm nhà)</b>'], [fnum(g ? H.G.N : H.G.E, 3), 1], [fnum(g ? H.G.E : H.G.N, 3), 1], [fnum(REL.Gh[0] * 100, 1), 1], [fnum(REL.Gh[1] * 100, 1), 1]], true));
  el.innerHTML = x;
}
function renderHTables() {
  function draw(id, arr, la, lb, t) {
    var h = ''; arr.forEach(function (r, i) { h += '<tr data-i="' + i + '"><td><input data-ht="' + t + '" data-c="0" value="' + esc(r[0]) + '" aria-label="Tên điểm nhà"></td><td><input data-ht="' + t + '" data-c="1" inputmode="decimal" value="' + esc(r[1]) + '" aria-label="' + esc(la) + '"></td><td><input data-ht="' + t + '" data-c="2" inputmode="decimal" value="' + esc(r[2]) + '" aria-label="' + esc(lb) + '"></td><td><button class="dt-del" data-hdel="' + i + '" data-t="' + t + '" aria-label="Xoá điểm nhà">×</button></td></tr>'; });
    $(id).innerHTML = h;
  }
  (function () { var h = ''; S.house.trav.rows.forEach(function (r, i) { h += '<tr data-i="' + i + '"><td>Cạnh ' + (i + 1) + '</td><td><input data-ht="trav" data-c="0" inputmode="decimal" value="' + esc(r[0]) + '" aria-label="Dài cạnh ' + (i + 1) + '"></td><td><input data-ht="trav" data-c="1" inputmode="decimal" value="' + esc(r[1]) + '" aria-label="Góc trong cuối cạnh ' + (i + 1) + '"></td><td><button class="dt-del" data-hdel="' + i + '" data-t="trav" aria-label="Xoá cạnh">×</button></td></tr>'; }); $('dt-hbody-trav').innerHTML = h; })();
  var l = modeLabels(); draw('dt-hbody-uv', S.house.uv, 'u (m)', 'v (m)', 'uv'); draw('dt-hbody-abs', S.house.abs[tmode()], l[0], l[1], 'abs');
  $('dt-hha').textContent = l[0]; $('dt-hhb').textContent = l[1];
}
function hasData() { return rows().filter(function (r) { return r[1] !== '' && r[2] !== ''; }).length > 0; }

function tbl(head, body, cls) { return '<div class="dt-wrap"><table class="dt-t ' + (cls || '') + '"><thead><tr>' + head.map(function (h) { return '<th' + (h[1] ? ' class="n"' : '') + '>' + h[0] + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>'; }
function tr(cells, hot) { return '<tr' + (hot ? ' class="hot"' : '') + '>' + cells.map(function (c) { return '<td' + (c[1] ? ' class="n"' : '') + '>' + c[0] + '</td>'; }).join('') + '</tr>'; }
function warnHtml(R) { return R.warn && R.warn.length ? R.warn.map(function (w) { return '<div class="dt-warnbox">⚠ ' + esc(w) + '</div>'; }).join('') : ''; }

function renderGeo(el, R) {
  if (!R.ok) { el.className = hasData() ? 'dt-msg' : 'dt-empty'; el.textContent = R.error || 'Nhập tối thiểu 3 điểm để xem kết quả.'; return; }
  el.className = '';
  var h = warnHtml(R);
  h += '<div class="dt-cards"><div class="dt-kpi"><b>' + fnum(R.area, 2) + ' m²</b><span>Diện tích (' + fnum(R.area * 10000, 0) + ' cm²)</span></div><div class="dt-kpi"><b>' + fnum(R.perimeter * 100, 1) + ' cm</b><span>Chu vi (' + fnum(R.perimeter, 3) + ' m)</span></div><div class="dt-kpi"><b>' + R.n + ' đỉnh</b><span>' + (R.orient > 0 ? 'Đi ngược chiều kim đồng hồ' : 'Đi thuận chiều kim đồng hồ') + '</span></div></div>';
  h += '<dl class="dt-kv"><dt>Tâm hình học G (' + (R.centerMode === 'area' ? 'trọng tâm diện tích' : R.centerMode === 'vertex' ? 'trung bình các đỉnh' : 'tâm khung bao') + ')</dt><dd>' + (R.mode === 'local' ? 'x = ' + fnum(R.G.E, 4) + ' m; y = ' + fnum(R.G.N, 4) + ' m' : 'X = ' + fnum(R.G.N, 3) + '; Y = ' + fnum(R.G.E, 3)) + '</dd>';
  if (R.G.lat != null) h += '<dt>G theo WGS-84</dt><dd>' + fnum(R.G.lat, 6) + '°, ' + fnum(R.G.lon, 6) + '°</dd>';
  h += '<dt>Tâm mặt tiền M</dt><dd>' + (R.mode === 'local' ? 'x = ' + fnum(R.M.E, 4) + ' m; y = ' + fnum(R.M.N, 4) + ' m' : 'X = ' + fnum(R.M.N, 3) + '; Y = ' + fnum(R.M.E, 3)) + '</dd>';
  h += '<dt>Khoảng cách G → M</dt><dd>' + fnum(Math.hypot(R.edges[R.front].mid[0], R.edges[R.front].mid[1]) * 100, 1) + ' cm</dd>';
  h += '<dt>Độ chính xác dữ liệu nhập</dt><dd>' + R.dir.minDec + ' chữ số thập phân (±' + fnum(R.dir.uncertSigma * 100, 2) + ' cm mỗi toạ độ) → hướng tối đa ±' + fnum(R.dir.uncert, R.dir.uncert < 0.01 ? 3 : 2) + '°</dd><dt>Lệch giữa 3 kiểu tâm</dt><dd>trọng tâm ↔ TB đỉnh: ' + fnum(R.Gdelta.vertex * 100, 1) + ' cm; ↔ khung bao: ' + fnum(R.Gdelta.bbox * 100, 1) + ' cm</dd></dl>';
  var body = R.edges.map(function (e, i) { return tr([[e.from + ' – ' + e.to + (i === R.front ? ' <span class="dt-flag">mặt tiền</span>' : '')], [fnum(e.len * 100, 1), 1], [fnum(e.len, 3), 1], [fnum(e.azGrid, 2) + '°', 1], [fnum(e.azTrue, 2) + '°', 1], [fnum(R.verts[i].angle, 2) + '°', 1]], i === R.front); }).join('');
  h += tbl([['Cạnh'], ['Dài (cm)', 1], ['Dài (m)', 1], ['Phương vị lưới', 1], ['Phương vị Bắc thật', 1], ['Góc trong tại đỉnh đầu', 1]], body);
  el.innerHTML = h;
}
function renderFront() {
  var sel = $('dt-front'), h = '';
  if (R.ok) R.edges.forEach(function (e, i) { h += '<option value="' + i + '">Cạnh ' + esc(e.from) + ' – ' + esc(e.to) + ' (' + fnum(e.len * 100, 1) + ' cm)</option>'; });
  else { var n = Math.max(3, rows().length); for (var i = 0; i < n; i++) h += '<option value="' + i + '">Cạnh ' + (i + 1) + ' → ' + ((i + 1) % n + 1) + '</option>'; }
  sel.innerHTML = h; sel.value = String(S.front);
  $('dt-thumb').innerHTML = R.ok ? Dw.thumb(R, S.front) : '<div class="dt-empty">Chưa có hình.</div>';
}
function renderDir(el, R) {
  var K = C.subj(R);
  if (!R.ok) { el.innerHTML = ''; return; }
  var d = R.dir, h = d.hInfo, ht = d.hInfoTrue, hm = d.hInfoMag, fe = R.edges[R.front];
  var x = '<div class="dt-grid2" style="margin-top:12px"><div><div class="dt-lab">' + K.H + ' - Bắc thật</div><div class="dt-big">' + fnum(d.true, 2) + '°</div><div>' + esc(C.cardinalText(d.true)) + '</div></div><div>';
  x += '<dl class="dt-kv"><dt>' + K.H + ' - Bắc từ (la bàn)</dt><dd>' + fnum(d.mag, 2) + '° ' + (d.declSource === 'estimate' ? '<span class="dt-flag">D ước tính</span>' : '') + '</dd>' +
    '<dt>Độ lệch từ D</dt><dd>' + (d.decl >= 0 ? '+' : '') + fnum(d.decl, 2) + '° (' + (d.decl >= 0 ? 'lệch Đông' : 'lệch Tây') + ')</dd>' +
    (R.georef ? '<dt>Bắc lưới VN-2000</dt><dd>' + fnum(d.grid, 2) + '°</dd><dt>Độ hội tụ kinh tuyến γ</dt><dd>' + fnum(d.gamma, 3) + '°</dd>' : '<dt>Trục Bắc bản vẽ lệch Bắc thật</dt><dd>' + fnum(d.theta, 2) + '°</dd>') +
    '<dt>Pháp tuyến mặt tiền ' + esc(fe.from) + '–' + esc(fe.to) + '</dt><dd>' + fnum(d.normTrue, 2) + '° (Bắc thật)</dd><dt>Trục G → M</dt><dd>' + fnum(d.axisTrue, 2) + '° (lệch ' + fnum(Math.abs(C.n180(d.axisTrue - d.normTrue)), 2) + '°)</dd></dl></div></div>';
  x += tbl([['Khung tham chiếu'], ['Góc', 1], ['Cung (quái)'], ['Sơn hướng'], ['Cách ranh dưới', 1], ['Cách ranh trên', 1]],
    [['Bắc thật', ht], ['Bắc từ (la bàn)', hm]].map(function (z) { return tr([[z[0]], [fnum(z[1].refAz, 2) + '°', 1], [esc(C.CUNG8[z[1].cung].dir + ' (' + C.CUNG8[z[1].cung].que + ')')], ['<b>' + esc(z[1].sonName) + '</b>'], [fnum(z[1].toLower, 2) + '°', 1], [fnum(z[1].toUpper, 2) + '°', 1]], (z[1] === (S.ref === 'mag' ? hm : ht))); }).join(''));
  if (ht.son !== hm.son) x += '<div class="dt-warnbox">Sơn hướng theo Bắc thật (' + esc(ht.sonName) + ') khác theo Bắc từ (' + esc(hm.sonName) + '). Cần xác nhận đúng độ lệch từ D và chọn đúng mốc Bắc theo phương pháp bạn dùng.</div>';
  if (d.nearBoundary) x += '<div class="dt-warnbox">Hướng cách ranh sơn ' + fnum(Math.min(h.toLower, h.toUpper), 2) + '° (dưới ngưỡng ' + fnum(d.warnDeg, 1) + '°). Nên đo la bàn trực tiếp tại cửa chính để chốt.</div>';
  x += '<dl class="dt-kv"><dt>Toạ sơn (' + K.back + ')</dt><dd>' + fnum(d.toaTrue, 2) + '° thật / ' + fnum(d.toaMag, 2) + '° từ - sơn ' + esc(d.tInfo.sonName) + ' (cung ' + esc(C.CUNG8[d.tInfo.cung].dir) + ')</dd></dl>';
  el.innerHTML = x;
}
function renderSec(el, R) {
  if (!R.ok) { el.className = 'dt-empty'; el.textContent = 'Chưa có kết quả.'; return; } el.className = '';
  var hi = R.dir.hInfo, sh = R.ref === 'mag' ? 'Bắc từ' : 'Bắc thật';
  var h = '<p class="dt-hint">Góc chia theo <b>' + sh + '</b>. Cung rộng 45° (nét liền), sơn rộng 15° (nét đứt). Điểm chia a–h là giao của tia với ranh đất. Mã s1…s24 là các tia 24 sơn không trùng ranh cung.</p>';
  h += tbl([['Cung'], ['Quái'], ['Ba sơn'], ['Từ → đến (' + sh + ')'], ['Chu vi (cm)', 1], ['Diện tích (m²)', 1]],
    R.cung.map(function (c, i) { return tr([[c.name], [c.que], [c.sonNames.join(' - ')], [fnum(C.n360(i * 45 - 22.5), 1) + '° → ' + fnum(C.n360(i * 45 + 22.5), 1) + '°'], [fnum(c.perim * 100, 1), 1], [fnum(c.area, 2), 1]], i === hi.cung); }).join(''));
  h += '<h4 style="margin:12px 0 4px">Điểm chia 8 cung trên ranh đất</h4>';
  h += tbl([['Điểm'], ['Góc tia', 1], ['Trên cạnh'], ['Cách đỉnh đầu (cm)', 1], ['Cách đỉnh cuối (cm)', 1], ['Cách G (cm)', 1]],
    R.d8.map(function (d) { return d.hit ? tr([['<b>' + d.id + '</b>'], [fnum(d.refAz, 1) + '°', 1], [esc(R.edges[d.edge].from + '–' + R.edges[d.edge].to)], [fnum(d.fromStart * 100, 1), 1], [fnum(d.fromEnd * 100, 1), 1], [fnum(d.dist * 100, 1), 1]]) : tr([[d.id], [fnum(d.refAz, 1) + '°', 1], ['không cắt'], [''], [''], ['']]); }).join(''));
  h += '<h4 style="margin:12px 0 4px">Độ dài các đoạn dọc ranh sau khi phân 8 cung (cm)</h4>';
  h += tbl([['Đoạn'], ['Thuộc cung'], ['Dài (cm)', 1], ['Dài (m)', 1]], R.p8.segs.map(function (s) { return tr([['<b>' + esc(s.from + ' → ' + s.to) + '</b>'], [esc(C.CUNG8[s.cung].dir)], [fnum(s.len * 100, 1), 1], [fnum(s.len, 3), 1]], s.cung === hi.cung); }).join('') + tr([['<b>Tổng</b>'], [''], ['<b>' + fnum(R.p8.segs.reduce(function (a, b) { return a + b.len; }, 0) * 100, 1) + '</b>', 1], [fnum(R.perimeter, 3), 1]]));
  h += '<details><summary style="cursor:pointer;margin:8px 0">Bảng 24 sơn (' + R.p24.segs.length + ' đoạn dọc ranh)</summary>';
  h += tbl([['Sơn'], ['Từ → đến (' + sh + ')'], ['Chu vi (cm)', 1], ['Diện tích (m²)', 1]], R.son.map(function (z, i) { return tr([[z.name], [fnum(C.n360(i * 15 - 7.5), 1) + '° → ' + fnum(C.n360(i * 15 + 7.5), 1) + '°'], [fnum(z.perim * 100, 1), 1], [fnum(z.area, 3), 1]], i === hi.son); }).join(''));
  h += tbl([['Đoạn'], ['Thuộc sơn'], ['Dài (cm)', 1]], R.p24.segs.map(function (s) { return tr([[esc(s.from + ' → ' + s.to)], [esc(C.SON24[s.son])], [fnum(s.len * 100, 1), 1]], s.son === hi.son); }).join('')) + '</details>';
  el.innerHTML = h;
}
function renderPages() {
  var tabs = $('dt-ptabs'), pv = $('dt-preview');
  if (!R.ok) { pages = null; tabs.innerHTML = ''; pv.innerHTML = '<div style="color:#fff;padding:20px">Chưa có bản vẽ.</div>'; return; }
  var o = { unit: S.unit, scaleMode: S.scaleMode, scaleN: C.parseNum(S.scaleN), draw24: S.draw24, label24: S.label24 };
  try { pages = Dw.buildPages(R, o, H, REL); } catch (e) { pages = null; pv.innerHTML = '<div style="color:#fff;padding:20px">Lỗi dựng bản vẽ: ' + esc(e.message) + '</div>'; return; }
  var sc = pages.scales || []; var names = pages.names.map(function (n, i) { return n + (sc[i] ? ' (1:' + sc[i] + ')' : ''); }); if (curPage >= pages.pages.length) curPage = 0;
  tabs.innerHTML = names.map(function (n, i) { return '<button data-p="' + i + '" class="' + (i === curPage ? 'on' : '') + '">' + esc(n) + '</button>'; }).join('');
  pv.innerHTML = pages.pages[curPage];
}
function payloadOf(R) {
  var d = R.dir, h = d.hInfo;
  return {
    schema: 'tientqn.dinhtam/1', subject: R.isHouse ? 'nha' : 'khu_dat', name: R.name, updated: new Date().toISOString(),
    geometry: { areaM2: +R.area.toFixed(3), perimeterCm: +(R.perimeter * 100).toFixed(1), mode: R.mode, centerMode: R.centerMode, G: R.G, M: R.M,
      vertices: R.verts.map(function (v) { return { label: v.label, E: v.E, N: v.N, lat: v.lat == null ? null : v.lat, lon: v.lon == null ? null : v.lon, interiorAngle: +v.angle.toFixed(3) }; }),
      edges: R.edges.map(function (e) { return { from: e.from, to: e.to, cm: +(e.len * 100).toFixed(1), azTrue: +e.azTrue.toFixed(3), azGrid: +e.azGrid.toFixed(3) }; }) },
    orientation: { frontEdge: R.edges[R.front].from + '-' + R.edges[R.front].to, mode: d.mode, huongBacThat: +d.true.toFixed(3), huongBacTu: +d.mag.toFixed(3), huongBacLuoi: +d.grid.toFixed(3), declination: d.decl, declinationSource: d.declSource, convergence: +d.gamma.toFixed(4), toaBacThat: +d.toaTrue.toFixed(3), toaBacTu: +d.toaMag.toFixed(3), axisGMtrue: +d.axisTrue.toFixed(3) },
    phongThuy: { refFrame: R.ref, huong: { cung: C.CUNG8[h.cung].dir, que: h.que, son: h.sonName, sonIndex24: h.son, cungIndex8: h.cung, angleInRef: +h.refAz.toFixed(3), toLowerBoundaryDeg: +h.toLower.toFixed(3), toUpperBoundaryDeg: +h.toUpper.toFixed(3), nearBoundary: d.nearBoundary },
      toa: { cung: C.CUNG8[d.tInfo.cung].dir, que: d.tInfo.que, son: d.tInfo.sonName, sonIndex24: d.tInfo.son },
      sonByFrame: { bacThat: R.dir.hInfoTrue.sonName, bacTu: R.dir.hInfoMag.sonName },
      cung8: R.cung.map(function (c) { return { name: c.name, que: c.que, sons: c.sonNames, fromDeg: +C.n360(c.from - R.shift).toFixed(1), areaM2: +c.area.toFixed(3), perimeterCm: +(c.perim * 100).toFixed(1) }; }),
      son24: R.son.map(function (c) { return { name: c.name, areaM2: +c.area.toFixed(3), perimeterCm: +(c.perim * 100).toFixed(1) }; }) },
    segments8: R.p8.segs.map(function (s) { return { from: s.from, to: s.to, cm: +(s.len * 100).toFixed(1), cung: C.CUNG8[s.cung].dir }; }),
    segments24: R.p24.segs.map(function (s) { return { from: s.from, to: s.to, cm: +(s.len * 100).toFixed(1), son: C.SON24[s.son] }; }),
    divisionPoints8: R.d8.map(function (p) { return { id: p.id, angleDeg: +p.refAz.toFixed(1), distFromGcm: p.hit ? +(p.dist * 100).toFixed(1) : null }; })
  };
}
function buildPayload() {
  if (!R || !R.ok) return null; var p = payloadOf(R);
  if (H && H.ok && REL) {
    p.nha = payloadOf(H); p.nha.name = H.name;
    p.nha.relation = { areaPctOfLot: +REL.areaPct.toFixed(2), dirDiffDeg: +REL.dirDiff.toFixed(3), GnFromG: { distCm: +(REL.dist * 100).toFixed(1), azTrue: +REL.az.toFixed(2), lotCung: C.CUNG8[REL.gInfo.cung].dir, lotQue: C.CUNG8[REL.gInfo.cung].que, lotSon: REL.gInfo.sonName },
      setbacksCm: REL.setbacks.map(function (b) { return { edge: b.from + '-' + b.to, cm: +(b.d * 100).toFixed(1), nearest: b.hv }; }), houseAreaByLotCungM2: R.cung.map(function (c, i) { return { cung: c.name, m2: +REL.cungShare[i].toFixed(3) }; }), insideLot: REL.allInside && !REL.cross };
  }
  return p;
}
var lastJson = '';
function publish() {
  var p = buildPayload(); if (!p) return; var j = JSON.stringify(p); if (j === lastJson.replace(/"updated":"[^"]*"/, '')) { }
  try { localStorage.setItem(KEYR, j); } catch (e) { }
  try { document.dispatchEvent(new CustomEvent('tientqn:dinhtam:update', { detail: p })); } catch (e) { }
  listeners.forEach(function (f) { try { f(p); } catch (e) { } });
}
function renderLink() {
  var el = $('dt-link'), p = buildPayload();
  var h = '<p class="dt-hint">Kết quả của tab này được xuất thành một gói dữ liệu chuẩn. Hai tab kia có thể đọc: toạ/hướng sơn, cung (quái), độ lệch so với ranh sơn, hướng Bắc thật/Bắc từ.</p>';
  if (!p) { el.innerHTML = h + '<div class="dt-empty">Chưa có kết quả để gửi.</div>'; return; }
  var hu = p.phongThuy.huong, t = p.phongThuy.toa;
  h += '<dl class="dt-kv"><dt>Hướng đất</dt><dd>sơn ' + esc(hu.son) + ' - cung ' + esc(hu.cung) + ' (' + esc(hu.que) + ') - ' + fnum(p.orientation.huongBacThat, 1) + '° thật / ' + fnum(p.orientation.huongBacTu, 1) + '° từ</dd><dt>Toạ đất</dt><dd>sơn ' + esc(t.son) + ' - cung ' + esc(t.cung) + ' (' + esc(t.que) + ')</dd></dl>';
  if (p.nha) { var nh = p.nha.phongThuy.huong, nt = p.nha.phongThuy.toa; h += '<dl class="dt-kv"><dt>Hướng nhà</dt><dd>sơn ' + esc(nh.son) + ' - cung ' + esc(nh.cung) + ' (' + esc(nh.que) + ') - ' + fnum(p.nha.orientation.huongBacThat, 1) + '° thật / ' + fnum(p.nha.orientation.huongBacTu, 1) + '° từ</dd><dt>Toạ nhà</dt><dd>sơn ' + esc(nt.son) + ' - cung ' + esc(nt.cung) + ' (' + esc(nt.que) + ')</dd><dt>Tâm nhà trong khu đất</dt><dd>cung ' + esc(p.nha.relation.GnFromG.lotCung) + ', sơn ' + esc(p.nha.relation.GnFromG.lotSon) + ' (tính từ tâm khu đất)</dd></dl>'; }
  h += '<div class="dt-row"><button class="dt-btn dt-primary" data-act="todraw">Gửi sang Công cụ vẽ</button><button class="dt-btn" data-act="todrawfile">Tải tệp cho Công cụ vẽ</button></div>';
  h += '<div class="dt-row"><button class="dt-btn dt-primary" data-act="send" data-to="lacviet">Gửi sang tab Lạc Việt</button><button class="dt-btn dt-primary" data-act="send" data-to="hkpt">Gửi sang tab Huyền Không Phi Tinh</button><button class="dt-btn" data-act="copyjson">Sao chép JSON</button></div>';
  h += '<details><summary style="cursor:pointer">Cách tab khác nhận dữ liệu (mã mẫu)</summary><div class="dt-pre">// Nhận mỗi khi kết quả thay đổi:\ndocument.addEventListener("tientqn:dinhtam:update", function (e) {\n  var r = e.detail;                       // gói dữ liệu; r.nha có nếu khu đất có nhà\n  var son  = r.phongThuy.huong.son;       // sơn hướng, ví dụ "Ngọ"\n  var toa  = r.phongThuy.toa.son;         // sơn toạ, ví dụ "Tý"\n  var huongThat = r.orientation.huongBacThat;\n});\n\n// Nhận khi người dùng bấm nút "Gửi sang tab ...":\ndocument.addEventListener("tientqn:dinhtam:send", function (e) {\n  if (e.detail.target !== "hkpt") return;  // hoặc "lacviet"\n  var r = e.detail.payload;\n});\n\n// Đọc trực tiếp bất kỳ lúc nào:\nvar r = window.TIENTQN.dinhTam.getResult();</div></details>';
  h += '<details><summary style="cursor:pointer;margin-top:6px">Xem gói dữ liệu JSON</summary><div class="dt-pre">' + esc(JSON.stringify(p, null, 1)) + '</div></details>';
  el.innerHTML = h;
}

// ---------- xuất ----------
function download(name, mime, data) { var b = new Blob([data], { type: mime }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function slug() { return (S.name || 'thua-dat').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'thua-dat'; }
function printPages() {
  if (!pages) { msg('Chưa có bản vẽ để in.'); return; }
  var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(S.name || 'Bản vẽ hướng đất') + '</title><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}.pg{width:210mm;height:297mm;page-break-after:always;break-after:page;overflow:hidden}.pg:last-child{page-break-after:auto}.pg svg{display:block;width:210mm;height:297mm}</style></head><body>' +
    pages.pages.map(function (p) { return '<div class="pg">' + p + '</div>'; }).join('') + '</body></html>';
  var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
  var d = f.contentWindow.document; d.open(); d.write(html); d.close();
  setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { var w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 400); } } setTimeout(function () { f.remove(); }, 4000); }, 400);
}
// ---------- xuất PDF trực tiếp (chỉ các bản vẽ) ----------
function blobBytes(b) { return b.arrayBuffer ? b.arrayBuffer().then(function (x) { return new Uint8Array(x); }) : new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(new Uint8Array(fr.result)); }; fr.onerror = rej; fr.readAsArrayBuffer(b); }); }
function svgToJpeg(svg, dpi) {
  return new Promise(function (res, rej) {
    var W = Math.round(210 / 25.4 * dpi), Hh = Math.round(297 / 25.4 * dpi), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
    img.onload = function () {
      var cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, Hh); c.drawImage(img, 0, 0, W, Hh); URL.revokeObjectURL(url);
      cv.toBlob(function (b) { if (!b) { rej(new Error('Trình duyệt không tạo được ảnh trang (thiếu bộ nhớ?). Thử giảm số trang.')); return; } blobBytes(b).then(function (d) { res({ data: d, w: W, h: Hh }); }, rej); }, 'image/jpeg', 0.93);
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Không dựng được hình từ bản vẽ SVG.')); }; img.src = url;
  });
}
function makePdf(imgs, title) {
  var enc = new TextEncoder(), parts = [], off = [], pos = 0, wPt = 595.276, hPt = 841.89, N = imgs.length;
  function put(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); pos += b.length; }
  function begin(n) { off[n] = pos; put(n + ' 0 obj\n'); }
  put('%PDF-1.4\n'); begin(1); put('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  var kids = []; for (var i = 0; i < N; i++) kids.push((4 + 3 * i) + ' 0 R');
  begin(2); put('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + N + ' >>\nendobj\n');
  var hex = ''; for (i = 0; i < title.length; i++) hex += ('0000' + title.charCodeAt(i).toString(16)).slice(-4);
  begin(3); put('<< /Title <FEFF' + hex + '> /Creator (TIEN.TQN Dinh tam va Phan cung) /Producer (TIEN.TQN) >>\nendobj\n');
  imgs.forEach(function (im, k) {
    var po = 4 + 3 * k, co = po + 1, io = po + 2, cs = 'q ' + wPt + ' 0 0 ' + hPt + ' 0 0 cm /Im0 Do Q';
    begin(po); put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + wPt + ' ' + hPt + '] /Resources << /XObject << /Im0 ' + io + ' 0 R >> >> /Contents ' + co + ' 0 R >>\nendobj\n');
    begin(co); put('<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream\nendobj\n');
    begin(io); put('<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.data.length + ' >>\nstream\n'); put(im.data); put('\nendstream\nendobj\n');
  });
  var xr = pos, total = 4 + 3 * N; put('xref\n0 ' + total + '\n0000000000 65535 f \n');
  for (i = 1; i < total; i++) put(('0000000000' + off[i]).slice(-10) + ' 00000 n \n');
  put('trailer\n<< /Size ' + total + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xr + '\n%%EOF\n');
  return new Blob(parts, { type: 'application/pdf' });
}
var pdfBusy = false;
function exportPdf(which) {
  if (!pages) { msg('Chưa có bản vẽ để xuất.'); return Promise.resolve(); } if (pdfBusy) return Promise.resolve();
  var idx = which === 'one' ? [curPage] : pages.pages.map(function (_, i) { return i; }), st = $('dt-pdfstat'), out = [], btns = root.querySelectorAll('[data-act=pdfall],[data-act=pdfone]'); pdfBusy = true;
  btns.forEach(function (b) { b.disabled = true; });
  var chain = Promise.resolve();
  idx.forEach(function (i, k) { chain = chain.then(function () { st.textContent = 'Đang tạo PDF: trang ' + (k + 1) + '/' + idx.length + '...'; return svgToJpeg(pages.pages[i], 250).then(function (r) { out.push(r); }); }); });
  return chain.then(function () {
    var blob = makePdf(out, 'Bản vẽ hướng đất - ' + (S.name || 'thửa đất')); download(slug() + (which === 'one' ? '-trang' + (curPage + 1) : '-ban-ve') + '.pdf', 'application/pdf', blob);
    st.textContent = 'Đã tạo PDF ' + idx.length + ' trang (' + Math.round(blob.size / 1024) + ' KB). Nếu trình duyệt không tự tải, hãy kiểm tra thư mục Tải xuống.';
  }).catch(function (e) { st.textContent = ''; msg('Không tạo được PDF: ' + e.message); }).then(function () { pdfBusy = false; btns.forEach(function (b) { b.disabled = false; }); });
}

function csvOut() {
  if (!R || !R.ok) return ''; var L = ['Loai;Tu;Den;Dai_cm;Ghi_chu'];
  R.edges.forEach(function (e) { L.push(['Canh', e.from, e.to, (e.len * 100).toFixed(1), 'PV Bac that ' + e.azTrue.toFixed(2)].join(';')); });
  R.p8.segs.forEach(function (s) { L.push(['Doan 8 cung', s.from, s.to, (s.len * 100).toFixed(1), C.CUNG8[s.cung].dir].join(';')); });
  R.p24.segs.forEach(function (s) { L.push(['Doan 24 son', s.from, s.to, (s.len * 100).toFixed(1), C.SON24[s.son]].join(';')); });
  if (H && H.ok) { H.edges.forEach(function (e) { L.push(['Nha - Canh', e.from, e.to, (e.len * 100).toFixed(1), 'PV Bac that ' + e.azTrue.toFixed(2)].join(';')); }); H.p8.segs.forEach(function (s) { L.push(['Nha - Doan 8 cung', s.from, s.to, (s.len * 100).toFixed(1), C.CUNG8[s.cung].dir].join(';')); }); H.p24.segs.forEach(function (s) { L.push(['Nha - Doan 24 son', s.from, s.to, (s.len * 100).toFixed(1), C.SON24[s.son]].join(';')); }); REL.setbacks.forEach(function (b) { L.push(['Khoang lui', b.from, b.to, (b.d * 100).toFixed(1), 'diem nha ' + b.hv].join(';')); }); }
  return '\ufeff' + L.join('\n');
}

// ---------- phân tích / OCR ----------
function applyParsed(pr, srcLabel) {
  if (!pr.kind) { msg('Không nhận ra bảng toạ độ trong ' + srcLabel + ' (cần ít nhất 3 điểm có cặp X-Y hoặc vĩ độ-kinh độ). Hãy kiểm tra nội dung hoặc nhập tay.'); return false; }
  var d = pr.pts.map(function (p, i) { return pr.kind === 'vn2000' ? [p.label || String(i + 1), String(p.X), String(p.Y)] : [p.label || String(i + 1), String(p.lat), String(p.lon)]; });
  S.data[pr.kind] = d; S.mode = pr.kind;
  if (pr.cm && pr.kind === 'vn2000') { S.cm = String(pr.cm); }
  S.front = 0; syncForm(); renderTable(); recompute();
  msg('Đã nhận ' + d.length + ' điểm từ ' + srcLabel + ' vào bảng ' + (pr.kind === 'vn2000' ? 'VN-2000' : 'WGS-84') + (pr.cm ? ' (KTT ' + pr.cm + '°)' : '') + '. Hãy đối chiếu từng số với bản gốc, nhất là khi quét OCR.', true);
  return true;
}
function loadScript(url) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = function () { rej(new Error('Không tải được thư viện từ mạng: ' + url)); }; document.head.appendChild(s); }); }
function fileToCanvas(file) {
  return new Promise(function (res, rej) {
    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js').then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        var fr = new FileReader(); fr.onload = function () {
          window.pdfjsLib.getDocument({ data: new Uint8Array(fr.result) }).promise.then(function (pdf) {
            return pdf.getPage(1).then(function (page) {
              var vp = page.getViewport({ scale: 2.2 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
              return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise.then(function () {
                return page.getTextContent().then(function (tc) {
                  var rowsY = {}; tc.items.forEach(function (it) { var y = Math.round(it.transform[5] / 3); (rowsY[y] = rowsY[y] || []).push([it.transform[4], it.str]); });
                  var text = Object.keys(rowsY).map(Number).sort(function (a, b) { return b - a; }).map(function (y) { return rowsY[y].sort(function (a, b) { return a[0] - b[0]; }).map(function (z) { return z[1]; }).join(' '); }).join('\n');
                  res({ canvas: cv, text: text });
                });
              });
            });
          }).catch(rej);
        }; fr.readAsArrayBuffer(file);
      }).catch(rej);
    } else {
      var img = new Image(); img.onload = function () { var cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0); URL.revokeObjectURL(img.src); res({ canvas: cv, text: '' }); };
      img.onerror = function () { rej(new Error('Không đọc được ảnh.')); }; img.src = URL.createObjectURL(file);
    }
  });
}
var scanCanvas = null;
function onScanFile(file) {
  if (!file) return; var st = $('dt-scanstat');
  if (/\.(txt|csv)$/i.test(file.name) || file.type === 'text/plain') { var fr = new FileReader(); fr.onload = function () { $('dt-paste').value = fr.result; applyParsed(C.parseText(fr.result), 'tệp văn bản'); }; fr.readAsText(file); return; }
  st.textContent = 'Đang đọc tệp...';
  fileToCanvas(file).then(function (r) {
    scanCanvas = r.canvas; var pv = $('dt-scanprev'); pv.hidden = false; pv.width = r.canvas.width; pv.height = r.canvas.height; pv.getContext('2d').drawImage(r.canvas, 0, 0);
    $('dt-ocrbtn').disabled = false; $('dt-toimg').disabled = false; setImage(r.canvas);
    if (r.text && r.text.trim()) { $('dt-paste').value = r.text; var pr = C.parseText(r.text); if (pr.kind) { st.textContent = 'PDF có lớp chữ: đã đọc trực tiếp.'; applyParsed(pr, 'PDF (lớp chữ)'); return; } }
    st.textContent = 'Đã tải ảnh (' + r.canvas.width + '×' + r.canvas.height + '). Bấm "Quét OCR" để nhận số liệu hoặc "Dùng ảnh này để chấm điểm".';
  }).catch(function (e) { st.textContent = ''; msg(e.message); });
}
function runOCR() {
  if (!scanCanvas) return; var st = $('dt-scanstat'); st.textContent = 'Đang tải bộ nhận dạng chữ (cần Internet, lần đầu có thể mất 10-30 giây)...';
  loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js').then(function () {
    return window.Tesseract.createWorker('eng');
  }).then(function (w) {
    st.textContent = 'Đang nhận dạng...';
    return w.setParameters({ tessedit_pageseg_mode: '6' }).then(function () { return w.recognize(scanCanvas); }).then(function (r) { return w.terminate().then(function () { return r.data.text; }); });
  }).then(function (text) {
    $('dt-paste').value = text; st.textContent = 'Hoàn tất OCR. Kết quả thô nằm trong ô văn bản, bạn có thể sửa rồi bấm "Phân tích văn bản".';
    applyParsed(C.parseText(text), 'kết quả OCR');
  }).catch(function (e) { st.textContent = ''; msg('OCR không chạy được: ' + e.message + '. Hãy dán/gõ số liệu thủ công hoặc thử lại khi có mạng.'); });
}

// ---------- chấm điểm trên bản vẽ ----------
var I = { cv: null, ctx: null, w: 0, h: 0, zoom: 1, step: 'scale', scale: [], verts: [], house: [], north: [], drag: null };
function setImage(canvas) {
  I.src = canvas; I.w = canvas.width; I.h = canvas.height; var cv = $('dt-cv'); cv.width = I.w; cv.height = I.h; I.cv = cv; I.ctx = cv.getContext('2d');
  I.scale = []; I.verts = []; I.house = []; I.north = []; $('dt-cvhint').hidden = true; fitZoom(); drawI(); imgStat();
}
function fitZoom() { var wrap = root.querySelector('.dt-canvaswrap'), z = Math.min(1, Math.max(0.2, (wrap.clientWidth - 4) / I.w)); I.zoom = z; $('dt-zoom').value = z; applyZoom(); }
function applyZoom() { if (!I.cv) return; I.cv.style.width = Math.round(I.w * I.zoom) + 'px'; I.cv.style.height = Math.round(I.h * I.zoom) + 'px'; }
function drawI() {
  if (!I.src) return; var c = I.ctx, z = I.zoom; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, I.w, I.h); c.drawImage(I.src, 0, 0);
  var lw = 2 / z, r = 6 / z; c.lineWidth = lw; c.font = (14 / z) + 'px sans-serif';
  function dot(p, col, t) { c.fillStyle = col; c.beginPath(); c.arc(p[0], p[1], r, 0, 6.2832); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = lw / 2; c.stroke(); if (t) { c.fillStyle = col; c.fillText(t, p[0] + r + 2, p[1] - r); } }
  function line(arr, col, close, pre) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); arr.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); if (close && arr.length > 2) c.closePath(); c.stroke(); arr.forEach(function (p, i) { dot(p, col === '#0d6b57' ? '#c8452b' : col === '#e07b19' ? '#b4540a' : col, pre + (i + 1)); }); }
  if (I.scale.length) line(I.scale, '#1f5fa8', false, 'H');
  if (I.verts.length) line(I.verts, '#0d6b57', true, '');
  if (I.house.length) line(I.house, '#e07b19', true, 'N');
  if (I.north.length) { c.strokeStyle = '#a9791c'; c.lineWidth = lw; c.beginPath(); c.moveTo(I.north[0][0], I.north[0][1]); if (I.north[1]) c.lineTo(I.north[1][0], I.north[1][1]); c.stroke(); I.north.forEach(function (p, i) { dot(p, '#a9791c', i ? 'Bắc' : 'gốc'); }); }
}
function mpp() {
  var r = C.parseNum($('dt-ratio').value), dpi = C.parseNum($('dt-dpi').value), dist = C.parseNum($('dt-calib').value);
  if (I.scale.length === 2 && dist > 0) { var px = Math.hypot(I.scale[1][0] - I.scale[0][0], I.scale[1][1] - I.scale[0][1]); return px > 0 ? dist / px : null; }
  if (r > 0 && dpi > 0) return (25.4 / dpi) * r / 1000; return null;
}
function imgStat() {
  var m = mpp(), t = [];
  t.push(I.src ? 'Ảnh ' + I.w + '×' + I.h + ' px' : 'Chưa có ảnh');
  t.push(m ? '1 px = ' + fnum(m * 1000, 3) + ' mm thực tế' : 'Chưa hiệu chuẩn tỷ lệ');
  t.push(I.verts.length + ' đỉnh khu đất'); if (I.house.length) t.push(I.house.length + ' đỉnh nhà'); if (I.north.length === 2) t.push('đã chỉ hướng Bắc');
  $('dt-imgstat').textContent = t.join(' · ');
  var steps = $('dt-imgstep').querySelectorAll('button'); for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('on', steps[i].dataset.step === I.step);
}
function ipt(e) { var r = I.cv.getBoundingClientRect(); return [(e.clientX - r.left) * (I.w / r.width), (e.clientY - r.top) * (I.h / r.height)]; }
function onPointerDown(e) {
  if (!I.src) return; var p = ipt(e), th = 10 / I.zoom, hit = null;
  [['verts', I.verts], ['house', I.house]].forEach(function (z) { if (I.step === z[0]) z[1].forEach(function (v, i) { if (Math.hypot(v[0] - p[0], v[1] - p[1]) < th) hit = { arr: z[1], i: i }; }); });
  if (hit) { I.drag = hit; I.cv.setPointerCapture(e.pointerId); return; }
  if (I.step === 'scale') { if (I.scale.length >= 2) I.scale = []; I.scale.push(p); }
  else if (I.step === 'verts') I.verts.push(p);
  else if (I.step === 'house') I.house.push(p);
  else if (I.step === 'north') { if (I.north.length >= 2) I.north = []; I.north.push(p); }
  drawI(); imgStat();
}
function onPointerMove(e) { if (!I.drag) return; I.drag.arr[I.drag.i] = ipt(e); drawI(); }
function onPointerUp() { I.drag = null; imgStat(); }
function imageUse() {
  var m = mpp(); if (!I.src) { msg('Chưa có ảnh.'); return; } if (!m) { msg('Cần hiệu chuẩn tỷ lệ: chấm 2 điểm đã biết khoảng cách rồi nhập số mét, hoặc nhập tỷ lệ 1:N và dpi.'); return; }
  if (I.verts.length < 3) { msg('Cần chấm tối thiểu 3 đỉnh khu đất.'); return; }
  var o = I.verts[0], conv = function (arr, pre) { return arr.map(function (p, i) { return [pre + (i + 1), ((p[0] - o[0]) * m).toFixed(4), (-(p[1] - o[1]) * m).toFixed(4)]; }); };
  var th = 0; if (I.north.length === 2) { var dx = I.north[1][0] - I.north[0][0], dy = -(I.north[1][1] - I.north[0][1]); th = -Math.atan2(dx, dy) * R2D; }
  S.localSigma = String((m * 2).toFixed(4)); S.data.local = conv(I.verts, ''); S.localTheta = th.toFixed(3); S.mode = 'local'; S.tm = 'local'; S.front = 0;
  var hn = '';
  if (I.house.length >= 3) { S.house.enabled = true; S.house.mode = 'abs'; S.house.abs.local = conv(I.house, 'N'); S.house.front = 'auto'; hn = ' và ' + I.house.length + ' đỉnh nhà (cùng hệ toạ độ)'; }
  syncForm(); renderTable(); renderHTables(); recompute();
  msg('Đã chuyển ' + I.verts.length + ' đỉnh khu đất' + hn + ' sang toạ độ cục bộ (mét)' + (I.north.length === 2 ? ', trục Bắc bản vẽ lệch ' + fnum(th, 2) + '° so với Bắc thật.' : '. Chưa chỉ hướng Bắc: đang coi phía trên bản vẽ là Bắc thật, hãy sửa "Trục Bắc lệch" nếu khác.'), true);
  root.querySelector('#dt-s2').scrollIntoView({ behavior: 'smooth' });
}

// ---------- vẽ nhà trực tiếp trên khu đất ----------
var HC = { zoom: 1, drag: -1, W: 700, Hh: 700, s: 1, ox: 0, oy: 0 };
function hcSetup() {
  if (!R || !R.ok) return false; var T = R.T, a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
  T.forEach(function (p) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); });
  var pad = Math.max(1.5, 0.06 * Math.max(b - a, d - c)), bw = b - a + 2 * pad, bh = d - c + 2 * pad, s = Math.min(680 / bw, 640 / bh);
  HC.s = s; HC.W = Math.round(bw * s); HC.Hh = Math.round(bh * s); HC.ox = -(a - pad) * s; HC.oy = (d + pad) * s; return true;
}
function hcTtoUV(e, n) { var g = C.rotT(e, n, -R.theta), f = lotFrame(), E = R.G.E + g[0], N = R.G.N + g[1], dE = E - f.pa.E, dN = N - f.pa.N; return [dE * f.ue + dN * f.un, dE * f.ve + dN * f.vn]; }
function hcUVtoT(u, v) { var f = lotFrame(), g = uvGrid(f, u, v); return C.rotT(g[0] - R.G.E, g[1] - R.G.N, R.theta); }
function hcPts() { var o = []; S.house.uv.forEach(function (r, i) { var u = C.parseNum(r[1]), v = C.parseNum(r[2]); if (isFinite(u) && isFinite(v)) o.push({ i: i, u: u, v: v }); }); return o; }
function hcApplyZoom() { var cv = $('dt-hcv'), wrap = $('dt-hcvwrap'); if (!cv || !HC.W) return; var base = Math.min(1, (wrap.clientWidth - 4) / HC.W); cv.style.width = Math.round(HC.W * base * HC.zoom) + 'px'; cv.style.height = Math.round(HC.Hh * base * HC.zoom) + 'px'; }
function hcDraw() {
  var cv = $('dt-hcv'); if (!hcSetup()) { var st0 = $('dt-hcvstat'); if (st0) st0.textContent = 'Cần nhập xong khu đất ở mục 1 để vẽ.'; return; }
  if (cv.width !== HC.W || cv.height !== HC.Hh) { cv.width = HC.W; cv.height = HC.Hh; } hcApplyZoom();
  var c = cv.getContext('2d'), s = HC.s, X = function (e) { return e * s + HC.ox; }, Y = function (n) { return HC.oy - n * s; };
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, HC.W, HC.Hh); c.fillStyle = '#fafbfc'; c.fillRect(0, 0, HC.W, HC.Hh);
  c.beginPath(); R.T.forEach(function (p, i) { if (i) c.lineTo(X(p[0]), Y(p[1])); else c.moveTo(X(p[0]), Y(p[1])); }); c.closePath(); c.fillStyle = '#e6f0f7'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#1f5fa8'; c.stroke();
  c.font = '13px sans-serif'; c.fillStyle = '#1f5fa8'; c.textAlign = 'center';
  R.T.forEach(function (p, i) { c.beginPath(); c.arc(X(p[0]), Y(p[1]), 3.5, 0, 6.3); c.fill(); var nn = R.edges[i].nrm, pv = R.edges[(i + R.n - 1) % R.n].nrm, bx = nn[0] + pv[0], by = nn[1] + pv[1], bl = Math.hypot(bx, by) || 1; c.fillText(R.verts[i].label, X(p[0]) + bx / bl * 14, Y(p[1]) - by / bl * 14 + 4); });
  var f = lotFrame(), o = hcUVtoT(0, 0), ux = hcUVtoT(Math.min(2, f.L / 2), 0), vy = hcUVtoT(0, 2);
  c.strokeStyle = '#a9791c'; c.fillStyle = '#a9791c'; c.lineWidth = 1.6; [[ux, 'u'], [vy, 'v']].forEach(function (z) { c.beginPath(); c.moveTo(X(o[0]), Y(o[1])); c.lineTo(X(z[0][0]), Y(z[0][1])); c.stroke(); c.fillText(z[1], X(z[0][0]) + (z[1] === 'u' ? 0 : 10), Y(z[0][1]) + 4); });
  var P = hcPts(); if (P.length) {
    var Q = P.map(function (p) { return hcUVtoT(p.u, p.v); }); c.beginPath(); Q.forEach(function (p, i) { if (i) c.lineTo(X(p[0]), Y(p[1])); else c.moveTo(X(p[0]), Y(p[1])); }); if (Q.length > 2) { c.closePath(); c.fillStyle = 'rgba(200,69,43,.18)'; c.fill(); } c.strokeStyle = '#c8452b'; c.lineWidth = 2; c.stroke();
    c.font = '12px sans-serif'; Q.forEach(function (p, i) { var q = Q[(i + 1) % Q.length]; if (Q.length > 1 && (i < Q.length - 1 || Q.length > 2)) { var l = Math.hypot(q[0] - p[0], q[1] - p[1]); c.fillStyle = '#c8452b'; c.fillText(fnum(l * 100, 1) + ' cm', (X(p[0]) + X(q[0])) / 2, (Y(p[1]) + Y(q[1])) / 2 - 5); } });
    Q.forEach(function (p, i) { c.beginPath(); c.arc(X(p[0]), Y(p[1]), 5, 0, 6.3); c.fillStyle = '#c8452b'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); c.fillStyle = '#7a1f0f'; c.font = 'bold 13px sans-serif'; c.fillText(S.house.uv[P[i].i][0] || ('N' + (i + 1)), X(p[0]) + 12, Y(p[1]) - 8); });
  }
  var st = $('dt-hcvstat'); st.textContent = P.length ? P.length + ' đỉnh nhà. Kéo đỉnh để chỉnh; bấm vào chỗ trống để thêm đỉnh.' : 'Bấm lên khung để đặt đỉnh nhà đầu tiên.';
}
function hcPoint(e) { var cv = $('dt-hcv'), r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * (HC.W / r.width), py = (e.clientY - r.top) * (HC.Hh / r.height), k = r.width / HC.W; return { en: [(px - HC.ox) / HC.s, (HC.oy - py) / HC.s], thM: 11 / k / HC.s, px: px, py: py, k: k }; }
function hcSnap(en, thM, skip) {
  var sn = S.house.snap, T = R.T, e = en[0], n = en[1], done = false, uv;
  if (sn.pt) {
    var best = null, P = hcPts();
    T.forEach(function (p) { var d = Math.hypot(p[0] - e, p[1] - n); if (d < thM && (!best || d < best.d)) best = { d: d, p: p }; });
    P.forEach(function (pp, j) { if (j === skip) return; var q = hcUVtoT(pp.u, pp.v), d = Math.hypot(q[0] - e, q[1] - n); if (d < thM && (!best || d < best.d)) best = { d: d, p: q }; });
    if (!best) R.T.forEach(function (p, i) { var q = R.T[(i + 1) % R.n], dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((e - p[0]) * dx + (n - p[1]) * dy) / L2)), fx = p[0] + t * dx, fy = p[1] + t * dy, d = Math.hypot(fx - e, fy - n); if (d < thM && (!best || d < best.d)) best = { d: d, p: [fx, fy] }; });
    if (best) { uv = hcTtoUV(best.p[0], best.p[1]); done = true; }
  }
  if (!uv) uv = hcTtoUV(e, n);
  if (!done) {
    var P2 = hcPts(), prev = null; if (skip != null && skip >= 0) prev = P2[(skip + P2.length - 1) % P2.length]; else if (P2.length) prev = P2[P2.length - 1]; if (prev && P2.length && (skip == null || skip < 0 || P2.length > 1) && sn.or) {
      var du = uv[0] - prev.u, dv = uv[1] - prev.v, ang = Math.atan2(dv, du) * 180 / Math.PI, rr = ((ang % 90) + 90) % 90;
      if (rr < 3 || rr > 87) { if (Math.abs(du) >= Math.abs(dv)) uv[1] = prev.v; else uv[0] = prev.u; }
    }
    var gs = C.parseNum(sn.step); if (sn.gr && gs > 0) { uv[0] = Math.round(uv[0] / gs) * gs; uv[1] = Math.round(uv[1] / gs) * gs; }
  }
  return uv;
}
function hcWrite(i, uv) { S.house.uv[i][1] = uv[0].toFixed(3); S.house.uv[i][2] = uv[1].toFixed(3); }
function hcDown(e) {
  if (!R || !R.ok) return; var pt = hcPoint(e), P = hcPts(), hit = -1, bd = 1e9;
  P.forEach(function (p, j) { var q = hcUVtoT(p.u, p.v), d = Math.hypot(q[0] - pt.en[0], q[1] - pt.en[1]); if (d < pt.thM && d < bd) { bd = d; hit = j; } });
  if (hit >= 0) { HC.drag = hit; $('dt-hcv').setPointerCapture(e.pointerId); return; }
  var uv = hcSnap(pt.en, pt.thM, null), idx = -1; S.house.uv.forEach(function (r, i) { if (idx < 0 && (r[1] === '' || r[2] === '')) idx = i; });
  if (idx < 0) { S.house.uv.push(['N' + (S.house.uv.length + 1), '', '']); idx = S.house.uv.length - 1; }
  if (!S.house.uv[idx][0]) S.house.uv[idx][0] = 'N' + (idx + 1);
  hcWrite(idx, uv); renderHTables(); hcDraw(); schedule();
}
function hcMove(e) { if (HC.drag < 0) return; var pt = hcPoint(e), P = hcPts(); hcWrite(P[HC.drag].i, hcSnap(pt.en, pt.thM, HC.drag)); hcDraw(); }
function hcUp() { if (HC.drag >= 0) { HC.drag = -1; renderHTables(); schedule(); } }
function hcUndo() { var P = hcPts(); if (!P.length) return; var i = P[P.length - 1].i; if (S.house.uv.length > 4) S.house.uv.splice(i, 1); else { S.house.uv[i][1] = ''; S.house.uv[i][2] = ''; } renderHTables(); schedule(); }

// ---------- nhận bản vẽ từ Công cụ vẽ ----------
function importDrawing(o, src) {
  try { if (typeof o === 'string') o = JSON.parse(o); } catch (e) { msg('Nội dung JSON không hợp lệ.'); return false; }
  if (!o || !o.lot || !o.lot.pts || o.lot.pts.length < 3) { msg('Gói bản vẽ không hợp lệ: thiếu khu đất (tối thiểu 3 đỉnh).'); return false; }
  var th = isFinite(+o.theta) ? +o.theta : 0, g = o.geo, useGeo = !!(g && g.mode === 'vn2000' && isFinite(+g.cm) && Math.abs(C.n180(th - (+g.theta || 0))) < 0.05), hasHouse = !!(o.house && o.house.pts && o.house.pts.length >= 3);
  var f6 = function (v) { return (+v).toFixed(6); }, f3 = function (v) { return (+v).toFixed(4); };
  if (useGeo) {
    S.data.vn2000 = o.lot.pts.map(function (p, i) { return [String(i + 1), f3(+g.N0 + p[1]), f3(+g.E0 + p[0])]; }); S.cm = String(g.cm); S.k0 = String(g.k0 || 0.9999); S.mode = 'vn2000'; S.tm = 'vn2000';
    if (hasHouse) S.house.abs.vn2000 = o.house.pts.map(function (p, i) { return ['N' + (i + 1), f3(+g.N0 + p[1]), f3(+g.E0 + p[0])]; });
  } else {
    S.data.local = o.lot.pts.map(function (p, i) { return [String(i + 1), f6(p[0]), f6(p[1])]; }); S.localTheta = String(th.toFixed(4)); S.localSigma = ''; S.mode = 'local'; S.tm = 'local';
    if (hasHouse) S.house.abs.local = o.house.pts.map(function (p, i) { return ['N' + (i + 1), f6(p[0]), f6(p[1])]; });
  }
  S.front = (o.front != null && +o.front >= 0 && +o.front < o.lot.pts.length) ? +o.front : 0; if (o.name) S.name = o.name;
  DOORS.lot = o.doors && o.doors.lot ? +o.doors.lot.az : null; DOORS.house = o.doors && o.doors.house ? +o.doors.house.az : null;
  if (hasHouse) { S.house.enabled = true; S.house.mode = 'abs'; S.house.front = (o.houseFront != null && +o.houseFront >= 0 && +o.houseFront < o.house.pts.length) ? String(+o.houseFront) : 'auto'; } else S.house.enabled = false;
  if (DOORS.lot != null) S.dirMode = 'door'; if (DOORS.house != null && hasHouse) S.house.dirMode = 'door';
  if (o.decl && isFinite(+o.decl.value) && o.decl.source === 'manual') { S.decl = String(o.decl.value); S.declSource = 'manual'; }
  syncForm(); renderTable(); renderHTables(); syncHouseFields(); recompute();
  msg('Đã nhận từ ' + (src || 'Công cụ vẽ') + ': khu đất (' + o.lot.pts.length + ' đỉnh)' + (hasHouse ? ' và nhà (' + o.house.pts.length + ' đỉnh)' : '') + (useGeo ? ', giữ toạ độ VN-2000 (KTT ' + g.cm + '°)' : ', toạ độ cục bộ (trục Bắc lệch ' + fnum(th, 2) + '°)') + (DOORS.lot != null || DOORS.house != null ? '; có hướng cửa chính, đã chọn "Theo cửa chính"' : '') + '. Hãy chọn cạnh mặt tiền ở mục 3.', true);
  root.querySelector('#dt-s2').scrollIntoView({ behavior: 'smooth' }); return true;
}
function toDrawPayload() {
  if (!R || !R.ok) return null; var E0 = R.verts[0].E, N0 = R.verts[0].N, rel = function (E, N) { return [+(E - E0).toFixed(6), +(N - N0).toFixed(6)]; };
  var o = { schema: 'tientqn.dinhtam.out/1', name: S.name || '', theta: +R.theta.toFixed(6), north: +C.n360(-R.theta).toFixed(6), lot: { name: 'Khu đất', pts: R.verts.map(function (v) { return rel(v.E, v.N); }) }, house: null, geo: R.georef ? { mode: 'vn2000', E0: E0, N0: N0, cm: R.proj.cm, k0: R.proj.k0, theta: +R.theta.toFixed(6) } : null,
    front: R.front, lotDir: +R.dir.true.toFixed(4), decl: { value: R.dir.decl, source: R.dir.declSource || 'manual' } };
  if (H && H.ok) { o.house = { name: 'Nhà', pts: H.verts.map(function (v) { return rel(v.E, v.N); }) }; o.houseFront = H.front; o.houseDir = +H.dir.true.toFixed(4); o.houseM = rel(H.M.E, H.M.N); }
  return o;
}
function sendToDraw(file) {
  var o = toDrawPayload(); if (!o) { msg('Chưa có kết quả để gửi.'); return; }
  if (file) { var b = new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (S.name || 'thua-dat').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-') + '.tu-dinhtam.json'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); return; }
  try { localStorage.setItem('tientqn.dinhtam.todraw.v1', JSON.stringify(o)); } catch (e) { }
  try { document.dispatchEvent(new CustomEvent('tientqn:dinhtam:to-draw', { detail: o })); } catch (e) { }
  msg('Đã gửi khu đất' + (o.house ? ' và nhà' : '') + ' sang Công cụ vẽ (toạ độ' + (o.geo ? ' VN-2000' : ' cục bộ') + ', hướng Bắc thật). Nếu dùng riêng từng tệp, mở Công cụ vẽ → Tệp → "Nhận từ công cụ Định tâm".', true);
}
// ---------- sự kiện ----------
function bind() {
  root.addEventListener('click', function (e) {
    var t = e.target, a = t.dataset && t.dataset.act;
    if (t.dataset && t.dataset.mode) { S.mode = t.dataset.mode; syncForm(); renderTable(); recompute(); save(); return; }
    if (t.dataset && t.dataset.del != null) { var d = S.data[S.mode]; if (d.length > 3) { d.splice(parseInt(t.dataset.del, 10), 1); renderTable(); schedule(); } else msg('Cần giữ tối thiểu 3 điểm.'); return; }
    if (t.dataset && t.dataset.p != null) { curPage = parseInt(t.dataset.p, 10); renderPages(); return; }
    if (t.dataset && t.dataset.step) { I.step = t.dataset.step; imgStat(); return; }
    if (t.dataset && t.dataset.hmode) { S.house.mode = t.dataset.hmode; renderHouse(); save(); recompute(); return; }
    if (t.dataset && t.dataset.hdel != null) { var arr = t.dataset.t === 'uv' ? S.house.uv : t.dataset.t === 'trav' ? S.house.trav.rows : S.house.abs[tmode()]; if (arr.length > (t.dataset.t === 'trav' ? 2 : 3)) { arr.splice(parseInt(t.dataset.hdel, 10), 1); renderHTables(); schedule(); } else msg('Cần giữ tối thiểu 3 điểm.'); return; }
    var ed = t.closest && t.closest('[data-edge]'); if (ed) { if (ed.closest('#dt-hthumb')) { S.house.front = ed.dataset.edge; schedule(); } else { S.front = parseInt(ed.dataset.edge, 10); $('dt-front').value = String(S.front); schedule(); } return; }
    if (!a) return;
    if (a === 'sample') { var b = blank(); S = Object.assign(b, { name: SAMPLE.name, prov: SAMPLE.prov, mode: SAMPLE.mode, cm: SAMPLE.cm, k0: SAMPLE.k0, front: SAMPLE.front, data: JSON.parse(JSON.stringify(SAMPLE.data)) }); S.house = Object.assign(houseBlank(), JSON.parse(JSON.stringify(SAMPLE.house))); syncForm(); renderTable(); renderHTables(); syncHouseFields(); recompute(); msg('Đã nạp ví dụ: thửa đất hình thang (mặt tiền cạnh 3-4) và một căn nhà minh hoạ 8 × 12 m, chỉ để thử chức năng. Hãy thay bằng số liệu thật.', true); }
    else if (a === 'reset') { if (confirm('Xoá toàn bộ dữ liệu đang nhập?')) { S = blank(); syncForm(); renderTable(); renderHTables(); syncHouseFields(); recompute(); msg(''); } }
    else if (a === 'haddrow') { if (t.dataset.t === 'trav') S.house.trav.rows.push(['', '']); else { var ha = t.dataset.t === 'uv' ? S.house.uv : S.house.abs[tmode()]; ha.push(['N' + (ha.length + 1), '', '']); } renderHTables(); }
    else if (a === 'hundo') hcUndo();
    else if (a === 'hclear') { S.house.uv = [['N1', '', ''], ['N2', '', ''], ['N3', '', ''], ['N4', '', '']]; renderHTables(); schedule(); }
    else if (a === 'gotoimage') { S.mode = 'image'; syncForm(); root.querySelector('#dt-s1').scrollIntoView({ behavior: 'smooth' }); }
    else if (a === 'todraw') sendToDraw(false); else if (a === 'todrawfile') sendToDraw(true);
    else if (a === 'drawlast') { var lj = null; try { lj = localStorage.getItem('tientqn.draw.last.v1'); } catch (e2) { } if (lj) importDrawing(lj, 'Công cụ vẽ (bản gần nhất)'); else msg('Chưa có bản vẽ nào được gửi từ Công cụ vẽ trên trình duyệt này.'); }
    else if (a === 'drawparse') importDrawing($('dt-drawpaste').value, 'nội dung đã dán');
    else if (a === 'addrow') { var dd = S.data[S.mode]; dd.push([String(dd.length + 1), '', '']); renderTable(); }
    else if (a === 'parse') { var pr = C.parseText($('dt-paste').value); applyParsed(pr, 'văn bản đã dán'); }
    else if (a === 'ocr') runOCR();
    else if (a === 'toimage') { S.mode = 'image'; syncForm(); setTimeout(function () { setImage(scanCanvas); }, 30); }
    else if (a === 'imgundo') { if (I.step === 'verts') I.verts.pop(); else if (I.step === 'house') I.house.pop(); else if (I.step === 'scale') I.scale.pop(); else I.north.pop(); drawI(); imgStat(); }
    else if (a === 'imgclear') { I.verts = []; I.house = []; I.scale = []; I.north = []; drawI(); imgStat(); }
    else if (a === 'imguse') imageUse();
    else if (a === 'print') printPages();
    else if (a === 'pdfall') exportPdf('all');
    else if (a === 'pdfone') exportPdf('one');
    else if (a === 'svg') { if (pages) download(slug() + '-trang' + (curPage + 1) + '.svg', 'image/svg+xml', '<?xml version="1.0" encoding="UTF-8"?>\n' + pages.pages[curPage]); }
    else if (a === 'json') { var p = buildPayload(); if (p) download(slug() + '.json', 'application/json', JSON.stringify(p, null, 2)); }
    else if (a === 'csv') { var c = csvOut(); if (c) download(slug() + '-doan.csv', 'text/csv', c); }
    else if (a === 'copyjson') { var p2 = buildPayload(); if (p2 && navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(p2, null, 2)).then(function () { msg('Đã sao chép JSON.', true); }); }
    else if (a === 'send') { var p3 = buildPayload(); if (p3) { document.dispatchEvent(new CustomEvent('tientqn:dinhtam:send', { detail: { target: t.dataset.to, payload: p3 } })); msg('Đã gửi dữ liệu (sự kiện tientqn:dinhtam:send, đích: ' + (t.dataset.to === 'hkpt' ? 'Huyền Không Phi Tinh' : 'Lạc Việt') + '). Tab nhận cần có mã lắng nghe sự kiện này.', true); } }
  });
  root.addEventListener('input', function (e) {
    var t = e.target, id = t.id;
    if (t.closest && t.closest('#dt-body')) {
      var tr_ = t.closest('tr'), i = parseInt(tr_.dataset.i, 10), c = parseInt(t.dataset.c, 10);
      if (c === 1 && /[\n\t]/.test(t.value)) { pasteTable(t.value, i); return; }
      S.data[S.mode][i][c] = t.value; schedule(); return;
    }
    if (id === 'dt-cm') { S.cm = t.value; syncProv(); schedule(); return; }
    if (t.dataset && t.dataset.ht) { var tr2 = t.closest('tr'), i2 = parseInt(tr2.dataset.i, 10), c2 = parseInt(t.dataset.c, 10), arr2 = t.dataset.ht === 'uv' ? S.house.uv : t.dataset.ht === 'trav' ? S.house.trav.rows : S.house.abs[tmode()]; arr2[i2][c2] = t.value; schedule(); return; }
    var tm2 = { 'dt-tu0': 'u0', 'dt-tv0': 'v0', 'dt-tang': 'ang' }; if (tm2[id]) { S.house.trav[tm2[id]] = t.value; schedule(); return; }
    if (id === 'dt-gstep') { S.house.snap.step = t.value; save(); return; }
    if (id === 'dt-hzoom') { HC.zoom = parseFloat(t.value); hcApplyZoom(); return; }
    var hm = { 'dt-hW': 'W', 'dt-hD': 'D', 'dt-hL': 'L', 'dt-hF': 'F', 'dt-hrot': 'rot' }; if (hm[id]) { S.house.rect[hm[id]] = t.value; schedule(); return; }
    if (id === 'dt-hmanual') { S.house.manualAz = t.value; schedule(); return; }
    var map = { 'dt-name': ['name'], 'dt-ltheta': ['localTheta'], 'dt-manual': ['manualAz'], 'dt-warn': ['warnDeg'], 'dt-sn': ['scaleN'] };
    if (map[id]) { S[map[id][0]] = t.value; schedule(); }
    if (id === 'dt-decl') { S.decl = t.value; S.declSource = 'manual'; updateDeclHint(); schedule(); }
    if (id === 'dt-zoom') { I.zoom = parseFloat(t.value); applyZoom(); drawI(); }
    if (id === 'dt-calib' || id === 'dt-ratio' || id === 'dt-dpi') imgStat();
  });
  root.addEventListener('change', function (e) {
    var t = e.target, id = t.id;
    if (id === 'dt-prov') { if (t.value !== 'custom') { S.cm = String(C.PROVINCES[parseInt(t.value, 10)][1]); S.prov = t.value; $('dt-cm').value = S.cm; } else S.prov = ''; schedule(); }
    else if (id === 'dt-k0') { S.k0 = t.value; schedule(); }
    else if (id === 'dt-front') { S.front = parseInt(t.value, 10); schedule(); }
    else if (id === 'dt-dirmode') { S.dirMode = t.value; $('dt-manrow').hidden = S.dirMode !== 'manual'; schedule(); }
    else if (id === 'dt-ref') { S.ref = t.value; schedule(); }
    else if (id === 'dt-center') { S.center = t.value; schedule(); }
    else if (id === 'dt-unit') { S.unit = t.value; schedule(); }
    else if (id === 'dt-smode') { S.scaleMode = t.value; $('dt-nrow').hidden = t.value !== 'manual'; schedule(); }
    else if (id === 'dt-d24') { S.draw24 = t.checked; schedule(); }
    else if (id === 'dt-l24') { S.label24 = t.checked; schedule(); }
    else if (id === 'dt-henable') { S.house.enabled = t.checked; recompute(); save(); }
    else if (id === 'dt-tdir') { S.house.trav.dir = t.value; schedule(); }
    else if (id === 'dt-snpt' || id === 'dt-snor' || id === 'dt-sngr') { S.house.snap[{ 'dt-snpt': 'pt', 'dt-snor': 'or', 'dt-sngr': 'gr' }[id]] = t.checked; save(); }
    else if (id === 'dt-hfront') { S.house.front = t.value; schedule(); }
    else if (id === 'dt-hdirmode') { S.house.dirMode = t.value; schedule(); }
    else if (id === 'dt-drawfile') { var fr2 = new FileReader(); fr2.onload = function () { importDrawing(fr2.result, 'tệp ' + t.files[0].name); }; fr2.readAsText(t.files[0]); }
    else if (id === 'dt-file') onScanFile(t.files[0]);
    else if (id === 'dt-imgfile') { var f = t.files[0]; if (f) fileToCanvas(f).then(function (r) { setImage(r.canvas); }).catch(function (er) { msg(er.message); }); }
  });
  var hcv = $('dt-hcv'); hcv.addEventListener('pointerdown', hcDown); hcv.addEventListener('pointermove', hcMove); hcv.addEventListener('pointerup', hcUp); hcv.addEventListener('pointercancel', hcUp);
  var cv = $('dt-cv'); cv.addEventListener('pointerdown', onPointerDown); cv.addEventListener('pointermove', onPointerMove); cv.addEventListener('pointerup', onPointerUp); cv.addEventListener('pointercancel', onPointerUp);
}
function pasteTable(text, start) {
  var pr = C.parseText(text);
  if (pr.kind) { applyParsed(pr, 'nội dung dán'); return; }
  var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); }), d = S.data[S.mode], ok = 0;
  lines.forEach(function (l, k) { var cells = l.split(/[\t;]+|\s{2,}/).map(function (z) { return z.trim(); }).filter(Boolean), nums = cells.filter(function (z) { return isFinite(C.parseNum(z)); });
    if (nums.length >= 2) { var idx = start + k; if (!d[idx]) d[idx] = [String(idx + 1), '', '']; d[idx][1] = nums[nums.length - 2]; d[idx][2] = nums[nums.length - 1]; ok++; } });
  renderTable(); schedule(); if (ok) msg('Đã dán ' + ok + ' dòng.', true);
}

function syncHouseFields() { var tv = S.house.trav, sn = S.house.snap; $('dt-tu0').value = tv.u0; $('dt-tv0').value = tv.v0; $('dt-tang').value = tv.ang; $('dt-tdir').value = tv.dir; $('dt-snpt').checked = sn.pt; $('dt-snor').checked = sn.or; $('dt-sngr').checked = sn.gr; $('dt-gstep').value = sn.step; var r = S.house.rect; $('dt-hW').value = r.W; $('dt-hD').value = r.D; $('dt-hL').value = r.L; $('dt-hF').value = r.F; $('dt-hrot').value = r.rot; }
function mount(el, opts) {
  root = el; var st = document.createElement('style'); st.textContent = CSS; el.appendChild(st);
  var wrap = document.createElement('div'); wrap.innerHTML = HTML; el.appendChild(wrap.firstChild);
  root = el.querySelector('.dt-root');
  var sel = $('dt-prov'); sel.innerHTML = C.PROVINCES.map(function (p, i) { return '<option value="' + i + '">' + esc(p[0]) + ' (' + p[1] + '°)</option>'; }).join('') + '<option value="custom">Khác (nhập KTT)</option>';
  load(); if (opts && opts.input) S = Object.assign(S, opts.input);
  syncForm(); renderTable(); renderHTables(); syncHouseFields(); bind(); recompute();
  document.addEventListener('tientqn:draw:send', function (e) { importDrawing(e.detail, 'Công cụ vẽ'); });
  var thumb = $('dt-thumb'); thumb.addEventListener('click', function (e) { var ed = e.target.closest && e.target.closest('[data-edge]'); if (ed) { S.front = parseInt(ed.dataset.edge, 10); $('dt-front').value = String(S.front); schedule(); } });
  window.TIENTQN = window.TIENTQN || {};
  window.TIENTQN.dinhTam = {
    getResult: buildPayload, getRaw: function () { return R; }, getInput: function () { return JSON.parse(JSON.stringify(S)); },
    setInput: function (o) { S = Object.assign(S, o); syncForm(); renderTable(); recompute(); }, recompute: recompute,
    onChange: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; },
    pagesSvg: function () { return pages ? pages.pages.slice() : null; }, importDrawing: importDrawing, toDrawPayload: toDrawPayload, exportPdf: exportPdf, getHouseRaw: function () { return H; }, print: printPages
  };
  if (window.TIENTQN.dinhTam && !hasData()) { /* chờ người dùng nhập */ }
}
return { mount: mount };
})(DinhTamCore, DinhTamDraw);


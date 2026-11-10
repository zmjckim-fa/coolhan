const P = require('./products.json');
const norm = (n) => n.replace('USM Haller/유에스엠 할러 - ', '').replace(/^\[(국내재고|입고예정)\]\s*/, '').trim();
const rowsFromSpec = (s) => { // "1,2단" "1~3단" "3단"
  const out = new Set();
  for (const m of s.matchAll(/(\d+)\s*~\s*(\d+)\s*단/g)) for (let i = +m[1]; i <= +m[2]; i++) out.add(i);
  for (const m of s.matchAll(/(\d+(?:\s*,\s*\d+)*)\s*단/g)) m[1].split(',').forEach((x) => out.add(+x.trim()));
  return out;
};
const data = new Map();
for (const p of P) {
  if (!p.categories.includes('USM 일반배송')) continue;
  const n = norm(p.name);
  const g = n.match(/^(\d+)x(\d+)(.*)$/);
  if (!g) continue;
  if (/\[B급\]|Pedestal|티비장|타입|Unit/.test(n)) continue;
  const m = +g[1], r = +g[2], rest = g[3];
  const noDoorM = rest.match(/([\d,~\s]*단)?\s*(도어없음)/);
  let nodoorRows = 0;
  const parts = rest.replace(/^[\s(]+|[\s)]+$/g, '').split(',');
  // per-row clauses are hard to split; use regex on named tokens
  const nd = [...rest.matchAll(/((?:\d+(?:\s*[,~]\s*\d+)*)단)?\s*도어없음/g)];
  for (const x of nd) nodoorRows += x[1] ? rowsFromSpec(x[1]).size : r;
  const op = [...rest.matchAll(/((?:\d+(?:\s*[,~]\s*\d+)*)단)?\s*오픈/g)];
  let openRows = 0; for (const x of op) openRows += x[1] ? rowsFromSpec(x[1]).size : 0;
  const dr = /서랍/.test(rest) ? 1 : 0;
  const mag = /매거진랙/.test(rest) ? 1 : 0;
  const w500 = /가로500/.test(rest) ? 1 : 0, w350 = /가로350/.test(rest) ? 1 : 0, d500 = /깊이500/.test(rest) ? 1 : 0;
  const h175 = (rest.match(/175/g) || []).length, h250 = (rest.match(/250/g) || []).length;
  const key = n;
  data.set(key, { y: p.price, x: [1, m, r, m * r, nodoorRows * m, openRows * m, dr, mag, w500, w350, d500, h175, h250], n, m, r });
}
const names = ['const', 'm(가로칸)', 'n(세로단)', 'm*n', '도어없음 칸', '오픈 칸', '서랍', '매거진랙', '가로500', '가로350', '깊이500', '175 표기', '250 표기'];
const rows = [...data.values()];
function solve(X, y) { // ridge-free normal equations
  const k = X[0].length; const A = Array.from({ length: k }, () => Array(k + 1).fill(0));
  for (let i = 0; i < X.length; i++) for (let a = 0; a < k; a++) { for (let b = 0; b < k; b++) A[a][b] += X[i][a] * X[i][b]; A[a][k] += X[i][a] * y[i]; }
  for (let a = 0; a < k; a++) A[a][a] += 1e-6;
  for (let c = 0; c < k; c++) { let p = c; for (let r = c + 1; r < k; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]]; const d = A[c][c]; for (let j = c; j <= k; j++) A[c][j] /= d; for (let r = 0; r < k; r++) if (r !== c) { const f = A[r][c]; for (let j = c; j <= k; j++) A[r][j] -= f * A[c][j]; } }
  return A.map((r) => r[k]);
}
const X = rows.map((r) => r.x), y = rows.map((r) => r.y);
const beta = solve(X, y);
const pred = X.map((x) => x.reduce((s, v, i) => s + v * beta[i], 0));
const mean = y.reduce((a, b) => a + b, 0) / y.length;
const ssr = y.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0), sst = y.reduce((s, v) => s + (v - mean) ** 2, 0);
console.log('n =', rows.length, 'R2 =', (1 - ssr / sst).toFixed(4), 'RMSE =', Math.round(Math.sqrt(ssr / y.length)).toLocaleString());
console.log(names.map((nm, i) => nm + ': ' + Math.round(beta[i]).toLocaleString()).join('\n'));
const res = rows.map((r, i) => ({ n: r.n, y: r.y, p: Math.round(pred[i]), e: Math.round(r.y - pred[i]) })).sort((a, b) => Math.abs(b.e) - Math.abs(a.e));
console.log('worst residuals'); res.slice(0, 12).forEach((r) => console.log(r.n, r.y.toLocaleString(), r.p.toLocaleString(), r.e.toLocaleString()));
const abs = res.map((r) => Math.abs(r.e) / r.y).sort((a, b) => a - b);
console.log('median |err|/price', (abs[Math.floor(abs.length / 2)] * 100).toFixed(1) + '%', 'p90', (abs[Math.floor(abs.length * .9)] * 100).toFixed(1) + '%');
// plain grids only (m x r, 도어없음/오픈 없음 표기 없음)
const plain = [...data.entries()].filter(([k]) => /^\d+x\d+$/.test(k)).map(([k, v]) => [k, v.y]);
console.log('plain MxN names', plain.length, plain.slice(0, 12));
// color price differences
const colorVar = P.filter((p) => new Set(p.option_combinations.map((o) => o.option_price)).size > 1).length;
console.log('products with color-dependent price', colorVar);
// fast vs general ratio
const f = new Map(), g = new Map();
for (const p of P) { const k = norm(p.name); if (p.categories.includes('USM 빠른배송')) f.set(k, p.price); if (p.categories.includes('USM 일반배송')) g.set(k, p.price); }
const rat = [...f].filter(([k]) => g.has(k)).map(([k, v]) => v / g.get(k)); console.log('fast/general pairs', rat.length, Math.min(...rat).toFixed(4), Math.max(...rat).toFixed(4));
fs = require('fs'); fs.writeFileSync('price-model.json', JSON.stringify({ n: rows.length, r2: 1 - ssr / sst, features: names, beta, worst: res.slice(0, 30) }, null, 1));

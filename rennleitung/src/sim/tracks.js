// Strecken: echte Streckenverläufe (siehe trackData.js), zu einer glatten Kurve interpoliert. Aus der Krümmung wird ein Geschwindigkeitsprofil berechnet und
// so kalibriert, dass die Rundenzeit zur Referenz passt.

import { TRACK_DATA } from './trackData.js'

const TRACKS = {
  spa: {
    name: 'Circuit de Spa-Francorchamps',
    gp: 'Großer Preis von Belgien',
    length: 7004,
    lapRef: 107,
    vmax: 335,
    start: 0,
    // [Kurvennummer, Position in Metern der Rohdaten, Name]
    corners: [
      [1, 265, 'La Source'], [2, 990, 'Eau Rouge'], [3, 1080, 'Raidillon'], [5, 2275, 'Les Combes'], [7, 2510, 'Malmedy'],
      [8, 2965, 'Bruxelles'], [9, 3190, "Speaker's Corner"], [10, 3719, 'Pouhon'], [12, 4389, 'Fagnes'], [14, 4834, 'Stavelot'],
      [15, 5039, 'Paul Frère'], [17, 6059, 'Blanchimont'], [18, 6684, 'Bus Stop'],
    ],
  },
  monza: {
    name: 'Autodromo Nazionale Monza',
    gp: 'Großer Preis von Italien',
    length: 5793,
    lapRef: 83,
    vmax: 345,
    start: 0,
    corners: [
      [1, 675, 'Variante del Rettifilo'], [3, 1100, 'Curva Grande'], [4, 1789, 'Variante della Roggia'], [6, 2254, 'Lesmo 1'],
      [7, 2564, 'Lesmo 2'], [8, 3700, 'Variante Ascari'], [11, 4900, 'Parabolica'],
    ],
  },
  monaco: {
    name: 'Circuit de Monaco',
    gp: 'Großer Preis von Monaco',
    length: 3337,
    lapRef: 73,
    vmax: 290,
    start: 2400, // Rohdaten beginnen am Casino, Start/Ziel liegt vor Sainte Dévote
    corners: [
      [1, 2677, 'Sainte Dévote'], [2, 3000, 'Beau Rivage'], [3, 150, 'Massenet'], [4, 250, 'Casino'], [5, 340, 'Mirabeau Haute'],
      [6, 430, 'Grand Hotel'], [7, 500, 'Mirabeau Bas'], [8, 590, 'Portier'], [9, 900, 'Tunnel'], [10, 1266, 'Nouvelle Chicane'],
      [12, 1521, 'Tabac'], [13, 1700, 'Piscine'], [15, 1876, 'Piscine 2'], [17, 2051, 'Rascasse'], [19, 2110, 'Anthony Noghès'],
    ],
  },
}

export const TRACK_LIST = Object.entries(TRACKS).map(([key, t]) => ({ key, name: t.name, gp: t.gp }))

const cache = {}

const angDiff = (a, b) => {
  let d = b - a
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

export function buildTrack(key) {
  if (cache[key]) return cache[key]
  const def = TRACKS[key]
  const pts = TRACK_DATA[key]
  const m = pts.length

  // 1) Catmull-Rom (geschlossen), dicht abgetastet
  const dense = []
  const S = 24
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m]
    for (let k = 0; k < S; k++) {
      const t = k / S, t2 = t * t, t3 = t2 * t
      const f = (a, b, c, d) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  const cum = [0]
  for (let i = 1; i <= dense.length; i++) {
    const a = dense[i - 1], b = dense[i % dense.length]
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  const raw = cum[dense.length]
  const k = def.length / raw

  // 2) Gleichmäßig in Metern neu abtasten
  const N = Math.round(def.length / 5)
  const ds = def.length / N
  const xs = new Float32Array(N), ys = new Float32Array(N)
  let j = 0
  for (let i = 0; i < N; i++) {
    const target = ((i * ds) / k + def.start) % raw
    if (cum[j] > target) j = 0
    while (j < dense.length - 1 && cum[j + 1] < target) j++
    const seg = cum[j + 1] - cum[j] || 1
    const u = (target - cum[j]) / seg
    const a = dense[j], b = dense[(j + 1) % dense.length]
    xs[i] = (a[0] + (b[0] - a[0]) * u) * k
    ys[i] = (a[1] + (b[1] - a[1]) * u) * k
  }

  // 3) Richtung & Krümmung
  const h = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const a = (i - 1 + N) % N, b = (i + 1) % N
    h[i] = Math.atan2(ys[b] - ys[a], xs[b] - xs[a])
  }
  const w = Math.max(2, Math.round(45 / ds))
  let curv = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    curv[i] = Math.abs(angDiff(h[(i - w + N) % N], h[(i + w) % N])) / (2 * w * ds)
  }
  const sm = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    let s = 0
    for (let q = -3; q <= 3; q++) s += curv[(i + q + N) % N]
    sm[i] = s / 7
  }

  // 4) Geschwindigkeitsprofil (m/s)
  const aLat = 30, aBrake = 38, aAccel = 13
  const vmaxMs = def.vmax / 3.6
  const v = new Float32Array(N)
  for (let i = 0; i < N; i++) v[i] = Math.min(vmaxMs, Math.max(22, Math.sqrt(aLat / Math.max(sm[i], 1e-4))))
  for (let pass = 0; pass < 3; pass++) {
    for (let i = N * 2 - 1; i >= 0; i--) {
      const a = i % N, b = (i + 1) % N
      v[a] = Math.min(v[a], Math.sqrt(v[b] * v[b] + 2 * aBrake * ds))
    }
    for (let i = 0; i < N * 2; i++) {
      const a = i % N, p = (i - 1 + N) % N
      v[a] = Math.min(v[a], Math.sqrt(v[p] * v[p] + 2 * aAccel * ds))
    }
  }
  // Rundenzeit kalibrieren
  let lap = 0
  for (let i = 0; i < N; i++) lap += ds / v[i]
  const f = lap / def.lapRef
  for (let i = 0; i < N; i++) v[i] *= f

  // 5) Benannte Kurven auf die Abtastpunkte legen
  const corners = def.corners
    .map(([n, sRaw, name]) => ({ n, name, idx: Math.round((((sRaw - def.start + raw) % raw) * k) / ds) % N }))
    .sort((a, b) => a.idx - b.idx)
  // Randsteine dort, wo die Strecke spürbar gekrümmt ist
  const kerb = new Uint8Array(N)
  for (let i = 0; i < N; i++) kerb[i] = sm[i] > 1 / 260 ? 1 : 0

  const track = {
    key,
    name: def.name,
    gp: def.gp,
    length: def.length,
    lapRef: def.lapRef,
    n: N,
    ds,
    xs,
    ys,
    h,
    v,
    corners,
    kerb,
    cornerAt(s) {
      const idx = Math.floor(s / ds) % N
      let best = corners[0], bd = Infinity
      for (const c of corners) {
        const d = Math.min(Math.abs(c.idx - idx), N - Math.abs(c.idx - idx))
        if (d < bd) { bd = d; best = c }
      }
      return best
    },
    turnAt(s) {
      const idx = Math.floor(s / ds) % N
      let best = 1, bd = Infinity
      for (const c of corners) {
        const d = Math.min(Math.abs(c.idx - idx), N - Math.abs(c.idx - idx))
        if (d < bd) { bd = d; best = c.n }
      }
      return best
    },
  }
  cache[key] = track
  return track
}

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
    // Boxengasse rechts: Einfahrt nach der Bus-Stop-Schikane, Ausfahrt innen an La Source vorbei
    pit: { side: 1, in: 290, par: 150, out: 420, off: 15 },
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
    // Boxengasse rechts: Einfahrt nach der Parabolica, Ausfahrt vor der ersten Schikane
    pit: { side: 1, in: 420, par: 330, out: 470, off: 15 },
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
    // Boxengasse rechts: Einfahrt nach Anthony Noghès, Ausfahrt hinter Sainte Dévote
    pit: { side: 1, in: 240, par: 200, out: 350, off: 13 },
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
  // Sehr dicht liegende Rohpunkte entfernen, sie erzeugen sonst Schleifen in der Kurve
  const pts = []
  for (const q of TRACK_DATA[key]) {
    const l = pts[pts.length - 1]
    if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 7) pts.push(q)
  }
  if (Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) <= 7) pts.pop()
  const m = pts.length

  // 1) Zentripetale Catmull-Rom-Kurve (geschlossen): keine Überschwinger bei ungleichen Punktabständen
  const dense = []
  const S = 24
  const knot = (a, b) => Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])) || 1e-3
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m]
    const t0 = 0, t1 = t0 + knot(p0, p1), t2 = t1 + knot(p1, p2), t3 = t2 + knot(p2, p3)
    for (let k = 0; k < S; k++) {
      const t = t1 + ((t2 - t1) * k) / S
      const pt = [0, 0]
      for (let d = 0; d < 2; d++) {
        const A1 = ((t1 - t) / (t1 - t0)) * p0[d] + ((t - t0) / (t1 - t0)) * p1[d]
        const A2 = ((t2 - t) / (t2 - t1)) * p1[d] + ((t - t1) / (t2 - t1)) * p2[d]
        const A3 = ((t3 - t) / (t3 - t2)) * p2[d] + ((t - t2) / (t3 - t2)) * p3[d]
        const B1 = ((t2 - t) / (t2 - t0)) * A1 + ((t - t0) / (t2 - t0)) * A2
        const B2 = ((t3 - t) / (t3 - t1)) * A2 + ((t - t1) / (t3 - t1)) * A3
        pt[d] = ((t2 - t) / (t2 - t1)) * B1 + ((t - t1) / (t2 - t1)) * B2
      }
      dense.push(pt)
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

  // Leicht glätten, damit Richtung und Tempo ruhig verlaufen
  for (let pass = 0; pass < 2; pass++) {
    const nx = new Float32Array(N), ny = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const a = (i - 1 + N) % N, b = (i + 1) % N
      nx[i] = (xs[a] + 2 * xs[i] + xs[b]) / 4
      ny[i] = (ys[a] + 2 * ys[i] + ys[b]) / 4
    }
    xs.set(nx); ys.set(ny)
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

  // 6) Boxengasse: parallel zur Strecke versetzt, Einfahrt als sanfter Übergang, Ausfahrt als eigene Kurve
  const P = def.pit
  const at = (sm_) => {
    const f = (((sm_ % def.length) + def.length) % def.length) / ds
    const i = Math.floor(f) % N, j2 = (i + 1) % N, u = f - Math.floor(f)
    return { x: xs[i] + (xs[j2] - xs[i]) * u, y: ys[i] + (ys[j2] - ys[i]) * u, h: h[i] }
  }
  const ss = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))
  const rawPit = []
  const TAPER = 90
  for (let d = 0; d <= P.in + P.par; d += 2) {
    const q = at(-P.in + d)
    const o = P.off * P.side * ss(d / TAPER)
    rawPit.push([q.x - Math.sin(q.h) * o, q.y + Math.cos(q.h) * o])
  }
  {
    const a = at(P.par), b = at(P.out)
    const p0 = [a.x - Math.sin(a.h) * P.off * P.side, a.y + Math.cos(a.h) * P.off * P.side]
    const p3 = [b.x, b.y]
    const dd = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) * 0.42
    const p1 = [p0[0] + Math.cos(a.h) * dd, p0[1] + Math.sin(a.h) * dd]
    const p2 = [p3[0] - Math.cos(b.h) * dd, p3[1] - Math.sin(b.h) * dd]
    for (let i = 1; i <= 60; i++) {
      const t = i / 60, m1 = 1 - t
      rawPit.push([
        m1 ** 3 * p0[0] + 3 * m1 * m1 * t * p1[0] + 3 * m1 * t * t * p2[0] + t ** 3 * p3[0],
        m1 ** 3 * p0[1] + 3 * m1 * m1 * t * p1[1] + 3 * m1 * t * t * p2[1] + t ** 3 * p3[1],
      ])
    }
  }
  const pc = [0]
  for (let i = 1; i < rawPit.length; i++) pc.push(pc[i - 1] + Math.hypot(rawPit[i][0] - rawPit[i - 1][0], rawPit[i][1] - rawPit[i - 1][1]))
  const pLen = pc[pc.length - 1]
  const PN = Math.floor(pLen / 2)
  const pxs = new Float32Array(PN + 1), pys = new Float32Array(PN + 1), phs = new Float32Array(PN + 1)
  for (let i = 0, q = 0; i <= PN; i++) {
    const tgt = (i / PN) * pLen
    while (q < rawPit.length - 2 && pc[q + 1] < tgt) q++
    const u = (tgt - pc[q]) / (pc[q + 1] - pc[q] || 1)
    pxs[i] = rawPit[q][0] + (rawPit[q + 1][0] - rawPit[q][0]) * u
    pys[i] = rawPit[q][1] + (rawPit[q + 1][1] - rawPit[q][1]) * u
  }
  for (let i = 0; i <= PN; i++) {
    const a = Math.max(0, i - 1), b = Math.min(PN, i + 1)
    phs[i] = Math.atan2(pys[b] - pys[a], pxs[b] - pxs[a])
  }
  const uA = pc[Math.round(TAPER / 2)] // Beginn Tempolimit (Ende der Einfahrt)
  const uB = pc[Math.round((P.in + P.par) / 2)] // Ende Tempolimit (Beginn der Ausfahrt)
  const pit = {
    side: P.side,
    xs: pxs, ys: pys, h: phs, n: PN, len: pLen, step: pLen / PN,
    inS: def.length - P.in, // Einfahrt, Position auf der Strecke
    span: P.in + P.out, // Streckenmeter, die die Boxengasse überbrückt
    uA, uB,
    boxU: (i, count) => uA + 25 + ((uB - uA - 50) * i) / Math.max(1, count - 1),
    at(u) {
      const f = Math.max(0, Math.min(PN - 0.001, u / (pLen / PN)))
      const i = Math.floor(f), t = f - i
      let dh = phs[i + 1] - phs[i]
      if (dh > Math.PI) dh -= 2 * Math.PI
      if (dh < -Math.PI) dh += 2 * Math.PI
      return { x: pxs[i] + (pxs[i + 1] - pxs[i]) * t, y: pys[i] + (pys[i + 1] - pys[i]) * t, h: phs[i] + dh * t }
    },
  }

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
    pit,
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

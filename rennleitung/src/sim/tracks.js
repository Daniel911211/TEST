// Strecken: grob nachgezeichnete Umrisse (Kontrollpunkte), die zu einer glatten Kurve
// interpoliert werden. Aus der Krümmung wird ein Geschwindigkeitsprofil berechnet und
// so kalibriert, dass die Rundenzeit zur Referenz passt.

const TRACKS = {
  spa: {
    name: 'Circuit de Spa-Francorchamps',
    gp: 'Großer Preis von Belgien',
    length: 7004,
    lapRef: 107,
    vmax: 335,
    pts: [
      [900, 600], [820, 602], [765, 608], [725, 602], [695, 580], [692, 562], [705, 563], [717, 585],
      [722, 615], [735, 655], [752, 700], [790, 752], [840, 808], [885, 840], [925, 846], [948, 822],
      [950, 790], [942, 760], [955, 722], [992, 700], [1035, 690], [1062, 680], [1077, 655],
      [1076, 630], [1058, 614], [1030, 607], [975, 603],
    ],
  },
  monza: {
    name: 'Autodromo Nazionale Monza',
    gp: 'Großer Preis von Italien',
    length: 5793,
    lapRef: 83,
    vmax: 345,
    pts: [
      [40, 80], [65, 80], [82, 79], [90, 74], [86, 68], [90, 62], [92, 45], [90, 30], [84, 20],
      [74, 16], [66, 18], [60, 26], [52, 32], [44, 28], [38, 22], [30, 26], [28, 36], [34, 44],
      [26, 50], [18, 56], [10, 66], [8, 74], [15, 78],
    ],
  },
  monaco: {
    name: 'Circuit de Monaco',
    gp: 'Großer Preis von Monaco',
    length: 3337,
    lapRef: 73,
    vmax: 290,
    pts: [
      [30, 64], [48, 60], [64, 52], [78, 50], [86, 44], [80, 36], [70, 34], [62, 26], [54, 20],
      [44, 22], [38, 30], [30, 28], [22, 34], [14, 42], [8, 50], [10, 60],
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
  const pts = def.pts
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
    const target = (i * ds) / k
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

  // 5) Kurven nummerieren: lokale Minima des Geschwindigkeitsprofils mit Prominenz
  const win = Math.round(100 / ds), far = Math.round(300 / ds)
  const mins = []
  for (let i = 0; i < N; i++) {
    let isMin = true
    for (let q = -win; q <= win; q++) if (v[(i + q + N) % N] < v[i] - 1e-6) { isMin = false; break }
    if (!isMin) continue
    let hi = 0
    for (let q = -far; q <= far; q++) hi = Math.max(hi, v[(i + q + N) % N])
    if (v[i] < hi * 0.88) mins.push(i)
  }
  const corners = []
  for (const i of mins) {
    const last = corners[corners.length - 1]
    if (last && (i - last.idx) * ds < 150) continue
    corners.push({ idx: i })
  }
  corners.forEach((c, i) => (c.n = i + 1))

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

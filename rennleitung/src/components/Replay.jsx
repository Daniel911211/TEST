import { useEffect, useRef, useState } from 'react'

const W = 640, H = 360
const FRAMES = 240
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))
const lerp = (a, b, t) => a + (b - a) * t

// Formel-1-Auto von oben, in Metern, Nase zeigt nach oben (-y).
// paint: Farbe oder { body, accent }. Die Radpositionen sind Messgrundlage für Track Limits und Startbox.
export function drawCar(ctx, x, y, ang, paint, k) {
  const body = typeof paint === 'string' ? paint : paint.body
  const accent = typeof paint === 'string' ? '#f2f2f2' : paint.accent
  const carbon = '#16181d'
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.scale(k, k)
  const poly = (pts, fill) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)))
    ctx.closePath()
    ctx.fill()
  }
  // Querlenker
  ctx.strokeStyle = carbon
  ctx.lineWidth = 0.09
  ctx.beginPath()
  for (const sx of [-1, 1]) {
    ctx.moveTo(sx * 0.2, -2.0); ctx.lineTo(sx * 0.7, -1.95)
    ctx.moveTo(sx * 0.22, -1.55); ctx.lineTo(sx * 0.7, -1.7)
    ctx.moveTo(sx * 0.4, 1.5); ctx.lineTo(sx * 0.7, 1.6)
    ctx.moveTo(sx * 0.35, 1.95); ctx.lineTo(sx * 0.7, 1.85)
  }
  ctx.stroke()
  // Reifen
  ctx.fillStyle = '#0c0d10'
  for (const [wx, wy, ww, wh] of [[-1.2, -2.2, 0.6, 0.78], [0.6, -2.2, 0.6, 0.78], [-1.3, 1.3, 0.7, 0.85], [0.6, 1.3, 0.7, 0.85]]) {
    ctx.beginPath()
    ctx.roundRect(wx, wy, ww, wh, 0.14)
    ctx.fill()
  }
  // Unterboden
  poly([[-0.5, -1.0], [0.5, -1.0], [0.92, -0.5], [0.92, 1.1], [0.5, 2.25], [-0.5, 2.25], [-0.92, 1.1], [-0.92, -0.5]], carbon)
  // Frontflügel mit Endplatten
  poly([[-1.2, -2.72], [-1.2, -2.98], [-0.3, -3.08], [0, -3.12], [0.3, -3.08], [1.2, -2.98], [1.2, -2.72], [0.3, -2.8], [-0.3, -2.8]], carbon)
  poly([[-1.2, -2.9], [-0.35, -3.0], [-0.35, -2.9], [-1.2, -2.8]], accent)
  poly([[1.2, -2.9], [0.35, -3.0], [0.35, -2.9], [1.2, -2.8]], accent)
  // Nase, Monocoque, Seitenkästen, Motorabdeckung
  poly([
    [0, -3.14], [0.13, -3.0], [0.19, -1.9], [0.3, -1.2], [0.42, -0.95], [0.8, -0.7], [0.84, 0.45], [0.6, 1.2], [0.32, 1.9], [0.22, 2.35],
    [-0.22, 2.35], [-0.32, 1.9], [-0.6, 1.2], [-0.84, 0.45], [-0.8, -0.7], [-0.42, -0.95], [-0.3, -1.2], [-0.19, -1.9], [-0.13, -3.0],
  ], body)
  // Lufteinlässe der Seitenkästen
  poly([[0.44, -0.9], [0.78, -0.68], [0.78, -0.55], [0.44, -0.72]], carbon)
  poly([[-0.44, -0.9], [-0.78, -0.68], [-0.78, -0.55], [-0.44, -0.72]], carbon)
  // Akzentstreifen auf Nase und Motorabdeckung
  poly([[-0.06, -2.95], [0.06, -2.95], [0.09, -1.5], [-0.09, -1.5]], accent)
  poly([[-0.07, 0.55], [0.07, 0.55], [0.05, 2.3], [-0.05, 2.3]], accent)
  // Cockpit, Helm, Halo
  ctx.fillStyle = carbon
  ctx.beginPath(); ctx.ellipse(0, -0.5, 0.27, 0.6, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffd94a'
  ctx.beginPath(); ctx.arc(0, -0.38, 0.19, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#2b2e36'
  ctx.lineWidth = 0.08
  ctx.beginPath(); ctx.ellipse(0, -0.5, 0.27, 0.5, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, -1.0); ctx.lineTo(0, -0.6); ctx.stroke()
  // Airbox
  ctx.fillStyle = carbon
  ctx.beginPath(); ctx.ellipse(0, 0.12, 0.13, 0.18, 0, 0, Math.PI * 2); ctx.fill()
  // Heckflügel mit Endplatten
  poly([[-0.8, 2.32], [0.8, 2.32], [0.8, 2.72], [-0.8, 2.72]], carbon)
  poly([[-0.72, 2.4], [0.72, 2.4], [0.72, 2.52], [-0.72, 2.52]], accent)
  poly([[-0.86, 2.2], [-0.76, 2.2], [-0.76, 2.78], [-0.86, 2.78]], body)
  poly([[0.86, 2.2], [0.76, 2.2], [0.76, 2.78], [0.86, 2.78]], body)
  ctx.restore()
}

// Safety Car: silberner Straßensportwagen von oben, Nase zeigt nach oben (-y)
// med = true zeichnet den roten Arztwagen (Medical Car) mit weißem Kreuz auf dem Dach
export function drawSafetyCar(ctx, x, y, ang, k, lights, now, med = false) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.scale(k, k)
  ctx.fillStyle = '#14161b'
  for (const [wx, wy] of [[-1.1, -1.75], [0.85, -1.75], [-1.1, 0.95], [0.85, 0.95]]) ctx.fillRect(wx, wy, 0.25, 0.85)
  // Karosserie
  ctx.fillStyle = med ? '#d0312d' : '#c9ced6'
  ctx.beginPath()
  ctx.moveTo(-0.7, -2.4); ctx.quadraticCurveTo(0, -2.65, 0.7, -2.4)
  ctx.quadraticCurveTo(1.0, -2.2, 1.0, -1.4); ctx.lineTo(1.0, 1.9)
  ctx.quadraticCurveTo(1.0, 2.35, 0.6, 2.4); ctx.lineTo(-0.6, 2.4)
  ctx.quadraticCurveTo(-1.0, 2.35, -1.0, 1.9); ctx.lineTo(-1.0, -1.4)
  ctx.quadraticCurveTo(-1.0, -2.2, -0.7, -2.4)
  ctx.fill()
  // Scheiben und Dach
  ctx.fillStyle = '#1d2630'
  ctx.beginPath(); ctx.moveTo(-0.78, -0.75); ctx.lineTo(0.78, -0.75); ctx.lineTo(0.66, -0.1); ctx.lineTo(-0.66, -0.1); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(-0.66, 1.0); ctx.lineTo(0.66, 1.0); ctx.lineTo(0.76, 1.5); ctx.lineTo(-0.76, 1.5); ctx.closePath(); ctx.fill()
  ctx.fillStyle = med ? '#a3211e' : '#9aa1ab'
  ctx.fillRect(-0.66, -0.1, 1.32, 1.1)
  if (med) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-0.1, 0.62, 0.2, 0.34)
    ctx.fillRect(-0.24, 0.72, 0.48, 0.14)
  }
  // Scheinwerfer und Rücklichter
  ctx.fillStyle = '#fff7c2'; ctx.fillRect(-0.85, -2.38, 0.35, 0.16); ctx.fillRect(0.5, -2.38, 0.35, 0.16)
  ctx.fillStyle = '#d93a3a'; ctx.fillRect(-0.85, 2.22, 0.4, 0.14); ctx.fillRect(0.45, 2.22, 0.4, 0.14)
  // Lichtbalken auf dem Dach: blinkt abwechselnd orange, vor dem Reinkommen aus
  const ph = Math.floor(now / 220) % 2
  // lights: 'green' = sammelt das Feld ein, Überholen des Safety Cars erlaubt; 'orange' = Überholverbot
  const col = lights === 'green' ? '#2fe08a' : '#ffb020'
  const off = lights === 'green' ? '#1c3a2a' : '#4a3a1a'
  ctx.fillStyle = lights && ph === 0 ? col : off; ctx.fillRect(-0.6, 0.3, 0.55, 0.3)
  ctx.fillStyle = lights && ph === 1 ? col : off; ctx.fillRect(0.05, 0.3, 0.55, 0.3)
  if (lights) {
    ctx.fillStyle = lights === 'green' ? 'rgba(47,224,138,0.22)' : 'rgba(255,176,32,0.22)'
    ctx.beginPath(); ctx.arc(ph ? 0.33 : -0.33, 0.45, 1.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

// Fahrerkürzel am Auto; das als schuldig gewählte Auto bekommt zusätzlich einen pulsierenden Ring
function mark(ctx, x, y, k, code, active, now, left = false, place = null) {
  const r = 3.6 * k
  if (active) {
    ctx.strokeStyle = `rgba(255,210,31,${0.55 + 0.45 * Math.sin(now / 160)})`
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.font = '700 11px ui-monospace, monospace'
  const text = active ? `${code} · SCHULD` : code
  const w = ctx.measureText(text).width + 10
  let lx = left ? Math.max(4, x - r * 0.75 - w) : Math.min(W - w - 4, x + r * 0.75), ly = Math.max(4, y - r - 6)
  // place: Schild mittig direkt über oder unter dem Auto, damit es nicht am Nachbarauto landet
  if (place) {
    lx = Math.max(4, Math.min(W - w - 4, x - w / 2))
    ly = place === 'above' ? Math.max(4, y - 1.7 * k - 21) : Math.min(H - 21, y + 1.7 * k + 4)
  }
  ctx.fillStyle = active ? '#ffd21f' : 'rgba(8,10,14,0.85)'
  ctx.fillRect(lx, ly, w, 17)
  ctx.fillStyle = active ? '#10141c' : '#e8edf7'
  ctx.textAlign = 'left'
  ctx.fillText(text, lx + 5, ly + 12.5)
}

function kerbV(ctx, S, x0, x1, cy, k) {
  const y0 = cy - H / 2 / k - 2, y1 = cy + H / 2 / k + 2
  for (let y = Math.floor(y0 / 1.2) * 1.2, i = 0; y < y1; y += 1.2, i++) {
    ctx.fillStyle = Math.floor(y / 1.2) % 2 ? '#d93a3a' : '#f1f1f1'
    const [sx0, sy0] = S(x0, y)
    const [sx1, sy1] = S(x1, y + 1.2)
    ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0 + 1)
  }
}

function label(ctx, text, x, y, color = '#ffd21f', align = 'left') {
  ctx.font = '700 11px ui-monospace, monospace'
  const w = ctx.measureText(text).width + 12
  const bx = align === 'right' ? x - w : x
  ctx.fillStyle = 'rgba(8,10,14,0.85)'
  ctx.fillRect(bx, y, w, 18)
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.fillText(text, bx + 6, y + 13)
}

export default function Replay({ inc, carA, carB, highlight = null, track = null }) {
  const cv = useRef(null)
  const [p, setP] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [tempo, setTempo] = useState(0.5)
  const [zoom, setZoom] = useState(1)
  const [fixed, setFixed] = useState(false)
  const [overlay, setOverlay] = useState(false)
  const st = useRef({})
  st.current = { p, playing, tempo, zoom, fixed, overlay, inc, carA, carB, highlight, track }
  const kind = inc.replay.kind

  useEffect(() => {
    const ctx = cv.current.getContext('2d')
    let raf, last = performance.now()
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.playing) {
        let np = s.p + (dt * s.tempo) / 8
        if (np >= 1) { np = 1; setPlaying(false) }
        st.current.p = np
        setP(np)
      }
      draw(ctx, st.current, now)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [inc.id])

  const frame = String(Math.floor(p * (FRAMES - 1))).padStart(3, '0')
  const togglePlay = () => {
    if (!playing && p >= 1) setP(0)
    setPlaying(!playing)
  }

  return (
    <div className="replay">
      <canvas ref={cv} width={W} height={H} className="replaycanvas" />
      <div className="replaybar">
        <button className="btn sm" onClick={togglePlay}>{playing ? 'PAUSE' : 'PLAY'}</button>
        <span className="dim">TEMPO</span>
        {[0.1, 0.25, 0.5, 1].map((t) => (
          <button key={t} className={`btn sm ${tempo === t ? 'on' : ''}`} onClick={() => setTempo(t)}>{t}×</button>
        ))}
        <input className="scrub" type="range" min="0" max="1000" value={Math.round(p * 1000)} onChange={(e) => { setPlaying(false); setP(e.target.value / 1000) }} />
      </div>
      <div className="replaybar">
        <span className="dim">ZOOM</span>
        <input type="range" min="1" max="6" step="0.1" value={zoom} onChange={(e) => setZoom(+e.target.value)} />
        <label className="chk"><input type="checkbox" checked={fixed} onChange={(e) => setFixed(e.target.checked)} /> Kamera fixieren</label>
        {kind === 'collision' && (
          <label className="chk"><input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} /> Richtlinien-Overlay (Achse/Spiegel)</label>
        )}
        <span className="dim right">F {frame}/{FRAMES}</span>
      </div>
    </div>
  )
}

function draw(ctx, s, now) {
  const { p, zoom, fixed, overlay, inc, carA, carB, tempo, highlight } = s
  const kind = inc.replay.kind
  ctx.clearRect(0, 0, W, H)
  ctx.font = '700 11px ui-monospace, monospace'
  const frame = String(Math.floor(p * (FRAMES - 1))).padStart(3, '0')
  let hud = `REPLAY · ${tempo}× · F ${frame}/${FRAMES}`

  if (kind === 'limits') {
    // Weiße Linie: Außenkante bei x = 6. Der linke Hinterreifen reicht bis 1,3 m links der Fahrzeugmitte.
    // Er ist der letzte Reifen auf der Strecke: liegt seine linke Kante jenseits von x = 6, sind alle vier Räder draußen.
    const over = inc.replay.over
    const xmax = 7.3 + over
    const bump = Math.sin(Math.PI * p) ** 2
    const cx0 = lerp(-1.5, xmax, bump)
    const cy0 = 15 - 30 * p
    const k = (H / 22) * zoom
    const camX = fixed ? 1 : cx0 * 0.7
    const camY = fixed ? 0 : cy0
    const S = (x, y) => [W / 2 + (x - camX) * k, H / 2 + (y - camY) * k]
    ctx.fillStyle = '#1f5a2a'; ctx.fillRect(0, 0, W, H)
    let [a] = S(-10, 0); let [b] = S(6, 0); let [c] = S(7.5, 0); const [l0] = S(5.8, 0)
    ctx.fillStyle = '#4b4c52'; ctx.fillRect(a, 0, b - a, H)
    ctx.fillStyle = '#3b6d7a'; ctx.fillRect(c, 0, W - c, H)
    kerbV(ctx, S, 6.0, 7.5, camY, k)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.min(l0, b - 2), 0, Math.max(2, b - l0), H)
    const [sx, sy] = S(cx0, cy0)
    drawCar(ctx, sx, sy, 0, carA.livery, k)
    label(ctx, `${carA.code} · ${Math.round(150 + 120 * (1 - bump))} km/h`, W - 10, 10, '#e8edf7', 'right')
    hud += over > 0.05 ? '' : ''
  } else if (kind === 'collision') {
    // Kollision in der echten Kurve: Streckenverlauf und Randsteine stammen von der Strecke. B (Verteidiger) fährt
    // von außen auf den Scheitelpunkt zu, A (Angreifer) sticht innen hinein. Nach dem Kontakt landen ausgefallene
    // Autos dort, wo sie im Rennen wirklich stehen geblieben sind.
    const T = s.track
    const { axle, outcome } = inc.replay
    const N = T.n, ds = T.ds, L = T.length
    const angd = (h0, h1) => { let d = h1 - h0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d }
    const ia = T.cornerAt(inc.s ?? 0).idx
    const sa = ia * ds
    const hA = T.h[ia]
    const inside = angd(T.h[(ia - 8 + N) % N], T.h[(ia + 8) % N]) >= 0 ? 1 : -1 // +1: Kurveninnenseite liegt rechts
    const at = (sm, latM) => {
      const f = (((sm % L) + L) % L) / ds
      const i = Math.floor(f) % N, j = (i + 1) % N, u = f - Math.floor(f)
      const h = T.h[i] + angd(T.h[i], T.h[j]) * u
      return { x: T.xs[i] + (T.xs[j] - T.xs[i]) * u - Math.sin(h) * latM, y: T.ys[i] + (T.ys[j] - T.ys[i]) * u + Math.cos(h) * latM, h }
    }
    const pc = 0.55, q = Math.max(0, p - pc), contact = p >= pc
    const TR = 150 // Meter, die das Replay abdeckt
    const dyAxle = axle === 'ahead' ? 0.4 : axle === 'level' ? 1.6 : 4.0 // so weit liegt A am Kontaktpunkt hinter B
    const stopA = outcome === 'both' || (outcome === 'one' && inc.stopId === carA.id)
    const stopB = outcome === 'both' || (outcome === 'one' && inc.stopId === carB.id)
    const k1 = 1 - Math.exp(-q / 0.12)
    const after = (stop) => (stop ? TR * 0.2 * (1 - Math.exp(-q / 0.1)) : TR * q)
    const s0 = sa - 78
    const sB = s0 + TR * Math.min(p, pc) + (contact ? after(stopB) : 0)
    const sA = contact ? s0 + TR * pc - dyAxle + after(stopA) : s0 + TR * p - lerp(14, dyAxle, ease(p / pc))
    // Querlage in Metern, positiv = Kurveninnenseite
    const endA = stopA ? carA.lat * 3.6 * inside : 2.4
    const endB = stopB ? carB.lat * 3.6 * inside : -1.8
    let lA = lerp(0.4, 3.6, ease(p / 0.35))
    let lB = p < 0.4 ? -3.0 : lerp(-3.0, 1.7, ease((Math.min(p, pc) - 0.4) / 0.15))
    if (contact) {
      lA = lerp(3.6, endA, stopA ? k1 : ease(q / 0.2))
      lB = lerp(1.7, endB, stopB ? k1 : ease(q / 0.2))
    }
    const PA = at(sA, lA * inside), PB = at(sB, lB * inside)
    const spin = 1 - Math.exp(-q / 0.08)
    const angA = contact && stopA ? (axle === 'behind' ? 1 : -1) * 2.2 * spin : 0
    const angB = contact && stopB ? (axle === 'behind' ? -1 : 1) * 2.4 * spin : 0
    // Ansicht: Fahrtrichtung am Scheitelpunkt zeigt nach oben
    const theta = -(hA + Math.PI / 2)
    const cs = Math.cos(theta), sn = Math.sin(theta)
    const k = (H / 30) * zoom
    const mid = fixed ? at(sa, 0) : { x: (PA.x + PB.x) / 2, y: (PA.y + PB.y) / 2 }
    const S = (x, y) => {
      const dx = x - mid.x, dy = y - mid.y
      return [W / 2 + (dx * cs - dy * sn) * k, H / 2 + (dx * sn + dy * cs) * k]
    }
    ctx.fillStyle = '#1f5a2a'; ctx.fillRect(0, 0, W, H)
    const road = new Path2D(), kerb = new Path2D()
    let open = false
    for (let d = -55; d <= 55; d++) {
      const i = (((ia + d) % N) + N) % N
      const [x, y] = S(T.xs[i], T.ys[i])
      if (d === -55) road.moveTo(x, y); else road.lineTo(x, y)
      if (T.kerb[i]) { if (open) kerb.lineTo(x, y); else { kerb.moveTo(x, y); open = true } } else open = false
    }
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt'
    ctx.strokeStyle = '#3b6d7a'; ctx.lineWidth = 44 * k; ctx.stroke(road)
    ctx.strokeStyle = '#f1f1f1'; ctx.lineWidth = 17 * k; ctx.stroke(kerb)
    ctx.setLineDash([3 * k, 3 * k]); ctx.strokeStyle = '#d93a3a'; ctx.stroke(kerb); ctx.setLineDash([])
    ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 13.4 * k; ctx.stroke(road)
    ctx.strokeStyle = '#4b4c52'; ctx.lineWidth = 12.6 * k; ctx.stroke(road)
    const [bx, by] = S(PB.x, PB.y), [ax, ay] = S(PA.x, PA.y)
    if (contact && q < 0.08) {
      ctx.fillStyle = 'rgba(255,230,120,0.9)'
      ctx.beginPath(); ctx.arc((ax + bx) / 2, (ay + by) / 2, 14 * (1 - q / 0.08) + 4, 0, Math.PI * 2); ctx.fill()
    }
    if (contact) {
      // Reifenrauch der ausgefallenen Autos
      ctx.fillStyle = 'rgba(210,210,215,0.16)'
      for (const [stop, x, y] of [[stopA, ax, ay], [stopB, bx, by]]) {
        if (!stop) continue
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + Math.sin(i * 2.1) * 9 * zoom, y + (i * 9 + 6) * zoom * Math.min(1, q * 4), 7 * zoom, 0, Math.PI * 2); ctx.fill() }
      }
    }
    drawCar(ctx, bx, by, PB.h + Math.PI / 2 + theta + angB, carB.livery, k)
    drawCar(ctx, ax, ay, PA.h + Math.PI / 2 + theta + angA, carA.livery, k)
    mark(ctx, bx, by, k, carB.code, highlight === 'b', now)
    mark(ctx, ax, ay, k, carA.code, highlight === 'a', now, true)
    if (overlay && p <= pc + 0.03) {
      // Hilfslinien quer über die Fahrbahn: Spiegel von B und Vorderachse von A (nur bis zum Kontakt sinnvoll)
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5
      for (const [sm, col, txt, right] of [[sB + 1.0, '#ffd21f', 'Spiegel ' + carB.code, true], [sA + 1.85, '#4cd0ff', 'Vorderachse ' + carA.code, false]]) {
        const e0 = at(sm, -7), e1 = at(sm, 7)
        const [x0, y0] = S(e0.x, e0.y), [x1, y1] = S(e1.x, e1.y)
        ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
        // Beschriftung an den beiden Enden der Linien, damit sie sich nicht überdecken
        const lx = right ? Math.max(x0, x1) : Math.min(x0, x1), ly = right ? (x0 > x1 ? y0 : y1) : (x0 < x1 ? y0 : y1)
        label(ctx, txt, right ? Math.min(W - 8, lx + 6) : Math.max(8 + ctx.measureText(txt).width + 12, lx - 6), ly - 9, col, right ? 'left' : 'right')
      }
      ctx.setLineDash([])
    }
    label(ctx, 'EINLENKEN', 10, H - 40, p >= 0.4 ? '#4cd0ff' : '#7d8aa3')
    label(ctx, 'KONTAKT', 100, H - 40, contact ? '#ff6a6a' : '#7d8aa3')
    const cn = T.cornerAt(inc.s ?? 0)
    label(ctx, `KURVE ${cn.n} · ${cn.name.toUpperCase()}`, W - 10, 10, '#e8edf7', 'right')
  } else if (kind === 'yellow') {
    const { ref, va, status, slow } = inc.replay
    const T = 24
    const yB = -p * T * (slow ? 0.25 : 1)
    const yA = yB + 11 - 20 * ease(p)
    const xB = -0.9
    const xA = lerp(-0.9, 1.1, ease((p - 0.25) / 0.4))
    const k = (H / 24) * zoom
    const camY = fixed ? -6 : yB - 2
    const S = (x, y) => [W / 2 + x * k, H / 2 + (y - camY) * k]
    ctx.fillStyle = '#1f5a2a'; ctx.fillRect(0, 0, W, H)
    const [e0] = S(-7.5, 0), [e1] = S(7.5, 0), [r0] = S(-3.4, 0), [r1] = S(3.4, 0)
    ctx.fillStyle = '#3b6d7a'; ctx.fillRect(e0, 0, e1 - e0, H)
    ctx.fillStyle = '#4b4c52'; ctx.fillRect(r0, 0, r1 - r0, H)
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(r0 - 2, 0, 3, H); ctx.fillRect(r1 - 1, 0, 3, H)
    const [fx, fy] = S(-5.2, -5)
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(0.5); ctx.fillStyle = '#ffd21f'; ctx.fillRect(-7 * zoom, -7 * zoom, 14 * zoom, 14 * zoom); ctx.restore()
    const [bx, by] = S(xB, yB), [ax, ay] = S(xA, yA)
    drawCar(ctx, bx, by, 0, carB.livery, k)
    drawCar(ctx, ax, ay, 0, carA.livery, k)
    mark(ctx, bx, by, k, carB.code, false, now)
    mark(ctx, ax, ay, k, carA.code, false, now)
    ctx.fillStyle = '#ff9a1f'; ctx.fillRect(W - 170, 10, 160, 18)
    ctx.fillStyle = '#10141c'; ctx.textAlign = 'center'; ctx.fillText(status.toUpperCase(), W - 90, 23); ctx.textAlign = 'left'
    label(ctx, `${carA.code} ${va} km/h · ${carB.code} ${slow ? Math.round(ref * 0.4) : ref} km/h`, 10, H - 28, '#e8edf7')
  } else if (kind === 'grid' || kind === 'jump') {
    // Startbox: weiße Linie bei y = 0, Auto zeigt nach oben. Vorderreifen-Vorderkante liegt 2,2 m vor der Fahrzeugmitte.
    let yCar, lightsOn = 0, out = false
    if (kind === 'grid') {
      const final = 2.2 - inc.replay.over
      yCar = final + 26 * (1 - ease(Math.min(1, p / 0.7))) ** 2
    } else {
      const v = inc.replay.variant
      const base = 2.2 + 0.45
      const pOut = 0.6
      out = p >= pOut
      lightsOn = out ? 0 : Math.min(5, Math.floor(p / 0.09) + 1)
      const launchAt = v === 'clear' ? 0.5 : pOut + 0.02
      let creep = 0
      if (v === 'twitch') creep = 0.3 * ease((p - 0.36) / 0.06)
      if (v === 'roll') creep = 0.7 * ease((p - 0.52) / 0.08)
      const q = Math.max(0, p - launchAt)
      yCar = base - creep - 260 * q * q
    }
    const k = (H / 16) * zoom
    const camY = fixed || kind === 'grid' ? -0.5 : Math.min(-0.5, yCar - 2)
    const S = (x, y) => [W / 2 + x * k, H / 2 + (y - camY) * k]
    ctx.fillStyle = '#4b4c52'; ctx.fillRect(0, 0, W, H)
    const [e0] = S(-7, 0), [e1] = S(7, 0)
    ctx.fillStyle = '#1f5a2a'; ctx.fillRect(0, 0, e0, H); ctx.fillRect(e1, 0, W - e1, H)
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(e0 - 2, 0, 3, H); ctx.fillRect(e1 - 1, 0, 3, H)
    // Startbox-Markierung
    const [bx0, by0] = S(-1.6, 0), [bx1] = S(1.6, 0), [, by1] = S(0, 0.25), [, bside] = S(0, 2.6)
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0)
    ctx.fillRect(bx0, by0, Math.max(2, 0.15 * k), bside - by0)
    ctx.fillRect(bx1 - Math.max(2, 0.15 * k), by0, Math.max(2, 0.15 * k), bside - by0)
    ctx.fillStyle = '#ffd21f'; ctx.fillRect(W / 2 - 0.1 * k, by0 - 1.2 * k, 0.2 * k, 1.2 * k)
    const [cx2, cy2] = S(0, yCar)
    drawCar(ctx, cx2, cy2, 0, carA.livery, k)
    if (kind === 'jump') {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < lightsOn ? '#ff2a2a' : '#2a0b0b'
        ctx.beginPath(); ctx.arc(W / 2 - 60 + i * 30, 46, 10, 0, Math.PI * 2); ctx.fill()
      }
      label(ctx, out ? 'LICHTER AUS' : 'ROT', W - 10, 10, out ? '#2fe08a' : '#ff6a6a', 'right')
    } else {
      label(ctx, `${carA.code} · STARTBOX`, W - 10, 10, '#e8edf7', 'right')
    }
  } else {
    // Unsichere Freigabe (Boxengasse, Fahrtrichtung nach rechts)
    const solo = kind === 'pitspeed'
    const react = solo ? 0 : inc.replay.react
    // Ablauf aus den Falldaten. Bei der Freigabe (t0) ist B noch 'gap' Meter hinter der Box von A und fährt 80 km/h.
    // A fährt aus der Box und zieht in die Fahrspur. B bremst hart um 'react' km/h, hält das Tempo kurz und
    // beschleunigt wieder. Ist B noch zu nah, drängt A erst an die gestrichelte Linie und B weicht aus;
    // ganz in die Spur wechselt A erst, wenn es eine Wagenlänge vor B ist. So überlappen sich die Autos nie.
    let xA = 6, yA = 5, yB = -3, xB, vB = solo ? inc.replay.kmh / 3.6 : 22.2
    const t = p * 6, t0 = solo ? 99 : 1.2
    if (solo) xB = -30 + vB * t
    else {
      const gap = inc.replay.gap ?? 15
      const v1 = (80 - react) / 3.6
      const kin = (tau) => 6 + (tau < 2.47 ? 4.5 * tau * tau : 27.4 + 22.2 * (tau - 2.47))
      const want = (tau) => ease((tau - 0.5) / 0.9) // A lenkt Richtung Fahrspur
      // Je weniger B bremsen musste, desto mehr Luft bleibt hinter A
      const sep = 6.6 + ((60 - react) / 60) * 5
      xB = 6 - gap - 22.2 * t0
      let commitAt = null // Zeitpunkt, ab dem A eine Wagenlänge vor B in der Fahrspur ist
      for (let q = 0; q < t; q += 0.02) {
        const tq = q - t0
        const target = tq > 0.1 && tq < 1.6 ? v1 : 22.2
        vB += Math.max(-40 * 0.02, Math.min(6 * 0.02, target - vB))
        xB += vB * 0.02
        const tauQ = Math.max(0, tq)
        xA = kin(tauQ)
        if (commitAt === null && want(tauQ) > 0.5 && xA - xB >= 6.3) commitAt = q
        // Ist A einmal vorn, bleibt es vorn: es beschleunigt mindestens so schnell, wie B nachkommt
        if (commitAt !== null) xA = Math.max(xA, xB + Math.min(sep, 6.3 + (q - commitAt) * 6))
      }
      const tau = Math.max(0, t - t0)
      const out = ease(tau / 0.8) // aus der Box in die Arbeitsspur
      const wantLane = want(tau)
      const distClear = ease((Math.abs(xA - xB) - 6.3) / 1.5)
      const clear = commitAt === null ? distClear : Math.max(distClear, ease((t - commitAt) / 0.4))
      const push = Math.max(0, Math.min(1, (react - 8) / 30)) * (1 - clear) * wantLane
      yA = lerp(lerp(5, 0.7, out), lerp(lerp(0.7, -0.35, push), -3, clear), wantLane)
      yB = -3 - 0.65 * push
    }
    const k = (H / 16) * zoom
    const camX = fixed ? 8 : solo ? xB : (xA + xB) / 2
    const S = (x, y) => [W / 2 + (x - camX) * k, H / 2 + (y - 1) * k]
    ctx.fillStyle = '#26282e'; ctx.fillRect(0, 0, W, H)
    const [, f0] = S(0, -5), [, f1] = S(0, -1), [, g1] = S(0, 3)
    ctx.fillStyle = '#4b4c52'; ctx.fillRect(0, f0, W, f1 - f0)
    ctx.fillStyle = '#5a5b62'; ctx.fillRect(0, f1, W, g1 - f1)
    ctx.strokeStyle = '#f4f4f4'; ctx.setLineDash([14, 10]); ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, f1); ctx.lineTo(W, f1); ctx.stroke(); ctx.setLineDash([])
    const cols = ['#ffffff', '#6aa0ff', '#e8d2b0', '#9fd8ff', '#2fe08a', '#ffd21f']
    for (let i = 0; i < 30; i++) {
      const [gx, gy] = S(-70 + i * 7, 3.4)
      ctx.fillStyle = '#17191e'; ctx.fillRect(gx, gy, 6.2 * k, 5 * k)
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(gx + 4, gy + 4, 6.2 * k - 8, 5)
    }
    const green = solo || t > t0 - 0.3
    const [lx, ly] = S(5.2, 2.6)
    ctx.fillStyle = green ? '#2fe08a' : '#ff4a4a'; ctx.fillRect(lx, ly, 3 * k, 6)
    ctx.fillStyle = green ? '#2fe08a' : '#ff4a4a'; ctx.textAlign = 'center'; ctx.fillText(green ? 'FREIGABE' : 'STOPP', lx + 1.5 * k, ly + 22); ctx.textAlign = 'left'
    const [bx, by] = S(xB, yB), [ax, ay] = S(xA, yA)
    drawCar(ctx, bx, by, Math.PI / 2, carB.livery, k)
    if (!solo) drawCar(ctx, ax, ay, Math.PI / 2, carA.livery, k)
    mark(ctx, bx, by, k, carB.code, false, now, false, 'above')
    if (!solo) mark(ctx, ax, ay, k, carA.code, false, now, false, 'below')
    if (!solo && t > t0) label(ctx, `${carB.code} bremst von 80 auf ${80 - react} km/h`, 10, H - 28, react > 30 ? '#ff6a6a' : react >= 10 ? '#ffd21f' : '#2fe08a')
    if (solo) {
      label(ctx, `${carB.code}: ${inc.replay.kmh.toFixed(1)} km/h`, W - 10, 10, inc.replay.kmh > 80 ? '#ff6a6a' : '#2fe08a', 'right')
      label(ctx, 'LIMIT 80 km/h', W - 10, 32, '#ffd21f', 'right')
    } else label(ctx, `${carB.code}: ${Math.round(vB * 3.6)} km/h · LIMIT 80`, W - 10, 10, '#e8edf7', 'right')
  }
  label(ctx, hud, 8, 8, '#ffd21f')
}

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
export function drawSafetyCar(ctx, x, y, ang, k, lights, now) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.scale(k, k)
  ctx.fillStyle = '#14161b'
  for (const [wx, wy] of [[-1.1, -1.75], [0.85, -1.75], [-1.1, 0.95], [0.85, 0.95]]) ctx.fillRect(wx, wy, 0.25, 0.85)
  // Karosserie
  ctx.fillStyle = '#c9ced6'
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
  ctx.fillStyle = '#9aa1ab'
  ctx.fillRect(-0.66, -0.1, 1.32, 1.1)
  // Scheinwerfer und Rücklichter
  ctx.fillStyle = '#fff7c2'; ctx.fillRect(-0.85, -2.38, 0.35, 0.16); ctx.fillRect(0.5, -2.38, 0.35, 0.16)
  ctx.fillStyle = '#d93a3a'; ctx.fillRect(-0.85, 2.22, 0.4, 0.14); ctx.fillRect(0.45, 2.22, 0.4, 0.14)
  // Lichtbalken auf dem Dach: blinkt abwechselnd orange, vor dem Reinkommen aus
  const ph = Math.floor(now / 220) % 2
  ctx.fillStyle = lights && ph === 0 ? '#ffb020' : '#4a3a1a'; ctx.fillRect(-0.6, 0.3, 0.55, 0.3)
  ctx.fillStyle = lights && ph === 1 ? '#ffb020' : '#4a3a1a'; ctx.fillRect(0.05, 0.3, 0.55, 0.3)
  if (lights) {
    ctx.fillStyle = 'rgba(255,176,32,0.22)'
    ctx.beginPath(); ctx.arc(ph ? 0.33 : -0.33, 0.45, 1.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

// Fahrerkürzel am Auto; das als schuldig gewählte Auto bekommt zusätzlich einen pulsierenden Ring
function mark(ctx, x, y, k, code, active, now, left = false) {
  const r = 3.6 * k
  if (active) {
    ctx.strokeStyle = `rgba(255,210,31,${0.55 + 0.45 * Math.sin(now / 160)})`
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.font = '700 11px ui-monospace, monospace'
  const text = active ? `${code} · SCHULD` : code
  const w = ctx.measureText(text).width + 10
  const lx = left ? Math.max(4, x - r * 0.75 - w) : Math.min(W - w - 4, x + r * 0.75), ly = Math.max(4, y - r - 6)
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

export default function Replay({ inc, carA, carB, highlight = null }) {
  const cv = useRef(null)
  const [p, setP] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [tempo, setTempo] = useState(0.5)
  const [zoom, setZoom] = useState(1)
  const [fixed, setFixed] = useState(false)
  const [overlay, setOverlay] = useState(false)
  const st = useRef({})
  st.current = { p, playing, tempo, zoom, fixed, overlay, inc, carA, carB, highlight }
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
    const over = inc.replay.over
    const xmax = 5.4 + over
    const bump = Math.sin(Math.PI * p) ** 2
    const cx0 = lerp(-1.5, xmax, bump)
    const cy0 = 15 - 30 * p
    const k = (H / 22) * zoom
    const camX = fixed ? 1 : cx0 * 0.7
    const camY = fixed ? 0 : cy0
    const S = (x, y) => [W / 2 + (x - camX) * k, H / 2 + (y - camY) * k]
    ctx.fillStyle = '#1f5a2a'; ctx.fillRect(0, 0, W, H)
    let [a] = S(-10, 0); let [b] = S(6, 0); let [c] = S(7.6, 0)
    ctx.fillStyle = '#4b4c52'; ctx.fillRect(a, 0, b - a, H)
    ctx.fillStyle = '#3b6d7a'; ctx.fillRect(c, 0, W - c, H)
    kerbV(ctx, S, 6.15, 7.6, camY, k)
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(b - 2, 0, 4, H)
    const [sx, sy] = S(cx0, cy0)
    drawCar(ctx, sx, sy, 0, carA.livery, k)
    label(ctx, `${carA.code} · ${Math.round(150 + 120 * (1 - bump))} km/h`, W - 10, 10, '#e8edf7', 'right')
    hud += over > 0.05 ? '' : ''
  } else if (kind === 'collision') {
    const { axle, outcome } = inc.replay
    const T = 40
    const q = p - 0.55
    const contact = p >= 0.55
    const dyAxle = axle === 'ahead' ? 0.4 : axle === 'level' ? 1.6 : 4.0
    // B vorne, A hinten innen
    const yB0 = -T * Math.min(p, 0.55)
    const stopA = outcome === 'both' || (outcome === 'one' && inc.stopId === carA.id)
    const stopB = outcome === 'both' || (outcome === 'one' && inc.stopId === carB.id)
    const slide = (stop, base) => (contact ? (stop ? -T * 0.2 * (1 - Math.exp(-q / 0.1)) : -T * q) + base : base)
    const dyBefore = lerp(14, dyAxle, ease(p / 0.55))
    const yB = slide(stopB, yB0)
    const yAbase = yB0 + (contact ? dyAxle : dyBefore)
    const yA = contact ? slide(stopA, yB0 + dyAxle) : yAbase
    const xB = p < 0.4 ? 0.6 : lerp(0.6, -0.2, ease((Math.min(p, 0.55) - 0.4) / 0.15)) + (contact && !stopB ? q * 2 : 0)
    const xA = lerp(-4.5, -1.9, ease(Math.min(p, 0.55) / 0.55)) + (contact && !stopA ? -q * 3 : 0)
    const angA = contact && stopA ? ((axle === 'behind' ? 1 : -1) * 2.2 * (1 - Math.exp(-q / 0.08))) : 0
    const angB = contact && stopB ? ((axle === 'behind' ? -1 : 1) * 2.4 * (1 - Math.exp(-q / 0.08))) : 0
    const k = (H / 22) * zoom * (fixed ? 0.55 : 1)
    const camY = fixed ? -12 : (yA + yB) / 2
    const S = (x, y) => [W / 2 + (x + 1) * k, H / 2 + (y - camY) * k]
    ctx.fillStyle = '#1f5a2a'; ctx.fillRect(0, 0, W, H)
    const [r0] = S(-9, 0), [r1] = S(8, 0), [kk0] = S(-10.4, 0), [kk1] = S(9.4, 0)
    ctx.fillStyle = '#3b6d7a'; ctx.fillRect(kk0, 0, kk1 - kk0, H)
    ctx.fillStyle = '#4b4c52'; ctx.fillRect(r0, 0, r1 - r0, H)
    kerbV(ctx, S, -9.0, -7.7, camY, k)
    kerbV(ctx, S, 6.7, 8.0, camY, k)
    if (contact && q < 0.08) {
      const [fx, fy] = S((xA + xB) / 2, (yA + yB) / 2 - 0.5)
      ctx.fillStyle = 'rgba(255,230,120,0.9)'
      ctx.beginPath(); ctx.arc(fx, fy, 14 * (1 - q / 0.08) + 4, 0, Math.PI * 2); ctx.fill()
    }
    if (contact) {
      ctx.fillStyle = 'rgba(210,210,215,0.18)'
      for (const [stop, y, x] of [[stopA, yA, xA], [stopB, yB, xB]]) {
        if (!stop) continue
        for (let i = 0; i < 6; i++) { const [sx, sy] = S(x + Math.sin(i) * 0.6, y + i * 1.6 * Math.min(1, q * 4)); ctx.beginPath(); ctx.arc(sx, sy, 8 * zoom, 0, Math.PI * 2); ctx.fill() }
      }
    }
    const [bx, by] = S(xB, yB), [ax, ay] = S(xA, yA)
    drawCar(ctx, bx, by, angB, carB.livery, k)
    drawCar(ctx, ax, ay, angA, carA.livery, k)
    mark(ctx, bx, by, k, carB.code, highlight === 'b', now)
    mark(ctx, ax, ay, k, carA.code, highlight === 'a', now, true)
    if (overlay) {
      const mirrorY = yB - 1.0
      const frontY = yA - 3.0
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5
      for (const [yy, col, txt] of [[mirrorY, '#ffd21f', 'Spiegel B'], [frontY, '#4cd0ff', 'Vorderachse A']]) {
        const [, sy] = S(0, yy)
        ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke()
        label(ctx, txt, 8, sy - 20, col)
      }
      ctx.setLineDash([])
    }
    label(ctx, 'EINLENKEN', 10, H - 40, p >= 0.4 ? '#4cd0ff' : '#7d8aa3')
    label(ctx, 'KONTAKT', 100, H - 40, contact ? '#ff6a6a' : '#7d8aa3')
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
    // Ablauf aus den Falldaten: Bei der Freigabe (t0) ist B noch 'gap' Meter hinter der Box von A.
    // B fährt 80 km/h, bremst um 'react' km/h und beschleunigt wieder. A fährt zuerst in der Arbeitsspur
    // neben B und ordnet sich erst ein, wenn es klar vorn ist. So überlappen sich die Autos nie.
    let xA = 6, yA = 5, xB, vB = solo ? inc.replay.kmh / 3.6 : 22.2
    const t = p * 6, t0 = solo ? 99 : 1.2
    if (solo) xB = -30 + vB * t
    else {
      const gap = inc.replay.gap ?? 15
      const v1 = (80 - react) / 3.6
      xB = 6 - gap - 22.2 * t0
      for (let q = 0; q < t; q += 0.02) {
        const tau = q - t0
        const target = tau > 0.15 && tau < 1.5 ? v1 : 22.2
        vB += Math.max(-15 * 0.02, Math.min(6 * 0.02, target - vB))
        xB += vB * 0.02
      }
      const tau = Math.max(0, t - t0)
      xA = 6 + (tau < 2.47 ? 4.5 * tau * tau : 27.4 + 22.2 * (tau - 2.47))
      yA = lerp(lerp(5, 0.7, ease(tau / 0.8)), -3, ease((xA - xB - 7) / 5))
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
    const [bx, by] = S(xB, -3), [ax, ay] = S(xA, yA)
    drawCar(ctx, bx, by, Math.PI / 2, carB.livery, k)
    if (!solo) drawCar(ctx, ax, ay, Math.PI / 2, carA.livery, k)
    mark(ctx, bx, by, k, carB.code, false, now)
    if (!solo) mark(ctx, ax, ay, k, carA.code, false, now)
    if (solo) {
      label(ctx, `${carB.code}: ${inc.replay.kmh.toFixed(1)} km/h`, W - 10, 10, inc.replay.kmh > 80 ? '#ff6a6a' : '#2fe08a', 'right')
      label(ctx, 'LIMIT 80 km/h', W - 10, 32, '#ffd21f', 'right')
    } else label(ctx, `${carB.code}: ${Math.round(vB * 3.6)} km/h · LIMIT 80`, W - 10, 10, '#e8edf7', 'right')
  }
  label(ctx, hud, 8, 8, '#ffd21f')
}

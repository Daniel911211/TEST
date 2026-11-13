import { useEffect, useRef, useState } from 'react'

const W = 640, H = 360
const FRAMES = 240
const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))
const lerp = (a, b, t) => a + (b - a) * t

// Auto in Metern, Nase zeigt nach oben (-y)
export function drawCar(ctx, x, y, ang, color, k) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.scale(k, k)
  ctx.fillStyle = '#14161b'
  for (const [wx, wy, ww, wh] of [[-1.25, -2.2, 0.6, 1.1], [0.65, -2.2, 0.6, 1.1], [-1.35, 1.2, 0.7, 1.3], [0.65, 1.2, 0.7, 1.3]]) ctx.fillRect(wx, wy, ww, wh)
  ctx.fillStyle = '#23262e'
  ctx.fillRect(-1.1, -3.0, 2.2, 0.35)
  ctx.fillRect(-0.95, 2.55, 1.9, 0.4)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -3.0)
  ctx.lineTo(0.35, -1.6)
  ctx.lineTo(0.75, -0.6)
  ctx.lineTo(0.6, 2.4)
  ctx.lineTo(-0.6, 2.4)
  ctx.lineTo(-0.75, -0.6)
  ctx.lineTo(-0.35, -1.6)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#ffc94a'
  ctx.beginPath()
  ctx.arc(0, 0.2, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
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

export default function Replay({ inc, carA, carB }) {
  const cv = useRef(null)
  const [p, setP] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [tempo, setTempo] = useState(0.5)
  const [zoom, setZoom] = useState(1)
  const [fixed, setFixed] = useState(false)
  const [overlay, setOverlay] = useState(false)
  const st = useRef({})
  st.current = { p, playing, tempo, zoom, fixed, overlay, inc, carA, carB }
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
      draw(ctx, st.current)
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

function draw(ctx, s) {
  const { p, zoom, fixed, overlay, inc, carA, carB, tempo } = s
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
    drawCar(ctx, sx, sy, 0, carA.color, k)
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
    drawCar(ctx, bx, by, angB, carB.color, k)
    drawCar(ctx, ax, ay, angA, carA.color, k)
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
    drawCar(ctx, bx, by, 0, carB.color, k)
    drawCar(ctx, ax, ay, 0, carA.color, k)
    ctx.fillStyle = '#ff9a1f'; ctx.fillRect(W - 170, 10, 160, 18)
    ctx.fillStyle = '#10141c'; ctx.textAlign = 'center'; ctx.fillText(status.toUpperCase(), W - 90, 23); ctx.textAlign = 'left'
    label(ctx, `${carA.code} ${va} km/h · ${carB.code} ${slow ? Math.round(ref * 0.4) : ref} km/h`, 10, H - 28, '#e8edf7')
  } else {
    // Unsichere Freigabe (Boxengasse, Fahrtrichtung nach rechts)
    const { react } = inc.replay
    const dip = react / 100
    const xB = -24 + 60 * p - 14 * dip * Math.sin(Math.PI * Math.min(1, p * 1.3)) ** 2
    const rel = ease((p - 0.18) / 0.45)
    const xA = 6 + 12 * rel
    const yA = lerp(5, -1.6, rel)
    const k = (H / 16) * zoom
    const camX = fixed ? 8 : xB * 0.5 + 6
    const S = (x, y) => [W / 2 + (x - camX) * k, H / 2 + (y - 1) * k]
    ctx.fillStyle = '#26282e'; ctx.fillRect(0, 0, W, H)
    const [, f0] = S(0, -5), [, f1] = S(0, -1), [, g1] = S(0, 3)
    ctx.fillStyle = '#4b4c52'; ctx.fillRect(0, f0, W, f1 - f0)
    ctx.fillStyle = '#5a5b62'; ctx.fillRect(0, f1, W, g1 - f1)
    ctx.strokeStyle = '#f4f4f4'; ctx.setLineDash([14, 10]); ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, f1); ctx.lineTo(W, f1); ctx.stroke(); ctx.setLineDash([])
    const cols = ['#ffffff', '#6aa0ff', '#e8d2b0', '#9fd8ff', '#2fe08a', '#ffd21f']
    for (let i = 0; i < 9; i++) {
      const [gx, gy] = S(-14 + i * 7, 3.4)
      ctx.fillStyle = '#17191e'; ctx.fillRect(gx, gy, 6.2 * k, 5 * k)
      ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(gx + 4, gy + 4, 6.2 * k - 8, 5)
    }
    const green = p > 0.15
    const [lx, ly] = S(5.2, 2.6)
    ctx.fillStyle = green ? '#2fe08a' : '#ff4a4a'; ctx.fillRect(lx, ly, 3 * k, 6)
    ctx.fillStyle = green ? '#2fe08a' : '#ff4a4a'; ctx.textAlign = 'center'; ctx.fillText(green ? 'FREIGABE' : 'STOPP', lx + 1.5 * k, ly + 22); ctx.textAlign = 'left'
    const [bx, by] = S(xB, -3), [ax, ay] = S(xA, yA)
    drawCar(ctx, bx, by, Math.PI / 2, carB.color, k)
    drawCar(ctx, ax, ay, Math.PI / 2, carA.color, k)
    label(ctx, `${carB.code}: ${Math.round(200 - react * Math.sin(Math.PI * Math.min(1, p * 1.3)))} km/h`, W - 10, 10, '#e8edf7', 'right')
  }
  label(ctx, hud, 8, 8, '#ffd21f')
}

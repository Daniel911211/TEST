import { useEffect, useRef, useState } from 'react'
import { drawCar, drawSafetyCar } from './Replay.jsx'

const SCALE = 3.6 // Pixel pro Meter

function posAt(T, L, dist) {
  const s = ((dist % L) + L) % L
  const f = s / T.ds
  const i = Math.floor(f) % T.n
  const j = (i + 1) % T.n
  const u = f - Math.floor(f)
  let dh = T.h[j] - T.h[i]
  if (dh > Math.PI) dh -= 2 * Math.PI
  if (dh < -Math.PI) dh += 2 * Math.PI
  return { x: T.xs[i] + (T.xs[j] - T.xs[i]) * u, y: T.ys[i] + (T.ys[j] - T.ys[i]) * u, h: T.h[i] + dh * u, i }
}

function buildPaths(T) {
  const road = new Path2D()
  for (let i = 0; i < T.n; i++) (i ? road.lineTo(T.xs[i], T.ys[i]) : road.moveTo(T.xs[i], T.ys[i]))
  road.closePath()
  const kerb = new Path2D()
  let open = false
  for (let i = 0; i <= T.n; i++) {
    const k = i % T.n
    if (T.kerb[k]) {
      if (open) kerb.lineTo(T.xs[k], T.ys[k])
      else { kerb.moveTo(T.xs[k], T.ys[k]); open = true }
    } else open = false
  }
  return { road, kerb }
}

// mode 'follow': folgt dem gewählten Auto bzw. dem Führenden. mode 'cctv': zeigt den Ort des letzten Vorfalls.
export default function CamView({ race, mode, selected, freeCam }) {
  const [manual, setManual] = useState(false)
  const ref = useRef(null)
  const live = useRef({})
  live.current = { race, selected, freeCam }
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    let raf, size = { w: 1, h: 1, dpr: 1 }, cache = { key: null }, lastLabel = '', lastNote = ''
    let cam = null, lastManual = false
    const resize = () => {
      const r = cv.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      size = { w: r.width, h: r.height, dpr }
      cv.width = Math.max(1, r.width * dpr)
      cv.height = Math.max(1, r.height * dpr)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    resize()

    const draw = (now) => {
      const { race, selected, freeCam } = live.current
      const fc = freeCam ? freeCam.current : null
      if (fc && fc.manual !== lastManual) { lastManual = fc.manual; setManual(fc.manual) }
      const T = race.track, L = race.L
      if (cache.key !== T.key) cache = { key: T.key, ...buildPaths(T) }
      const { w, h, dpr } = size

      // Kameraziel bestimmen
      let target, text, hint = ''
      if (mode === 'follow') {
        const car = (selected != null && ['run', 'stopped'].includes(race.cars[selected].status) && race.cars[selected]) || race.order.find((c) => c.status === 'run') || race.cars[0]
        target = posAt(T, L, car.dist)
        text = `WELTREGIE · FOLGT ${car.last.toUpperCase()}`
      } else if (fc && fc.manual) {
        target = { x: fc.x, y: fc.y }
        const k = T.corners.reduce((b, c) => (Math.hypot(T.xs[c.idx] - fc.x, T.ys[c.idx] - fc.y) < Math.hypot(T.xs[b.idx] - fc.x, T.ys[b.idx] - fc.y) ? c : b))
        text = `FREI · NAHE KURVE ${k.n} · ${k.name.toUpperCase()}`
      } else {
        const incs = race.incidents
        const inc = incs.find((i) => i.kind === 'hazard') || incs[incs.length - 1]
        if (inc && inc.type !== 'unsafeRelease') {
          const c0 = race.cars[inc.carIds[0]]
          target = posAt(T, L, inc.kind === 'hazard' ? c0.dist : inc.s)
          const k = T.cornerAt(((inc.kind === 'hazard' ? c0.dist : inc.s) % L + L) % L)
          text = `CCTV · KURVE ${k.n} · ${k.name.toUpperCase()}`
          hint = inc.kind === 'hazard' ? `${c0.name} steht auf der Strecke` : `Vorfall: ${inc.carIds.map((id) => race.cars[id].last).join(' / ')}`
        } else {
          const k = T.corners[Math.floor(race.t / 14) % T.corners.length]
          target = { x: T.xs[k.idx], y: T.ys[k.idx] }
          text = `CCTV · KURVE ${k.n} · ${k.name.toUpperCase()}`
        }
      }
      if (!cam || mode === 'cctv') cam = cam && Math.hypot(cam.x - target.x, cam.y - target.y) < 400 ? { x: cam.x + (target.x - cam.x) * 0.08, y: cam.y + (target.y - cam.y) * 0.08 } : { x: target.x, y: target.y }
      else cam = { x: target.x, y: target.y }
      if (fc) {
        if (fc.manual) cam = { x: fc.x, y: fc.y }
        else { fc.x = cam.x; fc.y = cam.y }
        fc.vw = w / SCALE
        fc.vh = h / SCALE
      }
      if (text !== lastLabel) { lastLabel = text; setLabel(text) }
      if (hint !== lastNote) { lastNote = hint; setNote(hint) }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = race.wet > 0.3 ? '#1b4a27' : '#1f5a2a'
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(SCALE, SCALE)
      ctx.translate(-cam.x, -cam.y)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'butt'
      ctx.strokeStyle = '#3b6d7a'; ctx.lineWidth = 44; ctx.stroke(cache.road)
      ctx.strokeStyle = '#f1f1f1'; ctx.lineWidth = 17; ctx.stroke(cache.kerb)
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#d93a3a'; ctx.stroke(cache.kerb); ctx.setLineDash([])
      ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 13.4; ctx.stroke(cache.road)
      ctx.strokeStyle = race.wet > 0.3 ? '#3c3f48' : '#4b4c52'; ctx.lineWidth = 12.6; ctx.stroke(cache.road)
      // Start/Ziel
      ctx.save(); ctx.translate(T.xs[0], T.ys[0]); ctx.rotate(T.h[0]); ctx.fillStyle = '#fff'; ctx.fillRect(-0.6, -6.3, 1.2, 12.6); ctx.restore()

      const drawOne = (dist, lat, color, stopped) => {
        const p = posAt(T, L, dist)
        if (Math.abs(p.x - cam.x) > w / SCALE || Math.abs(p.y - cam.y) > h / SCALE) return
        const nx = -Math.sin(p.h), ny = Math.cos(p.h)
        const x = p.x + nx * lat * 3.6, y = p.y + ny * lat * 3.6
        drawCar(ctx, x, y, p.h + Math.PI / 2 + (stopped ? 0.9 : 0), color, 1)
        if (stopped) {
          ctx.fillStyle = `rgba(255,210,31,${0.5 + 0.5 * Math.sin(now / 150)})`
          ctx.beginPath(); ctx.arc(x, y - 5, 1.2, 0, Math.PI * 2); ctx.fill()
        }
      }
      for (const c of race.cars) if (c.status === 'run' || c.status === 'stopped') drawOne(c.dist, c.lat, c.livery, c.status === 'stopped')
      if (race.sc) {
        const p = posAt(T, L, race.sc.dist)
        const nx = -Math.sin(p.h), ny = Math.cos(p.h)
        drawSafetyCar(ctx, p.x + nx * race.sc.lat * 3.6, p.y + ny * race.sc.lat * 3.6, p.h + Math.PI / 2, 1.3, race.sc.lights, now)
      }
      ctx.restore()

      if (race.rain > 0.02) {
        ctx.strokeStyle = `rgba(190,215,255,${0.15 + race.rain * 0.3})`
        ctx.lineWidth = 1
        ctx.beginPath()
        const n = Math.floor(20 + race.rain * 90)
        for (let i = 0; i < n; i++) {
          const rx = (i * 71.3 + now * 0.3) % (w + 40) - 20
          const ry = (i * 37.7 + now * (0.6 + (i % 5) * 0.07)) % (h + 30) - 15
          ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 10)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [mode])

  return (
    <div className="panel cam">
      <canvas ref={ref} />
      <div className="camlabel">{mode === 'follow' ? <><i>● LIVE</i> · KAM 02 · </> : 'KAM 03 · '}{label}</div>
      {note && <div className="camnote">{note}</div>}
      {manual && <button className="btn sm camauto" onClick={() => { freeCam.current.manual = false }}>AUTOMATIK</button>}
    </div>
  )
}

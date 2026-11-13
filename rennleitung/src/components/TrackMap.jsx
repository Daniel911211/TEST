import { useEffect, useRef } from 'react'
import { sectorOf } from '../sim/race.js'
import { drawSafetyCar } from './Replay.jsx'

const FLAG_COLOR = { yellow: '#ffd21f', double: '#ff7a1a' }

function carPos(T, L, dist, lat) {
  const s = ((dist % L) + L) % L
  const f = s / T.ds
  const i = Math.floor(f) % T.n
  const j = (i + 1) % T.n
  const u = f - Math.floor(f)
  return {
    x: T.xs[i] + (T.xs[j] - T.xs[i]) * u,
    y: T.ys[i] + (T.ys[j] - T.ys[i]) * u,
    h: T.h[i],
    lat,
  }
}

export default function TrackMap({ race, selected, onSelect, freeCam }) {
  const view = useRef({ sc: 1, ox: 0, oy: 0 })
  const drag = useRef({ on: false, moved: false })
  const ref = useRef(null)
  const raceRef = useRef(race)
  raceRef.current = race
  const selRef = useRef(selected)
  selRef.current = selected
  const hits = useRef([])

  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    let raf
    let cache = { key: '', path: null }
    let size = { w: 0, h: 0, dpr: 1 }

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
      const race = raceRef.current
      const T = race.track
      const L = race.L
      const { w, h, dpr } = size
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Bounding Box & Transformation
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9
      for (let i = 0; i < T.n; i++) {
        minx = Math.min(minx, T.xs[i]); maxx = Math.max(maxx, T.xs[i])
        miny = Math.min(miny, T.ys[i]); maxy = Math.max(maxy, T.ys[i])
      }
      const pad = 44
      const sc = Math.min((w - 2 * pad) / (maxx - minx), (h - 2 * pad) / (maxy - miny))
      const ox = (w - (maxx - minx) * sc) / 2 - minx * sc
      const oy = (h - (maxy - miny) * sc) / 2 - miny * sc
      const X = (i) => T.xs[i] * sc + ox
      const Y = (i) => T.ys[i] * sc + oy

      // Raster
      ctx.strokeStyle = 'rgba(120,140,170,0.07)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x < w; x += 28) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = 0; y < h; y += 28) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()

      const key = `${T.key}-${w}-${h}`
      if (cache.key !== key) {
        const p = new Path2D()
        for (let i = 0; i < T.n; i += 2) (i ? p.lineTo(X(i), Y(i)) : p.moveTo(X(i), Y(i)))
        p.closePath()
        cache = { key, path: p }
      }
      const st = race.state
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#0b0e14'
      ctx.lineWidth = 16
      ctx.stroke(cache.path)
      ctx.strokeStyle = '#262c38'
      ctx.lineWidth = 11
      ctx.stroke(cache.path)

      const pulse = 0.65 + 0.35 * Math.sin(now / 280)
      let line = '#f5b942'
      if (st === 'SC') line = '#ff9a1f'
      if (st === 'RED' || st === 'RESTART') line = '#ff4a4a'
      ctx.shadowColor = line
      ctx.shadowBlur = 8
      ctx.strokeStyle = line
      ctx.globalAlpha = st === 'SC' ? pulse : 1
      ctx.lineWidth = 3
      if (st === 'VSC') ctx.setLineDash([10, 8])
      ctx.stroke(cache.path)
      ctx.setLineDash([])
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      // Sektorflaggen
      for (let k = 0; k < 3; k++) {
        const f = race.sectors[k]
        if (f === 'green') continue
        const a = Math.floor((k * T.n) / 3), b = Math.floor(((k + 1) * T.n) / 3)
        ctx.beginPath()
        for (let i = a; i <= b; i += 2) (i === a ? ctx.moveTo(X(i % T.n), Y(i % T.n)) : ctx.lineTo(X(i % T.n), Y(i % T.n)))
        ctx.strokeStyle = FLAG_COLOR[f]
        ctx.shadowColor = FLAG_COLOR[f]
        ctx.shadowBlur = 12
        ctx.lineWidth = f === 'double' ? 7 : 5
        ctx.globalAlpha = f === 'double' ? pulse : 0.9
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      }

      // Sektorgrenzen & Ziellinie
      ctx.font = '600 10px ui-monospace, monospace'
      ctx.textAlign = 'center'
      for (let k = 0; k < 3; k++) {
        const i = Math.floor((k * T.n) / 3)
        const a = T.h[i] + Math.PI / 2
        const x = X(i), y = Y(i)
        ctx.strokeStyle = k === 0 ? '#ffffff' : '#7d8aa3'
        ctx.lineWidth = k === 0 ? 3 : 2
        ctx.beginPath()
        ctx.moveTo(x - Math.cos(a) * 9, y - Math.sin(a) * 9)
        ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9)
        ctx.stroke()
        ctx.fillStyle = '#9fb0cc'
        ctx.fillText(k === 0 ? 'S1 · START/ZIEL' : `S${k + 1}`, x + Math.cos(a) * 36, y + Math.sin(a) * 36 + 3)
      }

      // Kurvennummern
      const cx = ((minx + maxx) / 2) * sc + ox, cy = ((miny + maxy) / 2) * sc + oy
      ctx.font = '500 9px ui-monospace, monospace'
      const boxes = []
      for (const c of T.corners) {
        const x = X(c.idx), y = Y(c.idx)
        let nx = -Math.sin(T.h[c.idx]), ny = Math.cos(T.h[c.idx])
        if (nx * (x - cx) + ny * (y - cy) < 0) { nx = -nx; ny = -ny }
        const align = nx > 0.3 ? 'left' : nx < -0.3 ? 'right' : 'center'
        const lx = x + nx * 14, ly = y + ny * 14 + 3
        // Namen weglassen, wenn sie eine andere Beschriftung überdecken würden
        for (const text of [`${c.n} ${c.name}`, String(c.n)]) {
          const tw = ctx.measureText(text).width
          const x0 = align === 'left' ? lx : align === 'right' ? lx - tw : lx - tw / 2
          const box = [x0 - 3, ly - 10, x0 + tw + 3, ly + 3]
          if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue
          boxes.push(box)
          ctx.textAlign = align
          ctx.fillStyle = '#6b7890'
          ctx.fillText(text, lx, ly)
          break
        }
      }
      ctx.textAlign = 'center'
      ctx.font = '600 10px ui-monospace, monospace'

      // Autos
      const cars = race.cars.filter((c) => c.status === 'run' || c.status === 'stopped')
      const topIds = new Set(race.order.slice(0, 3).map((c) => c.id))
      view.current = { sc, ox, oy }
      // Sichtfeld der Streckenkamera als Rechteck
      const fc = freeCam.current
      const rw = Math.max(16, fc.vw * sc), rh = Math.max(12, fc.vh * sc)
      const rx = fc.x * sc + ox - rw / 2, ry = fc.y * sc + oy - rh / 2
      ctx.fillStyle = fc.manual ? 'rgba(76,208,255,0.14)' : 'rgba(76,208,255,0.06)'
      ctx.fillRect(rx, ry, rw, rh)
      ctx.strokeStyle = '#4cd0ff'
      ctx.lineWidth = fc.manual ? 2 : 1.2
      if (!fc.manual) ctx.setLineDash([4, 3])
      ctx.strokeRect(rx, ry, rw, rh)
      ctx.setLineDash([])
      ctx.fillStyle = '#4cd0ff'
      ctx.textAlign = 'left'
      ctx.fillText('KAM 03', rx, ry - 4)
      ctx.textAlign = 'center'
      hits.current = []
      const sel = selRef.current
      const sorted = [...cars].sort((a, b) => (a.id === sel) - (b.id === sel))
      for (const c of sorted) {
        const p = carPos(T, L, c.dist, c.lat)
        const nx = -Math.sin(p.h), ny = Math.cos(p.h)
        const x = p.x * sc + ox + nx * c.lat * 5
        const y = p.y * sc + oy + ny * c.lat * 5
        hits.current.push({ id: c.id, x, y })
        const stopped = c.status === 'stopped'
        ctx.beginPath()
        ctx.arc(x, y, c.id === sel ? 6.5 : 5, 0, Math.PI * 2)
        ctx.fillStyle = c.color
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = stopped ? '#ff3b3b' : '#06080c'
        ctx.stroke()
        if (c.id === sel) {
          ctx.beginPath()
          ctx.arc(x, y, 11, 0, Math.PI * 2)
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
        if (c.id === sel || topIds.has(c.id) || stopped) {
          ctx.fillStyle = stopped ? '#ff7070' : '#e8edf7'
          ctx.textAlign = 'left'
          ctx.fillText((stopped ? '⚠ ' : '') + c.code, x + 9, y - 8)
          ctx.textAlign = 'center'
        }
      }
      if (race.sc) {
        const p = carPos(T, L, race.sc.dist, 0)
        const nx = -Math.sin(p.h), ny = Math.cos(p.h)
        const x = p.x * sc + ox + nx * race.sc.lat * 5, y = p.y * sc + oy + ny * race.sc.lat * 5
        drawSafetyCar(ctx, x, y, p.h + Math.PI / 2, 3.4, race.sc.lights, now)
        ctx.fillStyle = '#ffb020'
        ctx.font = '700 10px ui-monospace, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(race.sc.waiting ? 'SC wartet' : race.sc.leaving ? 'SC in die Box' : 'SC', x + 12, y - 9)
        ctx.textAlign = 'center'
      }
      // Regen
      if (race.rain > 0.02) {
        ctx.strokeStyle = `rgba(150,190,255,${0.12 + race.rain * 0.3})`
        ctx.lineWidth = 1
        ctx.beginPath()
        const n = Math.floor(40 + race.rain * 160)
        for (let i = 0; i < n; i++) {
          const rx = (i * 97.3 + now * 0.25) % (w + 40) - 20
          const ry = (i * 53.7 + now * (0.5 + (i % 5) * 0.06)) % (h + 30) - 15
          ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 9)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  const toWorld = (e) => {
    const r = ref.current.getBoundingClientRect()
    const { sc, ox, oy } = view.current
    return { px: e.clientX - r.left, py: e.clientY - r.top, x: (e.clientX - r.left - ox) / sc, y: (e.clientY - r.top - oy) / sc }
  }
  const inRect = (p) => {
    const fc = freeCam.current, { sc } = view.current
    return Math.abs(p.x - fc.x) * sc < Math.max(16, fc.vw * sc) / 2 + 6 && Math.abs(p.y - fc.y) * sc < Math.max(12, fc.vh * sc) / 2 + 6
  }
  // Rechteck ziehen verschiebt die Streckenkamera, Doppelklick setzt sie an eine Stelle
  const down = (e) => {
    const p = toWorld(e)
    if (!inRect(p)) return
    const fc = freeCam.current
    drag.current = { on: true, moved: false, dx: fc.x - p.x, dy: fc.y - p.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    const p = toWorld(e)
    const d = drag.current
    if (!d.on) { e.currentTarget.style.cursor = inRect(p) ? 'grab' : 'crosshair'; return }
    d.moved = true
    Object.assign(freeCam.current, { manual: true, x: p.x + d.dx, y: p.y + d.dy })
  }
  const up = () => { drag.current.on = false }
  const dbl = (e) => {
    const p = toWorld(e)
    Object.assign(freeCam.current, { manual: true, x: p.x, y: p.y })
  }
  const click = (e) => {
    if (drag.current.moved) { drag.current.moved = false; return }
    const r = ref.current.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    let best = null, bd = 16
    for (const h of hits.current) {
      const d = Math.hypot(h.x - x, h.y - y)
      if (d < bd) { bd = d; best = h.id }
    }
    onSelect(best)
  }

  return <canvas ref={ref} className="trackcanvas" onClick={click} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onDoubleClick={dbl} style={{ touchAction: 'none' }} />
}

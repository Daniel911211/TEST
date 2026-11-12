import { useEffect, useRef } from 'react'
import { sectorOf } from '../sim/race.js'

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

export default function TrackMap({ race, selected, onSelect }) {
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
      ctx.fillStyle = '#566178'
      for (const c of T.corners) {
        const x = X(c.idx), y = Y(c.idx)
        const dx = x - cx, dy = y - cy
        const d = Math.hypot(dx, dy) || 1
        ctx.fillText(String(c.n), x + (dx / d) * 18, y + (dy / d) * 18 + 3)
      }

      // Autos
      const cars = race.cars.filter((c) => c.status === 'run' || c.status === 'stopped')
      const topIds = new Set(race.order.slice(0, 3).map((c) => c.id))
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
        const x = p.x * sc + ox, y = p.y * sc + oy
        ctx.fillStyle = '#ff9a1f'
        ctx.fillRect(x - 11, y - 7, 22, 14)
        ctx.fillStyle = '#10141c'
        ctx.font = '700 10px ui-monospace, monospace'
        ctx.fillText('SC', x, y + 3.5)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  const click = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    let best = null, bd = 16
    for (const h of hits.current) {
      const d = Math.hypot(h.x - x, h.y - y)
      if (d < bd) { bd = d; best = h.id }
    }
    onSelect(best)
  }

  return <canvas ref={ref} className="trackcanvas" onClick={click} />
}

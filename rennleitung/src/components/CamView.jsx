import { useEffect, useRef, useState } from 'react'
import { drawCar, drawSafetyCar } from './Replay.jsx'
import { sectorOf } from '../sim/race.js'

const SCALE = 3.6 // Pixel pro Meter

// Streckenposten von oben: orange Weste, optional mit geschwenkter gelber Flagge
function drawMarshal(ctx, x, y, flag, now) {
  if (flag) {
    const a = Math.sin(now / 170 + x) * 0.7
    ctx.save(); ctx.translate(x, y); ctx.rotate(a)
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 0.12
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -1.5); ctx.stroke()
    ctx.fillStyle = '#ffd21f'; ctx.fillRect(0, -1.5, 1.0, 0.7)
    ctx.restore()
  }
  ctx.fillStyle = '#ff7a1a'
  ctx.beginPath(); ctx.arc(x, y, 0.48, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#f1d9b5'
  ctx.beginPath(); ctx.arc(x, y, 0.22, 0, Math.PI * 2); ctx.fill()
}

// Bergungsfahrzeug mit Kran, Nase zeigt in Fahrtrichtung (Winkel ang)
const FLAG_COL = { yellow: '#ffd21f', double: '#ffd21f', green: '#2fe08a', red: '#ff3b3b', blue: '#2f7dff' }
// Flaggenposten: Podest hinter der Leitplanke, Posten mit Flagge, Leuchttafel und Nummer
function drawPost(ctx, q, post, st, now) {
  ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.h)
  ctx.fillStyle = '#2b3038'; ctx.fillRect(-1.7, -1.3, 3.4, 2.6)
  ctx.strokeStyle = '#c9ccd4'; ctx.lineWidth = 0.14; ctx.strokeRect(-1.7, -1.3, 3.4, 2.6)
  // Leuchttafel
  const blink = Math.sin(now / 140) > -0.2
  const col = st.flag === 'chq' ? '#f4f4f4' : FLAG_COL[st.flag]
  ctx.fillStyle = '#0b0d11'; ctx.fillRect(1.9, -1.0, 2.0, 2.0)
  if (st.flag === 'chq') { ctx.fillStyle = '#f4f4f4'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) ctx.fillRect(2.1 + i * 0.4, -0.8 + j * 0.4, 0.4, 0.4) }
  else if (col && (blink || !st.waved)) { ctx.fillStyle = col; ctx.fillRect(2.1, -0.8, 1.6, 1.6) }
  ctx.restore()
  ctx.save(); ctx.translate(q.x, q.y)
  ctx.font = '700 1.1px ui-monospace, monospace'; ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(8,10,14,0.8)'; ctx.fillRect(-2.2, 2.0, 4.4, 1.5)
  ctx.fillStyle = st.board ? '#ffd21f' : '#c9ccd4'
  ctx.fillText(st.board ? `${st.board} · P${post.no}` : `POSTEN ${post.no}`, 0, 3.1)
  ctx.restore()
  // Posten mit Flagge(n)
  const flags = st.flag === 'double' ? [-0.7, 0.7] : [0]
  for (const dx of flags) {
    const x = q.x + Math.cos(q.h) * dx, y = q.y + Math.sin(q.h) * dx
    if (col) {
      const a = st.waved ? Math.sin(now / 170 + dx * 3) * 0.7 : -0.25
      ctx.save(); ctx.translate(x, y); ctx.rotate(a)
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 0.12
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -1.7); ctx.stroke()
      ctx.fillStyle = col; ctx.fillRect(0, -1.7, 1.2, 0.8)
      if (st.flag === 'chq') { ctx.fillStyle = '#10141c'; ctx.fillRect(0, -1.7, 0.6, 0.4); ctx.fillRect(0.6, -1.3, 0.6, 0.4) }
      ctx.restore()
    }
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(x, y, 0.48, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#f1d9b5'; ctx.beginPath(); ctx.arc(x, y, 0.22, 0, Math.PI * 2); ctx.fill()
  }
}

function drawRecoveryTruck(ctx, x, y, ang, now) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang)
  ctx.fillStyle = '#14161b'
  for (const [wx, wy] of [[-2.1, -1.35], [1.3, -1.35], [-2.1, 1.05], [1.3, 1.05]]) ctx.fillRect(wx, wy, 0.9, 0.3)
  ctx.fillStyle = '#f2c11a'; ctx.fillRect(-2.9, -1.15, 5.8, 2.3)
  ctx.fillStyle = '#2a2d34'; ctx.fillRect(1.5, -0.95, 1.1, 1.9)
  ctx.fillStyle = '#c99a0c'; ctx.fillRect(-2.6, -0.8, 3.6, 1.6)
  ctx.fillStyle = Math.floor(now / 250) % 2 ? '#ff9a1f' : '#6b4a12'
  ctx.beginPath(); ctx.arc(1.0, 0, 0.3, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

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
  const P = T.pit
  const pit = new Path2D()
  for (let i = 0; i <= P.n; i++) (i ? pit.lineTo(P.xs[i], P.ys[i]) : pit.moveTo(P.xs[i], P.ys[i]))
  return { road, kerb, pit }
}

// mode 'follow': folgt dem gewählten Auto bzw. dem Führenden. mode 'cctv': zeigt den Ort des letzten Vorfalls.
export default function CamView({ race, mode, selected, freeCam }) {
  const [manual, setManual] = useState(false)
  const zoom = useRef(1)
  const [zoomLabel, setZoomLabel] = useState(1)
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
    // Mausrad zoomt (0,4× bis 5×), Doppelklick setzt zurück
    const wheel = (e) => {
      e.preventDefault()
      zoom.current = Math.max(0.4, Math.min(5, zoom.current * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
      setZoomLabel(+zoom.current.toFixed(1))
    }
    const reset = () => { zoom.current = 1; setZoomLabel(1) }
    cv.addEventListener('wheel', wheel, { passive: false })
    cv.addEventListener('dblclick', reset)
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
      const S = SCALE * zoom.current

      // Kameraziel bestimmen
      let target, text, hint = ''
      if (mode === 'follow') {
        const car = (selected != null && ['run', 'stopped'].includes(race.cars[selected].status) && race.cars[selected]) || race.order.find((c) => c.status === 'run') || race.cars[0]
        target = race.pose(car, 0)
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
        fc.vw = w / S
        fc.vh = h / S
      }
      if (text !== lastLabel) { lastLabel = text; setLabel(text) }
      if (hint !== lastNote) { lastNote = hint; setNote(hint) }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = race.wet > 0.3 ? '#1b4a27' : '#1f5a2a'
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(S, S)
      ctx.translate(-cam.x, -cam.y)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'butt'
      ctx.strokeStyle = '#3b6d7a'; ctx.lineWidth = 44; ctx.stroke(cache.road)
      // Boxengasse mit Garagen, Tempolimit-Linien und Boxenplätzen
      const P = T.pit
      ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 9.2; ctx.stroke(cache.pit)
      ctx.strokeStyle = '#56585f'; ctx.lineWidth = 8.4; ctx.stroke(cache.pit)
      race.teams.forEach((team, i) => {
        const q = P.at(P.boxU(i, race.teams.length))
        const col = race.cars.find((c) => c.team === team).color
        ctx.save()
        ctx.translate(q.x, q.y)
        ctx.rotate(q.h)
        const sd = P.side
        ctx.fillStyle = '#1b1d23'; ctx.fillRect(-8, sd > 0 ? 8.6 : -17.6, 16, 9)
        ctx.fillStyle = col; ctx.fillRect(-8, sd > 0 ? 8.6 : -9.8, 16, 1.2)
        ctx.strokeStyle = col; ctx.lineWidth = 0.35; ctx.strokeRect(-3.2, sd > 0 ? 4.4 : -7.4, 6.4, 3)
        ctx.restore()
      })
      if (race.pitClosed) {
        // rote Ampel: Balken quer über die Boxeneinfahrt
        const q = P.at(30)
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.h); ctx.fillStyle = '#ff2a2a'; ctx.fillRect(-0.7, -4.4, 1.4, 8.8); ctx.restore()
      }
      for (const u of [P.uA, P.uB]) {
        const q = P.at(u)
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.h); ctx.fillStyle = '#ffd21f'; ctx.fillRect(-0.4, -4.2, 0.8, 8.4); ctx.restore()
      }
      // Parkplätze von Safety Car und Arztwagen
      for (const [which, col] of [['sc', '#ffb020'], ['med', '#ff6a6a']]) {
        const q = race.parkPose(1, which)
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.h)
        ctx.fillStyle = '#44464d'; ctx.fillRect(-5, -2.6, 10, 5.2)
        ctx.strokeStyle = col; ctx.lineWidth = 0.3; ctx.strokeRect(-5, -2.6, 10, 5.2)
        ctx.restore()
      }
      ctx.strokeStyle = '#f1f1f1'; ctx.lineWidth = 17; ctx.stroke(cache.kerb)
      ctx.setLineDash([3, 3]); ctx.strokeStyle = '#d93a3a'; ctx.stroke(cache.kerb); ctx.setLineDash([])
      ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 13.4; ctx.stroke(cache.road)
      ctx.strokeStyle = race.wet > 0.3 ? '#3c3f48' : '#4b4c52'; ctx.lineWidth = 12.6; ctx.stroke(cache.road)
      // Start/Ziel
      ctx.save(); ctx.translate(T.xs[0], T.ys[0]); ctx.rotate(T.h[0]); ctx.fillStyle = '#fff'; ctx.fillRect(-0.6, -6.3, 1.2, 12.6); ctx.restore()
      // Startaufstellung: eine Startbox je Startplatz. Die Vorderkante der Querlinie liegt 2,65 m vor der
      // Fahrzeugmitte, genau die Linie, gegen die im Fall "Falsche Startposition" gemessen wird.
      {
        const slots = new Map()
        for (let i = 0; i < race.cars.length; i++) slots.set(-(12 + i * 8), i % 2 ? 0.9 : -0.9)
        for (const c of race.cars) slots.set(c.slot, c.slotLat)
        for (const [d, lat] of slots) {
          const q = race.pose({ dist: d + 2.65, lat }, 3.6)
          if (Math.abs(q.x - cam.x) > w / S || Math.abs(q.y - cam.y) > h / S) continue
          ctx.save()
          ctx.translate(q.x, q.y)
          ctx.rotate(q.h + Math.PI / 2)
          ctx.fillStyle = '#f4f4f4'
          ctx.fillRect(-1.7, 0, 3.4, 0.25)
          ctx.fillRect(-1.7, 0, 0.18, 2.6)
          ctx.fillRect(1.52, 0, 0.18, 2.6)
          ctx.fillStyle = '#ffd21f'
          ctx.fillRect(-0.1, -1.2, 0.2, 1.2)
          ctx.restore()
        }
      }

      // Unfallstellen: Trümmer, Streckenposten mit gelber Flagge und das Bergungsfahrzeug
      const liftOf = (c) => {
        const hz = c.haz
        if (!hz || hz.self || c.recov == null) return 0
        const prog = 1 - c.recov / hz.total
        return Math.max(0, Math.min(1, (prog - 0.72) / 0.28)) // im letzten Viertel wird das Auto weggehoben
      }
      for (const c of race.cars) {
        if (c.status !== 'stopped' || !c.haz) continue
        const q0 = race.pose(c, 3.6)
        if (Math.abs(q0.x - cam.x) > w / S + 30 || Math.abs(q0.y - cam.y) > h / S + 30) continue
        const hz = c.haz
        const side = c.lat >= 0 ? 1 : -1
        const prog = hz.self || c.recov == null ? 0 : 1 - c.recov / hz.total
        if (hz.debris) {
          // Trümmer werden in der ersten Hälfte der Bergung weggeräumt
          const n = Math.ceil(8 * (1 - Math.min(1, prog / 0.5)))
          for (let i = 0; i < n; i++) {
            const dd = ((c.id * 37 + i * 53) % 23) - 8
            const dl = (((c.id * 17 + i * 29) % 19) / 19 - 0.5) * 1.5
            const q = race.pose({ dist: c.dist + dd, lat: c.lat - side * 0.35 + dl }, 3.6)
            ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(i * 1.3 + c.id)
            ctx.fillStyle = i % 3 ? '#16181d' : c.livery.body
            ctx.beginPath(); ctx.moveTo(-0.45, -0.15); ctx.lineTo(0.4, -0.3); ctx.lineTo(0.2, 0.3); ctx.closePath(); ctx.fill()
            ctx.restore()
          }
        }
        const sec = sectorOf(((c.dist % L) + L) % L, L)
        const covered = race.state !== 'GREEN' || race.sectors[sec] !== 'green'
        if (covered) {
          // Posten vor der Unfallstelle schwenkt Gelb
          const q = race.pose({ dist: c.dist - 22, lat: side * 2.05 }, 3.6)
          drawMarshal(ctx, q.x, q.y, true, now)
        }
        if (hz.active && !hz.self) {
          const lift = liftOf(c)
          const t = race.pose({ dist: c.dist + 0.5, lat: c.lat + side * (1.25 + lift * 0.5) }, 3.6)
          // Kranarm zum Auto
          ctx.strokeStyle = '#2a2d34'; ctx.lineWidth = 0.28
          ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(q0.x - Math.sin(q0.h) * side * lift * 4.5, q0.y + Math.cos(q0.h) * side * lift * 4.5); ctx.stroke()
          drawRecoveryTruck(ctx, t.x, t.y, t.h, now)
          for (const [dd, dl] of [[-4.5, 0.35], [4.2, -0.3]]) {
            const m = race.pose({ dist: c.dist + dd, lat: c.lat + side * dl }, 3.6)
            drawMarshal(ctx, m.x, m.y, false, now)
          }
        }
      }
      for (const post of race.posts) drawPost(ctx, race.pose({ dist: post.s, lat: post.lat }, 3.6), post, race.postFlag(post), now)
      const drawOne = (c, color, stopped) => {
        const p = race.pose(c, 3.6)
        if (Math.abs(p.x - cam.x) > w / S || Math.abs(p.y - cam.y) > h / S) return
        let x = p.x, y = p.y
        // am Kranhaken: das Auto wird zur Seite von der Strecke gehoben
        const lift = stopped ? liftOf(c) : 0
        if (lift) {
          const side = c.lat >= 0 ? 1 : -1
          x -= Math.sin(p.h) * side * lift * 4.5
          y += Math.cos(p.h) * side * lift * 4.5
        }
        drawCar(ctx, x, y, p.h + Math.PI / 2 + (stopped ? 0.9 : 0), color, 1 - lift * 0.12)
        // Warnblinken nur, solange die Stelle noch nicht abgesichert ist
        if (stopped && race.state === 'GREEN' && race.sectors[sectorOf(((c.dist % L) + L) % L, L)] === 'green') {
          ctx.fillStyle = `rgba(255,70,70,${0.4 + 0.6 * Math.abs(Math.sin(now / 150))})`
          ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.lineWidth = 0.35; ctx.strokeStyle = ctx.fillStyle; ctx.stroke()
        }
      }
      for (const c of race.cars) if (c.status === 'run' || c.status === 'stopped') drawOne(c, c.livery, c.status === 'stopped')
      {
        const p = race.scPose()
        drawSafetyCar(ctx, p.x, p.y, p.h + Math.PI / 2, 1.3, !!race.sc && race.sc.lights, now)
        const m = race.medPose()
        drawSafetyCar(ctx, m.x, m.y, m.h + Math.PI / 2, 1.3, race.med && (race.med.speed > 1 || race.med.mode === 'mission') ? 'orange' : false, now, true)
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
    return () => { cancelAnimationFrame(raf); ro.disconnect(); cv.removeEventListener('wheel', wheel); cv.removeEventListener('dblclick', reset) }
  }, [mode])

  return (
    <div className="panel cam">
      <canvas ref={ref} />
      <div className="camlabel">{mode === 'follow' ? <><i>● LIVE</i> · KAM 02 · </> : 'KAM 03 · '}{label}{zoomLabel !== 1 ? ` · ZOOM ${zoomLabel}×` : ''}</div>
      {note && <div className="camnote">{note}</div>}
      {manual && <button className="btn sm camauto" onClick={() => { freeCam.current.manual = false }}>AUTOMATIK</button>}
    </div>
  )
}

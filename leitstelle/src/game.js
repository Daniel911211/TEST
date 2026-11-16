// Reine Spiellogik (ohne React/Leaflet)

export const GAME_SEC_PER_REAL_SEC = 30 // bei 1x: 1 echte Sekunde = 30 Spielsekunden
export const DETOUR = 1.3 // Umwegfaktor Luftlinie -> Straße
export const CENTER = [50.5558, 9.6808] // Fulda
export const MAX_VEHICLES_PER_STATION = 6

export const STATION_TYPES = {
  FW: { name: 'Feuerwache', cost: 5000, color: '#c1121f' },
  RW: { name: 'Rettungswache', cost: 3000, color: '#e09f00' },
}

export const VEHICLE_TYPES = {
  HLF: { name: 'HLF 20', kind: 'FW', cost: 3000, speed: 70 },
  DLK: { name: 'DLK 23', kind: 'FW', cost: 4500, speed: 60 },
  RTW: { name: 'RTW', kind: 'RW', cost: 2000, speed: 80 },
  NEF: { name: 'NEF', kind: 'RW', cost: 2500, speed: 95 },
}

export const INCIDENT_TYPES = [
  { id: 'muell', name: 'Containerbrand', need: { HLF: 1 }, work: 300, reward: 350, penalty: 150, deadline: 900, weight: 3, points: 5 },
  { id: 'tuer', name: 'Türöffnung', need: { HLF: 1 }, work: 240, reward: 300, penalty: 100, deadline: 1200, weight: 2, points: 4 },
  { id: 'zimmer', name: 'Zimmerbrand', need: { HLF: 2, DLK: 1, RTW: 1 }, work: 700, reward: 1400, penalty: 600, deadline: 900, weight: 2, points: 15, patient: true },
  { id: 'internist', name: 'Internistischer Notfall', need: { RTW: 1 }, work: 240, reward: 450, penalty: 200, deadline: 720, weight: 5, points: 6, patient: true },
  { id: 'notarzt', name: 'Reanimation', need: { RTW: 1, NEF: 1 }, work: 420, reward: 900, penalty: 500, deadline: 600, weight: 2, points: 12, patient: true },
  { id: 'vu', name: 'Verkehrsunfall', need: { HLF: 1, RTW: 1, NEF: 1 }, work: 600, reward: 1200, penalty: 500, deadline: 900, weight: 2, points: 14, patient: true },
]

export const HOSPITALS = [
  { id: 'h1', name: 'Klinikum Fulda', pos: [50.5445, 9.6893] },
  { id: 'h2', name: 'Herz-Jesu-Krankenhaus', pos: [50.5601, 9.6571] },
  { id: 'h3', name: 'Krankenhaus Hünfeld', pos: [50.6677, 9.7677] },
]

export const RANKS = [
  [0, 'Anwärter'],
  [60, 'Feuerwehrmann'],
  [150, 'Oberfeuerwehrmann'],
  [300, 'Hauptfeuerwehrmann'],
  [550, 'Brandmeister'],
  [900, 'Oberbrandmeister'],
  [1400, 'Hauptbrandmeister'],
  [2200, 'Brandinspektor'],
  [3500, 'Brandrat'],
]
export const rankOf = (pts) => [...RANKS].reverse().find(([p]) => pts >= p)[1]
export const nextRank = (pts) => RANKS.find(([p]) => p > pts) || null

export const STATUS_TEXT = {
  1: 'Einsatzbereit über Funk',
  2: 'Einsatzbereit auf Wache',
  3: 'Einsatzübernahme / Anfahrt',
  4: 'Am Einsatzort',
  7: 'Patient aufgenommen',
  8: 'Am Transportziel',
}

export const km = (a, b) => {
  const R = 6371
  const toR = (d) => (d * Math.PI) / 180
  const dLat = toR(b[0] - a[0])
  const dLng = toR(b[1] - a[1])
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

// Schätzung (Luftlinie × Umwegfaktor) – nur für die Anzeige
export const etaSec = (vehicle, target) => (km(vehicle.pos, target) * DETOUR) / VEHICLE_TYPES[vehicle.type].speed * 3600

export const fmtClock = (t) => {
  const s = Math.floor(t) % 86400
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}`
}
export const fmtMin = (sec) => {
  const m = Math.max(0, Math.round(sec / 60))
  return `${m} min`
}
export const fmtMoney = (n) => Math.round(n).toLocaleString('de-DE') + ' €'

export function newGame() {
  return {
    v: 1,
    t: 8 * 3600,
    money: 20000,
    points: 0,
    done: 0,
    failed: 0,
    nextId: 1,
    spawnIn: 120,
    stations: [],
    vehicles: [],
    incidents: [],
    log: [{ t: 8 * 3600, text: 'Willkommen in der Leitstelle! Baue zuerst eine Feuer- und eine Rettungswache.' }],
  }
}

const rnd = (a, b) => a + Math.random() * (b - a)
const addLog = (g, text) => {
  g.log.unshift({ t: g.t, text })
  if (g.log.length > 60) g.log.length = 60
}

export function buildStation(g, kind, pos, name) {
  const def = STATION_TYPES[kind]
  if (g.money < def.cost) return { ok: false, msg: 'Nicht genug Geld.' }
  g.money -= def.cost
  const station = { id: g.nextId++, kind, pos, name: name || `${kind === 'FW' ? 'FW' : 'RW'} ${g.stations.filter((s) => s.kind === kind).length + 1}` }
  g.stations.push(station)
  // erstes Fahrzeug gratis
  addVehicle(g, station, kind === 'FW' ? 'HLF' : 'RTW')
  addLog(g, `${station.name} gebaut.`)
  return { ok: true, station }
}

function addVehicle(g, station, type) {
  const n = g.vehicles.filter((v) => v.type === type).length + 1
  g.vehicles.push({
    id: g.nextId++,
    type,
    stationId: station.id,
    callsign: `${station.name} ${VEHICLE_TYPES[type].name} ${n}`,
    pos: [...station.pos],
    status: 2,
    incidentId: null,
    timer: 0,
    hospital: null,
  })
}

export function buyVehicle(g, stationId, type) {
  const st = g.stations.find((s) => s.id === stationId)
  const def = VEHICLE_TYPES[type]
  if (!st || st.kind !== def.kind) return { ok: false, msg: 'Passt nicht zur Wache.' }
  if (g.vehicles.filter((v) => v.stationId === stationId).length >= MAX_VEHICLES_PER_STATION) return { ok: false, msg: 'Wache voll.' }
  if (g.money < def.cost) return { ok: false, msg: 'Nicht genug Geld.' }
  g.money -= def.cost
  addVehicle(g, st, type)
  return { ok: true }
}

export const isAvailable = (v) => v.status === 1 || v.status === 2

export function dispatch(g, incidentId, vehicleIds) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (!inc) return
  for (const id of vehicleIds) {
    const v = g.vehicles.find((x) => x.id === id)
    if (!v || !isAvailable(v)) continue
    v.status = 3
    v.incidentId = inc.id
    inc.dispatched = true
  }
}

// Empfohlene Auswahl: pro benötigtem Typ die schnellsten freien Fahrzeuge
export function recommend(g, inc) {
  const picked = []
  const have = {}
  for (const v of g.vehicles) if (v.incidentId === inc.id) have[v.type] = (have[v.type] || 0) + 1
  for (const [type, n] of Object.entries(inc.type.need)) {
    const missing = n - (have[type] || 0)
    if (missing <= 0) continue
    const c = g.vehicles
      .filter((v) => v.type === type && isAvailable(v))
      .sort((a, b) => etaSec(a, inc.pos) - etaSec(b, inc.pos))
      .slice(0, missing)
    picked.push(...c.map((v) => v.id))
  }
  return picked
}

function releaseVehicle(v) {
  v.route = null
  v.incidentId = null
  v.status = 1
  v.timer = 0
}

function spawnIncident(g) {
  const owned = new Set(g.vehicles.map((v) => v.type))
  const types = INCIDENT_TYPES.filter((t) => Object.keys(t.need).every((k) => owned.has(k)))
  if (!types.length) return
  const total = types.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * total
  const type = types.find((t) => (r -= t.weight) < 0) || types[0]
  const st = g.stations[Math.floor(Math.random() * g.stations.length)]
  const ang = Math.random() * Math.PI * 2
  const dist = rnd(0.8, 5) // km
  const pos = [st.pos[0] + (Math.cos(ang) * dist) / 111, st.pos[1] + (Math.sin(ang) * dist) / (111 * Math.cos((st.pos[0] * Math.PI) / 180))]
  const inc = { id: g.nextId++, type, pos, created: g.t, status: 'open', workLeft: type.work, startedAt: null, dispatched: false, patientTaken: false }
  g.incidents.push(inc)
  addLog(g, `Neuer Einsatz: ${type.name}`)
}

// --- Routing über OSRM (keine Drosselung, kein Luftlinien-Fallback) ---
const routeCache = new Map()
const pendingRoutes = new Set()
const osrmBase = () => {
  try { const u = localStorage.getItem('osrm-url'); if (u) return u } catch { /* ignore */ }
  return import.meta.env?.VITE_OSRM_URL || 'https://router.project-osrm.org'
}
async function fetchRoute(from, to) {
  const key = `${from.map((n) => n.toFixed(5))}|${to.map((n) => n.toFixed(5))}`
  if (routeCache.has(key)) return routeCache.get(key)
  const res = await fetch(`${osrmBase()}/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const j = await res.json()
  if (j.code !== 'Ok') throw new Error(j.code)
  const pts = j.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
  routeCache.set(key, pts)
  return pts
}

function moveAlong(v, dt) {
  let left = VEHICLE_TYPES[v.type].speed * (dt / 3600) // km
  const r = v.route
  while (left > 0 && r.i < r.pts.length) {
    const d = km(v.pos, r.pts[r.i])
    if (d <= left) { v.pos = [...r.pts[r.i]]; left -= d; r.i++ }
    else {
      const f = left / d
      v.pos = [v.pos[0] + (r.pts[r.i][0] - v.pos[0]) * f, v.pos[1] + (r.pts[r.i][1] - v.pos[1]) * f]
      left = 0
    }
  }
  return r.i >= r.pts.length
}

// true, sobald das Ziel erreicht ist
function driveTo(g, v, target, dt, onFail) {
  const key = target.join()
  if (v.route && v.route.key === key) {
    if (!moveAlong(v, dt)) return false
    v.route = null
    return true
  }
  if (!pendingRoutes.has(v.id) && !(v.retryAt > g.t)) {
    pendingRoutes.add(v.id)
    fetchRoute(v.pos, target)
      .then((pts) => { v.route = { key, pts, i: 0 } })
      .catch((e) => { v.retryAt = g.t + 60; onFail(e) })
      .finally(() => pendingRoutes.delete(v.id))
  }
  return false
}

export function tick(g, dt) {
  g.t += dt

  // Spawn
  g.spawnIn -= dt
  if (g.spawnIn <= 0) {
    g.spawnIn = rnd(250, 550)
    const open = g.incidents.length
    if (g.stations.length && open < 2 + g.stations.length) spawnIncident(g)
  }

  // Fahrzeuge
  for (const v of g.vehicles) {
    const inc = g.incidents.find((i) => i.id === v.incidentId)
    const st = g.stations.find((s) => s.id === v.stationId)
    switch (v.status) {
      case 3:
        if (!inc) { releaseVehicle(v); break }
        if (driveTo(g, v, inc.pos, dt, (e) => {
          addLog(g, `${v.callsign}: Routing fehlgeschlagen (${e.message}) – Alarm abgebrochen`)
          releaseVehicle(v)
        })) {
          v.status = 4
          addLog(g, `${v.callsign}: Status 4 – am Einsatzort (${inc.type.name})`)
        }
        break
      case 7:
        if (driveTo(g, v, v.hospital.pos, dt, (e) => addLog(g, `${v.callsign}: Routing fehlgeschlagen (${e.message})`))) {
          v.status = 8
          v.timer = 300
        }
        break
      case 8:
        v.timer -= dt
        if (v.timer <= 0) releaseVehicle(v)
        break
      case 1:
        if (driveTo(g, v, st.pos, dt, (e) => addLog(g, `${v.callsign}: Routing fehlgeschlagen (${e.message})`))) v.status = 2
        break
      default:
        break
    }
  }

  // Einsätze
  for (const inc of [...g.incidents]) {
    const atScene = {}
    for (const v of g.vehicles) if (v.incidentId === inc.id && v.status === 4) atScene[v.type] = (atScene[v.type] || 0) + 1
    const satisfied = Object.entries(inc.type.need).every(([k, n]) => (atScene[k] || 0) >= n)

    if (inc.status === 'open') {
      if (satisfied) {
        inc.status = 'working'
        inc.startedAt = g.t
      } else if (g.t - inc.created > inc.type.deadline) {
        g.money -= inc.type.penalty
        g.failed++
        addLog(g, `Einsatz gescheitert: ${inc.type.name} (−${fmtMoney(inc.type.penalty)})`)
        for (const v of g.vehicles) if (v.incidentId === inc.id) releaseVehicle(v)
        g.incidents = g.incidents.filter((i) => i !== inc)
      }
    } else if (inc.status === 'working') {
      inc.workLeft -= dt
      if (inc.workLeft <= 0) {
        const wait = inc.startedAt - inc.created
        const bonus = wait < inc.type.deadline * 0.5 ? 1.25 : 1
        const reward = Math.round(inc.type.reward * bonus)
        g.money += reward
        g.points += inc.type.points
        g.done++
        addLog(g, `Einsatz erledigt: ${inc.type.name} (+${fmtMoney(reward)})`)
        let patientTaken = false
        for (const v of g.vehicles) {
          if (v.incidentId !== inc.id) continue
          if (v.status === 4 && inc.type.patient && v.type === 'RTW' && !patientTaken) {
            patientTaken = true
            v.status = 7
            v.incidentId = null
            v.hospital = [...HOSPITALS].sort((a, b) => km(v.pos, a.pos) - km(v.pos, b.pos))[0]
            addLog(g, `${v.callsign}: Status 7 – Transport nach ${v.hospital.name}`)
          } else releaseVehicle(v)
        }
        g.incidents = g.incidents.filter((i) => i !== inc)
      }
    }
  }
}

const KEY = 'leitstelle-save-v1'
export const saveGame = (g) => { try { localStorage.setItem(KEY, JSON.stringify(g)) } catch { /* ignore */ } }
export const loadGame = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const g = JSON.parse(raw)
    // Einsatztypen sind Objekte -> aus id wiederherstellen
    for (const i of g.incidents) i.type = INCIDENT_TYPES.find((t) => t.id === i.type.id) || i.type
    return g
  } catch { return null }
}
export const clearSave = () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }

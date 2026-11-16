import KLINIKEN from './data/kliniken.json'
// Reine Spiellogik (ohne React/Leaflet)
import { INCIDENT_TYPES, ROLES, matchSlots, addNeeds, growProb, ESCALATE, maxNeeds, diffNeeds } from './stichworte.js'
import { pickSzenario, incidentTitle } from './szenarien.js'
import { rollAnforderung, ersteLagemeldung, folgemeldung, nachforderungsmeldung, abschlussmeldung } from './lagemeldung.js'
export { incidentTitle, typeCode } from './szenarien.js'

export const GAME_SEC_PER_REAL_SEC = 10 // bei 1x: 1 echte Sekunde = 10 Spielsekunden
export const SLOW = 0.6 // Tempo ohne Sondersignal (Rückfahrt, Einsätze ohne Sondersignal, leichte Transporte)
export const DETOUR = 1.3 // Umwegfaktor Luftlinie -> Straße
export const CENTER = [50.5558, 9.6808] // Fulda
export const MAX_VEHICLES_PER_STATION = Infinity // Stellplätze vorerst unbegrenzt

export const WORKSHOP_COST = 4000
export const STATION_TYPES = {
  FW: { name: 'Feuerwache', cost: 5000, color: '#c1121f' },
  RW: { name: 'Rettungswache', cost: 3000, color: '#e09f00' },
}

export const VEHICLE_TYPES = {
  TSF: { name: 'TSF-W', kind: 'FW', cost: 2000, speed: 70, water: 750, as: 1 },
  LF: { name: 'LF 20', kind: 'FW', cost: 2800, speed: 70, water: 2000, as: 2 },
  HLF: { name: 'HLF 20', kind: 'FW', cost: 3000, speed: 70, water: 1600, as: 2 },
  TLF: { name: 'TLF 4000', kind: 'FW', cost: 3200, speed: 65, water: 4000, as: 1 },
  DLK: { name: 'DLK 23-12', kind: 'FW', cost: 4500, speed: 60, water: 0, as: 0 },
  RW: { name: 'RW', kind: 'FW', cost: 4200, speed: 60, water: 0, as: 0 },
  ELW1: { name: 'ELW 1', kind: 'FW', cost: 2200, speed: 80, water: 0, as: 0 },
  // Sonderfahrzeuge: auf jeder Feuerwache stationierbar (nicht auf Rettungswachen)
  ELW2: { name: 'ELW 2', kind: 'FW', cost: 5500, speed: 70, water: 0, as: 0 },
  ABCE: { name: 'ABC-Erkunder', kind: 'FW', cost: 3500, speed: 80, water: 0, as: 0 },
  GWM: { name: 'GW-Messtechnik', kind: 'FW', cost: 4000, speed: 65, water: 0, as: 0 },
  DEKON: { name: 'Dekon-P', kind: 'FW', cost: 4500, speed: 60, water: 0, as: 0 },
  GWL: { name: 'GW-L', kind: 'FW', cost: 3000, speed: 65, water: 0, as: 0 },
  GWA: { name: 'GW-A', kind: 'FW', cost: 3200, speed: 65, water: 0, as: 0 },
  RTW: { name: 'RTW', kind: 'RW', cost: 2000, speed: 80 },
  NEF: { name: 'NEF', kind: 'RW', cost: 2500, speed: 95 },
  KTW: { name: 'N-KTW', kind: 'RW', cost: 1500, speed: 80 },
}

// Einsatzstichworte nach Hessen-Erlass: siehe stichworte.js
export { INCIDENT_TYPES, ROLES, matchSlots }

export const HOSPITALS = KLINIKEN
// Klinikbetten: reiner Zähler. Jede Klinik startet mit 5 Betten, Ausbau in 5er-Schritten gegen Geld.
// Ein Bett wird mit der Anmeldung (Status 5 -> 7) belegt und nach der Behandlungszeit wieder frei.
export const START_BEDS = 5
export const BED_STEP = 5
export const BED_COST = 2500
export const TREATMENT_SEC = { 1: 2 * 3600, 2: 3 * 3600, 3: 5 * 3600 } // nach Schwere: leicht, mittel, schwer
const newHospital = () => ({ beds: START_BEDS, free: START_BEDS, patients: [] })

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
  5: 'Sprechwunsch – wartet auf Leitstelle',
  6: 'Nicht einsatzbereit (Werkstatt/Panne)',
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
export const etaSec = (vehicle, target, factor = 1) => (km(vehicle.pos, target) * DETOUR) / (VEHICLE_TYPES[vehicle.type].speed * factor) * 3600

// Fährt das Fahrzeug gerade mit Sondersignal? Anfahrt (außer Stichwörter ohne Sondersignal) und Transport schwerer Patienten.
export function sondersignal(g, v) {
  if (v.status === 3) { const inc = g.incidents.find((i) => i.id === v.incidentId); return !inc?.type.ohneSS }
  if (v.status === 7) return (v.patientSeverity || 1) >= 3
  return false
}
export const tempoFactor = (g, v) => (sondersignal(g, v) ? 1 : SLOW)

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
    money: 30000,
    points: 0,
    done: 0,
    failed: 0,
    nextId: 1,
    spawnIn: 120,
    hospitals: Object.fromEntries(HOSPITALS.map((h) => [h.id, newHospital()])),
    stations: [],
    vehicles: [],
    incidents: [],
    log: [{ t: 8 * 3600, text: 'Willkommen in der Leitstelle! Baue zuerst eine Feuer- und eine Rettungswache.' }],
  }
}

const rnd = (a, b) => a + Math.random() * (b - a)
// Funkmeldungen bekommen eine Art, damit die Oberfläche Lagemeldungen und Nachforderungen hervorheben kann
// Protokoll: jede Meldung hat eine Art (kind), optional Fahrzeug (v) und Einsatz (inc, incTitle als Momentaufnahme,
// damit auch erledigte Einsätze im Protokoll filterbar bleiben). quiet = nur im Protokoll/Tagebuch, nicht im Funk.
export const LOG_MAX = 5000
export const LOG_KINDS = {
  lage: 'Lagemeldung', nachforderung: 'Nachforderung', neu: 'Neuer Einsatz', alarm: 'Alarmierung', erledigt: 'Erledigt',
  sprech: 'Sprechwunsch', leitstelle: 'Leitstelle', status: 'Status', vermerk: 'Vermerk', bau: 'Bau/Kauf', info: '',
}
// Arten, die nicht zum Funkverkehr gehören (nur Protokoll und Tagebuch)
export const LOG_QUIET_KINDS = ['neu', 'vermerk', 'bau']
const logKind = (text) => {
  if (/Lagemeldung –|Abschlussmeldung –/.test(text)) return 'lage'
  if (/Folgemeldung –|Nachforderung|fordert ELW 2|ELW 2 wird|Erkundung –|Stichwort wird|Bedarf erhöht|Stichwort erhöht/.test(text)) return 'nachforderung'
  if (/^Neuer Einsatz/.test(text)) return 'neu'
  if (/^Einsatz erledigt/.test(text)) return 'erledigt'
  if (/Status 5|Sprechwunsch –/.test(text)) return 'sprech'
  if (/^Leitstelle/.test(text)) return 'leitstelle'
  if (/Status [1-8]|Einsatzleitung|rückalarmiert|abgezogen/.test(text)) return 'status'
  return 'info'
}
// meta: { kind?, v?: Fahrzeug, inc?: Einsatz, quiet? }
const addLog = (g, text, meta = {}) => {
  const e = { t: g.t, text, kind: meta.kind || logKind(text) }
  if (meta.v) e.v = meta.v.id
  if (meta.inc) { e.inc = meta.inc.id; e.incTitle = incidentTitle(meta.inc) }
  else if (meta.incId != null) { e.inc = meta.incId; e.incTitle = meta.incTitle }
  if (meta.quiet) e.quiet = true
  g.log.unshift(e)
  if (g.log.length > LOG_MAX) g.log.length = LOG_MAX
}
// Protokoll als Text (zum Herunterladen), älteste Zeile zuerst
export const logAsText = (g, entries = g.log) => [...entries].reverse().map((l) => `${fmtClock(l.t)}  ${(LOG_KINDS[l.kind] || 'Info').padEnd(13)} ${l.text}`).join('\n')

export function buildStation(g, kind, pos, name, siteId = null) {
  const def = STATION_TYPES[kind]
  if (g.money < def.cost) return { ok: false, msg: 'Nicht genug Geld.' }
  if (siteId && g.stations.some((s) => s.siteId === siteId)) return { ok: false, msg: 'Hier steht schon eine Wache.' }
  g.money -= def.cost
  const station = { id: g.nextId++, kind, pos, siteId, name: name || `${kind === 'FW' ? 'FW' : 'RW'} ${g.stations.filter((s) => s.kind === kind).length + 1}` }
  g.stations.push(station)
  // erstes Fahrzeug gratis
  addVehicle(g, station, kind === 'FW' ? 'HLF' : 'RTW')
  addLog(g, `${station.name} gebaut (${STATION_TYPES[kind].name}, ${fmtMoney(STATION_TYPES[kind].cost)}).`, { kind: 'bau' })
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
    condition: 100,
    request: null,
  })
}

export function buyVehicle(g, stationId, type) {
  const st = g.stations.find((s) => s.id === stationId)
  const def = VEHICLE_TYPES[type]
  if (!st || (def.kind !== 'ANY' && st.kind !== def.kind)) return { ok: false, msg: 'Passt nicht zur Wache.' }
  if (g.vehicles.filter((v) => v.stationId === stationId).length >= MAX_VEHICLES_PER_STATION) return { ok: false, msg: 'Wache voll.' }
  if (g.money < def.cost) return { ok: false, msg: 'Nicht genug Geld.' }
  g.money -= def.cost
  addVehicle(g, st, type)
  addLog(g, `${g.vehicles[g.vehicles.length - 1].callsign} gekauft (${fmtMoney(def.cost)}).`, { kind: 'bau', v: g.vehicles[g.vehicles.length - 1] })
  return { ok: true }
}

// Verkaufspreis: ungenutzte Fahrzeuge (z. B. versehentlich gekauft) gibt es zum vollen Preis zurück, benutzte zu 60 % je nach Zustand
export function sellPrice(v) {
  const cost = VEHICLE_TYPES[v.type].cost
  return v.used ? Math.round(cost * 0.6 * (0.5 + 0.5 * (v.condition ?? 100) / 100)) : cost
}

export function sellVehicle(g, vehicleId) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v || v.status !== 2) return { ok: false, msg: 'Nur Fahrzeuge auf der Wache (Status 2) können verkauft werden.' }
  const price = sellPrice(v)
  g.money += price
  g.vehicles = g.vehicles.filter((x) => x !== v)
  addLog(g, `${v.callsign} verkauft (+${fmtMoney(price)}).`, { kind: 'bau', v })
  return { ok: true, price }
}

export const isAvailable = (v) => v.status === 1 || v.status === 2

export function dispatch(g, incidentId, vehicleIds) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (!inc) return
  for (const id of vehicleIds) {
    const v = g.vehicles.find((x) => x.id === id)
    if (!v || !isAvailable(v)) continue
    if (v.condition < 30 && Math.random() < Math.min(0.5, (30 - v.condition) / 60)) {
      v.status = 6; v.workshop = false; v.timer = 600;
      addLog(g, `${v.callsign}: Panne beim Ausrücken! Fahrzeug fällt kurz aus.`, { kind: 'status', v, inc })
      continue
    }
    v.status = 3
    v.used = true
    v.incidentId = inc.id
    inc.dispatched = true
    addLog(g, `${v.callsign}: alarmiert, Status 3 – Anfahrt ${sondersignal(g, v) ? 'mit' : 'ohne'} Sondersignal, ca. ${fmtMin(etaSec(v, inc.pos, tempoFactor(g, v)))}.`, { kind: 'alarm', v, inc })
  }
}

// Empfohlene Auswahl: für jede noch offene Rolle das schnellste freie Fahrzeug
export function recommend(g, inc) {
  const picked = []
  const assigned = g.vehicles.filter((v) => v.incidentId === inc.id)
  const unfilled = matchSlots(inc.need, assigned)
  const roles = Object.keys(unfilled).sort((a, b) => ROLES[a].types.length - ROLES[b].types.length)
  for (const r of roles) {
    const c = g.vehicles
      .filter((v) => isAvailable(v) && ROLES[r].types.includes(v.type) && !picked.includes(v.id))
      .sort((a, b) => etaSec(a, inc.pos) - etaSec(b, inc.pos))
      .slice(0, unfilled[r])
    picked.push(...c.map((v) => v.id))
  }
  return picked
}

// Leitstelle funkt den ELW 1 an: "Nachalarmplan sieht ELW 2 vor – wird dieser bei Ihnen benötigt?"
export function askElw2(g, incidentId) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  const elw = inc && g.vehicles.find((v) => v.incidentId === inc.id && v.type === 'ELW1' && v.status === 4)
  if (!elw) return { ok: false, msg: 'Kein ELW 1 vor Ort.' }
  if (!inc.type.elw2Ask || inc.elw2Asked) return { ok: false, msg: 'Schon beantwortet.' }
  inc.elw2Asked = true
  addLog(g, `Leitstelle an ${elw.callsign}: Nachalarmplan sieht ELW 2 vor – wird dieser bei Ihnen benötigt?`, { v: elw, inc })
  if (inc.elw2 === 'needed') {
    inc.need = addNeeds(inc.need, { ELW2: 1 })
    addLog(g, `${elw.callsign}: Ja, ELW 2 wird benötigt – bitte nachalarmieren.`, { v: elw, inc })
  } else addLog(g, `${elw.callsign}: ELW 2 wird nicht benötigt.`, { v: elw, inc })
  return { ok: true }
}

// Einsatzgenerierung an/aus (Spielzeit, Fahrzeuge und laufende Einsätze gehen weiter)
export function toggleSpawn(g) {
  g.spawnPaused = !g.spawnPaused
  addLog(g, g.spawnPaused ? 'Leitstelle: keine neuen Einsätze (Generierung angehalten).' : 'Leitstelle: Einsatzgenerierung wieder aktiv.', { kind: 'leitstelle' })
  return g.spawnPaused
}

export const hospitalFree = (g, id) => g.hospitals[id]?.free ?? 0
export const hospitalBeds = (g, id) => g.hospitals[id]?.beds ?? 0
export const hospitalPatients = (g, id) => g.hospitals[id]?.patients ?? []

// Klinik um 5 Betten erweitern
export function expandHospital(g, hospitalId) {
  const h = HOSPITALS.find((x) => x.id === hospitalId)
  const st = h && g.hospitals[h.id]
  if (!st) return { ok: false, msg: 'Klinik fehlt.' }
  if (g.money < BED_COST) return { ok: false, msg: 'Nicht genug Geld.' }
  g.money -= BED_COST
  st.beds += BED_STEP
  st.free += BED_STEP
  addLog(g, `${h.name}: um ${BED_STEP} Betten erweitert (jetzt ${st.beds}, ${fmtMoney(BED_COST)}).`, { kind: 'bau' })
  return { ok: true }
}

export function buildWorkshop(g, stationId) {
  const st = g.stations.find((x) => x.id === stationId)
  if (!st || st.workshop) return { ok: false, msg: 'Werkstatt vorhanden oder Wache fehlt.' }
  if (g.money < WORKSHOP_COST) return { ok: false, msg: 'Nicht genug Geld.' }
  g.money -= WORKSHOP_COST
  st.workshop = true
  addLog(g, `${st.name}: eigene Werkstatt gebaut (${fmtMoney(WORKSHOP_COST)}).`, { kind: 'bau' })
  return { ok: true }
}

export function repairQuote(g, v) {
  const own = g.stations.find((x) => x.id === v.stationId)?.workshop
  const missing = 100 - v.condition
  return { cost: Math.round(missing * 8 * (own ? 0.6 : 1)), duration: Math.max(120, missing * 12 * (own ? 0.5 : 1)), own: !!own }
}

export function sendToWorkshop(g, vehicleId) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v || v.status !== 2) return { ok: false, msg: 'Fahrzeug muss auf der Wache stehen (Status 2).' }
  if (v.condition >= 100) return { ok: false, msg: 'Fahrzeug ist in perfektem Zustand.' }
  const q = repairQuote(g, v)
  if (g.money < q.cost) return { ok: false, msg: 'Nicht genug Geld.' }
  g.money -= q.cost
  v.status = 6; v.workshop = true; v.timer = q.duration
  addLog(g, `${v.callsign}: Status 6 – in der ${q.own ? 'eigenen ' : ''}Werkstatt (${fmtMin(q.duration)}, ${fmtMoney(q.cost)}).`, { kind: 'status', v })
  return { ok: true }
}

// Optionen für Zielklinik, nach Entfernung sortiert
export function transportOptions(g, v) {
  return HOSPITALS.map((h) => ({ ...h, free: hospitalFree(g, h.id), dist: km(v.pos, h.pos) })).sort((a, b) => a.dist - b.dist)
}

// Leitstelle bestätigt/ändert die Zielklinik nach Sprechwunsch (Status 5)
export function confirmTransport(g, vehicleId, hospitalId) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  const h = HOSPITALS.find((x) => x.id === hospitalId)
  if (!v || v.status !== 5 || !h) return { ok: false, msg: 'Kein offener Sprechwunsch.' }
  if (hospitalFree(g, h.id) <= 0) return { ok: false, msg: `${h.name} meldet keine Kapazität – bitte anderes Haus wählen.` }
  const wish = v.request?.wishId
  g.hospitals[h.id].free-- // Bett wird mit der Anmeldung belegt
  v.status = 7
  v.hospital = h
  v.patientSeverity = v.request?.severity || 1
  v.route = null
  v.request = null
  if (wish && wish === h.id) { g.money += 60; addLog(g, `Leitstelle an ${v.callsign}: Wunschklinik ${h.name} bestätigt (+60 €). Status 7.`, { v }) }
  else if (wish) addLog(g, `Leitstelle an ${v.callsign}: Gegenvorschlag ${h.name} – Patient einverstanden. Status 7.`, { v })
  else addLog(g, `Leitstelle an ${v.callsign}: Zielklinik ${h.name}. Status 7.`, { v })
  return { ok: true }
}

export const SEVERITY_TEXT = { 1: 'leicht', 2: 'mittel', 3: 'schwer' }

// Nur bei leichten Fällen darf der Patient eine Klinik wünschen; sonst entscheidet die Leitstelle.
function requestHospital(g, v, severity = 1) {
  const near = transportOptions(g, v).slice(0, 3)
  const wish = severity === 1 && Math.random() < 0.55 ? near[Math.floor(Math.random() * near.length)] : null
  v.status = 5
  v.request = { wishId: wish ? wish.id : null, since: g.t }
  v.request.severity = severity
  addLog(g, wish ? `${v.callsign}: Status 5 – Patient möchte nach ${wish.name}. Kapazität prüfen!` : `${v.callsign}: Status 5 – erbittet Zielklinik (${SEVERITY_TEXT[severity]} verletzt/erkrankt).`, { v })
}

// Einsatzleitung: ELW 2 vor ELW 1 vor Feuerwehrfahrzeug vor Rettungsdienst, bei Gleichstand das zuerst eingetroffene
const ELRANK = { ELW2: 3, ELW1: 2 }
const elRank = (v) => ELRANK[v.type] ?? (VEHICLE_TYPES[v.type].kind === 'RW' ? 0 : 1)
function pickEL(atScene) {
  return [...atScene].sort((a, b) => elRank(b) - elRank(a) || (a.arrivedAt ?? 0) - (b.arrivedAt ?? 0))[0]
}

const needText = (n) => Object.entries(n).map(([k, c]) => `${c}× ${ROLES[k].short}`).join(', ')
const DEV_MAX_STEPS = 3
const isNight = (t) => { const h = Math.floor(t / 3600) % 24; return h >= 22 || h < 6 }

// Verdeckter Verlauf: 'waechst' (Nachforderung), 'eskaliert' (Stichwort steigt) oder null (stabil).
// Jede weitere Stufe der Kette ist nur halb so wahrscheinlich wie die vorherige.
function rollPlan(inc, mult = 1) {
  if (inc.szenario?.stabil) return null // harmlose Lage (Fehlalarm, Nachschau): keine Nachforderung, keine Hochstufung
  const f = mult * 0.5 ** (inc.devStep || 0)
  const pG = Math.min(0.6, growProb(inc.type.id) * f)
  const pE = ESCALATE[inc.type.id] ? Math.min(0.3, growProb(inc.type.id) * 0.2 * f) : 0
  const u = Math.random()
  return u < pE ? 'eskaliert' : u < pE + pG ? 'waechst' : null
}

function scheduleNext(g, inc) {
  inc.devStep = (inc.devStep || 0) + 1
  if (inc.devStep < DEV_MAX_STEPS) {
    inc.devPlan = rollPlan(inc)
    inc.devAtT = g.t + inc.type.work * rnd(0.2, 0.5)
  }
}

// Setzt den verdeckten Verlauf um. Rückgabe: Meldungstext oder null, wenn nichts passiert.
function develop(g, inc) {
  let plan = inc.devPlan
  inc.devPlan = null
  let text = null
  if (plan === 'eskaliert') {
    // Einsatzleiter erkundet und erhöht das Stichwort; Ziel hängt vom Erkundungsergebnis ab
    const options = [...(ESCALATE[inc.type.id] || [])].sort(() => Math.random() - 0.5)
    const opt = options.find((o) => { const t = INCIDENT_TYPES.find((x) => x.id === o.to); return t && Object.keys(matchSlots(t.need, g.vehicles)).length === 0 })
    const next = opt && INCIDENT_TYPES.find((t) => t.id === opt.to)
    if (next) {
      const oldName = inc.type.name
      const newNeed = maxNeeds(inc.need, next.need)
      const added = diffNeeds(newNeed, inc.need)
      inc.type = next
      inc.szenario = pickSzenario(next.id) || inc.szenario
      inc.anford = rollAnforderung(inc.szenario, (r) => canStaff(g, r))
      inc.anfordDone = true
      for (const r of Object.keys(inc.anford)) if (r !== '__verletzte' && !newNeed[r]) newNeed[r] = 1
      inc.need = newNeed
      inc.extra = { ...next.extra }
      inc.workLeft = Math.max(inc.workLeft, next.work * 0.7)
      inc.escalated = true
      if (next.elw2Ask && inc.elw2 == null) inc.elw2 = Math.random() < 0.6 ? 'needed' : 'notneeded'
      const gruende = Object.keys(added).map((r) => inc.anford?.[r]).filter(Boolean)
      text = `${opt.why}. Stichwort wird von ${oldName} auf ${next.name} erhöht.${Object.keys(added).length ? ` Nachforderung: ${needText(added)}${gruende.length ? ' (' + gruende.join(', ') + ')' : ''}.` : ''}`
      addLog(g, `Stichwort erhöht: ${oldName} → ${next.name}${Object.keys(added).length ? `, Bedarf erhöht um ${needText(added)}` : ''} (Meldung folgt per Sprechwunsch).`, { kind: 'nachforderung', inc, quiet: true })
    } else plan = 'waechst'
  }
  if (plan === 'waechst') {
    // 1–2 Rollen aus den möglichen Zusatzmitteln, soweit der Spieler sie überhaupt besitzt
    let added = {}
    const roles = Object.keys(inc.extra).sort(() => Math.random() - 0.5)
    const want = Math.random() < 0.5 ? 1 : 2
    for (const r of roles) {
      if (Object.keys(added).length >= want) break
      const test = addNeeds(addNeeds(inc.need, added), { [r]: inc.extra[r] })
      if (Object.keys(matchSlots(test, g.vehicles)).length === 0) added = addNeeds(added, { [r]: inc.extra[r] })
    }
    if (Object.keys(added).length) {
      inc.need = addNeeds(inc.need, added)
      for (const r of Object.keys(added)) delete inc.extra[r]
      inc.nachDone = true
      text = inc.type.rd && added.NEF && Object.keys(added).length === 1
        ? `Notarzt-Nachforderung (R3): ${needText(added)} – Patient akut lebensbedrohlich.`
        : `Lage hat sich ausgeweitet. Nachforderung: ${needText(added)}.`
      addLog(g, `Bedarf erhöht um ${needText(added)} (Meldung folgt per Sprechwunsch).`, { kind: 'nachforderung', inc, quiet: true })
    }
  }
  scheduleNext(g, inc)
  return text
}

// Lagemeldung der Einsatzleitung: beschreibt die Lage; nach dem Zufallsprinzip enthält sie den nächsten Entwicklungsschritt
// (Nachforderung oder Hochstufung). Entwicklungen kommen außerdem unabhängig davon als eigener Funkspruch mitten im Einsatz.
// Kann der Spieler die Rolle überhaupt besetzen? (sonst keine Nachforderung, der Einsatz bliebe hängen)
const canStaff = (g, role) => g.vehicles.some((v) => ROLES[role]?.types.includes(v.type))
// Gewürfelte Szenario-Anforderung anwenden: fehlende Rollen in den Bedarf übernehmen. Rückgabe: neu nachgeforderte Rollen.
function applyAnforderung(g, inc) {
  if (inc.anfordDone) return {}
  inc.anfordDone = true
  const assigned = g.vehicles.filter((v) => v.incidentId === inc.id)
  const added = {}
  for (const r of Object.keys(inc.anford || {})) {
    if (r === '__verletzte' || !ROLES[r]) continue
    const have = assigned.filter((v) => ROLES[r].types.includes(v.type)).length
    if ((inc.need[r] || 0) > 0 || have > 0) continue // Stichwort verlangt die Rolle schon oder sie ist bereits alarmiert
    if (!canStaff(g, r)) continue
    added[r] = 1
  }
  if (Object.keys(added).length) {
    inc.need = addNeeds(inc.need, added)
    inc.nachDone = true
    addLog(g, `Bedarf erhöht um ${needText(added)} (Anforderung der Einsatzleitung, Meldung folgt per Sprechwunsch).`, { kind: 'nachforderung', inc, quiet: true })
  }
  return added
}
function reportLage(g, inc, el) {
  inc.revealed = true
  const added = applyAnforderung(g, inc)
  const assigned = g.vehicles.filter((v) => v.incidentId === inc.id)
  const missing = matchSlots(inc.need, assigned)
  const dev = inc.devPlan && Math.random() < 0.5 ? develop(g, inc) : null
  const text = ersteLagemeldung(inc, assigned, missing, added, dev)
  inc.lage = text
  setSprechwunsch(g, el, 'lage', text, inc.id)
}

// Leitstelle fordert bei der Einsatzleitung eine Lagemeldung an
export function requestLagemeldung(g, incidentId) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  const el = inc && g.vehicles.find((v) => v.id === inc.el && v.incidentId === inc.id && v.status === 4)
  if (!el) return { ok: false, msg: 'Noch kein Fahrzeug vor Ort.' }
  if (inc.revealed) return { ok: false, msg: 'Lagemeldung liegt bereits vor.' }
  addLog(g, `Leitstelle an ${el.callsign}: Bitte Lagemeldung.`, { v: el, inc })
  reportLage(g, inc, el)
  // Angeforderte Lagemeldung kommt direkt als Vermerk, nicht als Sprechwunsch
  if (el.sprechwunsch?.kind === 'lage') { const t = el.sprechwunsch.text; el.sprechwunsch = null; addLog(g, `${el.callsign}: ${t}`, { v: el, inc }); addVermerk(g, inc.id, t, el.callsign) }
  return { ok: true }
}

// Rückalarmieren (Status 3) bzw. vom Einsatzort abziehen (Status 4): Fahrzeug wieder freigeben.
// Damit kann die Leitstelle Kräfte umverteilen, wenn mehrere Einsätze aufeinander warten.
export function recallVehicle(g, vehicleId) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v || (v.status !== 3 && v.status !== 4)) return { ok: false, msg: 'Nur Fahrzeuge auf Anfahrt (Status 3) oder am Einsatzort (Status 4) können abgezogen werden.' }
  const inc = g.incidents.find((i) => i.id === v.incidentId)
  const atScene = v.status === 4
  releaseVehicle(v)
  if (inc) {
    inc.dispatched = g.vehicles.some((x) => x.incidentId === inc.id)
    if (inc.el === v.id) inc.el = null
  }
  addLog(g, atScene ? `${v.callsign}: vom Einsatzort abgezogen, Status 1.` : `${v.callsign}: rückalarmiert, Status 1.`, { v, inc })
  return { ok: true }
}

// Sprechwunsch: Das Fahrzeug meldet sich bei der Leitstelle (blinkende 5). Inhalt (Lagemeldung, Nachforderung) sieht die
// Leitstelle erst beim Annehmen im Overlay und trägt ihn als Vermerk in den Einsatz ein. Spiellogisch gilt die Änderung sofort.
const SPRECH_KIND = { lage: 'Lagemeldung', folge: 'Folgemeldung', nachforderung: 'Nachforderung', abschluss: 'Abschlussmeldung', klinik: 'Zielklinik' }
export const sprechKindName = (k) => SPRECH_KIND[k] || 'Sprechwunsch'
function setSprechwunsch(g, v, kind, text, incidentId) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (v.sprechwunsch && v.sprechwunsch.incidentId === incidentId) {
    v.sprechwunsch.text += ' ' + text
    if (kind === 'nachforderung' || kind === 'folge') v.sprechwunsch.kind = kind
  } else v.sprechwunsch = { kind, text, incidentId, incTitle: inc ? incidentTitle(inc) : null, since: g.t }
  addLog(g, `${v.callsign}: Sprechwunsch – ${SPRECH_KIND[kind]}.`, { v, inc })
}
export const hasSprechwunsch = (v) => !!v.sprechwunsch || v.status === 5
export const sprechwunschList = (g) => g.vehicles.filter(hasSprechwunsch).sort((a, b) => (a.sprechwunsch?.since ?? a.request?.since ?? 0) - (b.sprechwunsch?.since ?? b.request?.since ?? 0))

// Vermerk ins Einsatztagebuch
export function addVermerk(g, incidentId, text, by = 'Leitstelle') {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (!inc || !text?.trim()) return { ok: false, msg: 'Kein Text.' }
  inc.vermerke = inc.vermerke || []
  inc.vermerke.push({ t: g.t, text: text.trim(), by })
  addLog(g, `Vermerk (${by}): ${text.trim()}`, { kind: 'vermerk', inc, quiet: true })
  return { ok: true }
}

// Sprechwunsch (Lage/Nachforderung) beantworten, optional mit Vermerk
export function answerSprechwunsch(g, vehicleId, note) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v?.sprechwunsch) return { ok: false, msg: 'Kein offener Sprechwunsch.' }
  const sw = v.sprechwunsch
  const inc = g.incidents.find((i) => i.id === sw.incidentId)
  const meta = inc ? { v, inc } : { v, incId: sw.incidentId, incTitle: sw.incTitle }
  v.sprechwunsch = null
  // Inhalt des Funkspruchs kommt erst jetzt ins Protokoll (vorher kennt ihn die Leitstelle nicht)
  addLog(g, `${v.callsign}: ${sw.text}`, meta)
  if (note?.trim()) { if (inc) addVermerk(g, sw.incidentId, note, `Leitstelle (${v.callsign})`); else addLog(g, `Vermerk (Leitstelle (${v.callsign})): ${note.trim()}`, { ...meta, kind: 'vermerk', quiet: true }) }
  addLog(g, `Leitstelle an ${v.callsign}: ${SPRECH_KIND[sw.kind]} aufgenommen.`, meta)
  return { ok: true }
}

function releaseVehicle(v) {
  v.sprechwunsch = null
  v.route = null
  v.incidentId = null
  v.status = 1
  v.timer = 0
}

function spawnIncident(g) {
  const types = INCIDENT_TYPES.filter((t) => Object.keys(matchSlots(t.need, g.vehicles)).length === 0)
  if (!types.length) return
  const total = types.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * total
  const type = types.find((t) => (r -= t.weight) < 0) || types[0]
  const st = g.stations[Math.floor(Math.random() * g.stations.length)]
  const ang = Math.random() * Math.PI * 2
  const dist = rnd(0.8, 5) // km
  const pos = [st.pos[0] + (Math.cos(ang) * dist) / 111, st.pos[1] + (Math.sin(ang) * dist) / (111 * Math.cos((st.pos[0] * Math.PI) / 180))]
  const elw2 = !type.elw2Ask ? null : Object.keys(matchSlots(addNeeds(type.need, { ELW2: 1 }), g.vehicles)).length === 0 && Math.random() < 0.6 ? 'needed' : 'notneeded'
  const szenario = pickSzenario(type.id)
  const inc = { id: g.nextId++, type, szenario, anford: rollAnforderung(szenario, (r) => canStaff(g, r)), anfordDone: false, need: { ...type.need }, extra: { ...type.extra }, devStep: 0, devPlan: null, devAtT: null, revealed: false, elw2, elw2Asked: false, pos, created: g.t, status: 'open', workLeft: type.work, startedAt: null, dispatched: false }
  inc.devPlan = rollPlan(inc, isNight(g.t) ? 1.3 : 1)
  g.incidents.push(inc)
  addLog(g, `Neuer Einsatz: ${incidentTitle(inc)} (${type.name}; benötigt ${needText(inc.need)}; Meldung über ${st.name}).`, { kind: 'neu', inc })
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
    if (!moveAlong(v, dt * tempoFactor(g, v))) return false
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
    // Spielsekunden bis zum nächsten Einsatz (≈ 12–25 s bei 1x mit 2 Wachen); mehr Wachen = mehr Einsätze
    g.spawnIn = rnd(360, 750) / Math.max(1, (g.stations.length + 6) / 8)
    const open = g.incidents.length
    // Kein neuer Einsatz, solange gar kein Fahrzeug frei ist (verhindert, dass sich alles gegenseitig blockiert)
    // spawnPaused: Leitstelle hat die Einsatzgenerierung angehalten (Spiel läuft weiter)
    if (!g.spawnPaused && g.stations.length && open < 2 + g.stations.length && g.vehicles.some(isAvailable)) spawnIncident(g)
  }

  // Klinikbetten: Patienten nach Behandlungszeit entlassen, Bett wird wieder frei
  for (const h of HOSPITALS) {
    const st = g.hospitals[h.id]
    if (!st?.patients?.length) continue
    const done = st.patients.filter((p) => p.until <= g.t)
    if (!done.length) continue
    st.patients = st.patients.filter((p) => p.until > g.t)
    const was = st.free
    st.free = Math.min(st.beds, st.free + done.length)
    if (was <= 0 && st.free > 0) addLog(g, `${h.name} meldet wieder freie Betten (${st.free}).`)
  }

  // Fahrzeuge
  for (const v of g.vehicles) {
    const inc = g.incidents.find((i) => i.id === v.incidentId)
    const st = g.stations.find((s) => s.id === v.stationId)
    switch (v.status) {
      case 3:
        if (!inc) { releaseVehicle(v); break }
        if (driveTo(g, v, inc.pos, dt, (e) => {
          addLog(g, `${v.callsign}: Routing fehlgeschlagen (${e.message}) – Alarm abgebrochen`, { v, inc })
          releaseVehicle(v)
        })) {
          v.status = 4
          v.arrivedAt = g.t
          addLog(g, `${v.callsign}: Status 4 – am Einsatzort (${incidentTitle(inc)})`, { v, inc })
        }
        break
      case 7:
        if (driveTo(g, v, v.hospital.pos, dt, (e) => addLog(g, `${v.callsign}: Routing fehlgeschlagen (${e.message})`, { v }))) {
          v.status = 8
          v.timer = 300
          g.money += 80
          // Bett bleibt für die Behandlungszeit belegt
          const sev = v.patientSeverity || 1
          g.hospitals[v.hospital.id]?.patients.push({ until: g.t + TREATMENT_SEC[sev], severity: sev, admitted: g.t, by: v.callsign })
          v.patientSeverity = null
          addLog(g, `${v.callsign}: Status 8 – Patient übergeben in ${v.hospital.name} (+80 €)`, { v })
        }
        break
      case 5:
        if (g.t - v.request.since > 1500) {
          const o = transportOptions(g, v).find((h) => h.free > 0) || transportOptions(g, v)[0]
          addLog(g, `${v.callsign}: Leitstelle hat nicht geantwortet – Eigenentscheidung ${o.name}.`, { v })
          if (o.free > 0) { v.request.wishId = null; confirmTransport(g, v.id, o.id) } else v.request.since = g.t
        }
        break
      case 6:
        v.timer -= dt
        if (v.timer <= 0) {
          v.status = km(v.pos, st.pos) < 0.05 ? 2 : 1
          if (v.workshop) { v.condition = 100; addLog(g, `${v.callsign}: Reparatur fertig, Status ${v.status}.`, { v }) }
          else { v.condition = Math.max(v.condition, 50); addLog(g, `${v.callsign}: Panne behoben, Status ${v.status}.`, { v }) }
        }
        break
      case 8:
        v.timer -= dt
        if (v.timer <= 0) { releaseVehicle(v); addLog(g, `${v.callsign}: Status 1 – frei, Rückfahrt zur Wache.`, { v }) }
        break
      case 1:
        if (driveTo(g, v, st.pos, dt, (e) => addLog(g, `${v.callsign}: Routing fehlgeschlagen (${e.message})`, { v }))) { v.status = 2; addLog(g, `${v.callsign}: Status 2 – auf der Wache.`, { v }) }
        break
      default:
        break
    }
  }

  // Einsätze
  for (const inc of [...g.incidents]) {
    const atScene = g.vehicles.filter((v) => v.incidentId === inc.id && v.status === 4)

    // Einsatzleitung: erstes Fahrzeug, dann ELW 1, dann ELW 2 (ELW 2 hat Vorrang vor ELW 1)
    const el = pickEL(atScene)
    if (el && el.id !== inc.el) {
      inc.el = el.id
      addLog(g, `${el.callsign} übernimmt die Einsatzleitung (${incidentTitle(inc)}).`, { v: el, inc })
      // Erkundung beim Eintreffen: Der Einsatzleiter stellt fest, dass die Lage größer ist, und erhöht das Stichwort
      if (!inc.erkundet) {
        inc.erkundet = true
        if (inc.devPlan === 'eskaliert') {
          const t = develop(g, inc)
          if (t) setSprechwunsch(g, el, 'folge', folgemeldung(`Erkundung: ${t}`), inc.id)
        }
      }
      // Wechselt die Einsatzleitung, meldet der neue Leiter ggf. von selbst die Lage (nur solange noch keine Lagemeldung vorliegt)
      // Rettungsdienstfahrzeuge melden bei Brand/Hilfeleistung keine Lage von selbst (das macht die Feuerwehr nach dem Eintreffen)
      if (!inc.revealed && Math.random() < 0.7 && (elRank(el) >= 1 || inc.type.id[0] === 'R')) reportLage(g, inc, el)
      else if (elRank(el) >= 1 || inc.type.id[0] === 'R') {
        // Ohne Lagemeldung setzt die Einsatzleitung die gewürfelte Szenario-Anforderung als eigene Nachforderung ab
        // (bei F/H erst, wenn ein Feuerwehrfahrzeug die Leitung hat)
        const added = applyAnforderung(g, inc)
        if (Object.keys(added).length) setSprechwunsch(g, el, 'nachforderung', nachforderungsmeldung(inc, added), inc.id)
      }
    }
    // Fordert niemand nach, meldet der ELW 1 den ELW-2-Bedarf nach 10 Minuten selbst
    if (inc.elw2 === 'needed' && !inc.elw2Asked && inc.startedAt != null && g.t - inc.startedAt > 600) {
      inc.elw2Asked = true
      inc.need = addNeeds(inc.need, { ELW2: 1 })
      const elw = g.vehicles.find((v) => v.incidentId === inc.id && v.type === 'ELW1' && v.status === 4)
      if (elw) setSprechwunsch(g, elw, 'folge', folgemeldung('Lage erfordert eine erweiterte Einsatzleitung. Nachforderung: 1× ELW 2.'), inc.id)
      else addLog(g, `ELW 1 (${incidentTitle(inc)}): fordert ELW 2 nach.`, { inc })
    }
    const satisfied = Object.keys(matchSlots(inc.need, atScene)).length === 0

    if (inc.status === 'open') {
      if (satisfied) {
        inc.status = 'working'
        if (inc.startedAt == null) {
          inc.startedAt = g.t
          addLog(g, `Alle Kräfte vor Ort, Bearbeitung beginnt (Wartezeit ${fmtMin(g.t - inc.created)}).`, { kind: 'status', inc, quiet: true })
          // Entwicklung (Nachforderung/Eskalation) irgendwann mitten im Einsatz, unabhängig von der Lagemeldung
          inc.devAtT = g.t + inc.type.work * rnd(0.2, 0.7)
          // Lange Wartezeit bis zum Arbeitsbeginn: Lage kann sich zusätzlich verschlimmern (ca. ×1,5)
          if (!inc.devPlan && g.t - inc.created > 600) inc.devPlan = rollPlan(inc, 0.5)
        }
      }
      // Einsätze scheitern vorerst nicht: sie warten, bis genug Kräfte da sind (schnelle Hilfe gibt Bonus)
    } else if (inc.status === 'working') {
      inc.workLeft -= dt
      if (inc.devPlan && inc.devAtT != null && g.t >= inc.devAtT) {
        const elv = g.vehicles.find((v) => v.id === inc.el) || atScene[0]
        const text = develop(g, inc)
        if (text && elv) setSprechwunsch(g, elv, 'folge', folgemeldung(text), inc.id)
      }
      const stillOk = Object.keys(matchSlots(inc.need, atScene)).length === 0
      if (!stillOk) { inc.status = 'open'; addLog(g, `Bearbeitung ruht, es fehlt: ${needText(matchSlots(inc.need, atScene))}.`, { kind: 'status', inc, quiet: true }) } // nachgeforderte Mittel fehlen: Arbeit ruht
      else if (inc.workLeft <= 0) {
        const wait = inc.startedAt - inc.created
        const bonus = wait < inc.type.deadline * 0.5 ? 1.25 : 1
        const reward = Math.round(inc.type.reward * bonus)
        g.money += reward
        g.points += inc.type.points
        g.done++
        const count = g.vehicles.filter((v) => v.incidentId === inc.id).length
        addLog(g, `Einsatz erledigt: ${incidentTitle(inc)} (+${fmtMoney(reward)}${bonus > 1 ? ' mit Schnelligkeitsbonus' : ''}, Dauer ${fmtMin(g.t - inc.created)}, ${count} Fahrzeuge).`, { inc })
        let patients = inc.type.patient ? (inc.type.rd === 'MANV' ? 4 : 1) : 0
        for (const v of g.vehicles) {
          if (v.incidentId !== inc.id) continue
          v.condition = Math.max(0, (v.condition ?? 100) - rnd(6, 14))
          if (v.status === 4 && patients > 0 && (v.type === 'RTW' || v.type === 'KTW')) {
            patients--
            v.incidentId = null
            v.route = null
            requestHospital(g, v, inc.need.NEF ? 3 : inc.type.severity || 1) // mit Notarzt = schwer
          } else { releaseVehicle(v); addLog(g, `${v.callsign}: Status 1 – frei, Rückfahrt zur Wache.`, { v, inc }) }
        }
        const elv = g.vehicles.find((v) => v.id === inc.el)
        if (elv && elv.status === 1 && inc.type.id[0] !== 'R') {
          elv.sprechwunsch = { kind: 'abschluss', text: abschlussmeldung(inc, count), incidentId: inc.id, incTitle: incidentTitle(inc), since: g.t }
          addLog(g, `${elv.callsign}: Sprechwunsch – Abschlussmeldung.`, { v: elv, inc })
        }
        g.incidents = g.incidents.filter((i) => i !== inc)
      }
    }
  }
}

const KEY = 'leitstelle-save-v2' // v2: Hessen-Stichworte (inkompatibel zu v1)
export const saveGame = (g) => { try { localStorage.setItem(KEY, JSON.stringify(g)) } catch { /* ignore */ } }
export const loadGame = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const g = JSON.parse(raw)
    // Einsatztypen sind Objekte -> aus id wiederherstellen
    g.hospitals = g.hospitals || {}
    // Alte Spielstände (zufällige Bettenlage) auf den Bettenzähler umstellen
    for (const h of HOSPITALS) if (g.hospitals[h.id]?.beds == null) g.hospitals[h.id] = newHospital()
    delete g.bedTimer
    for (const v of g.vehicles) { if (v.condition == null) v.condition = 100 }
    for (const l of g.log || []) if (!l.kind) l.kind = logKind(l.text)
    for (const i of g.incidents) { i.type = INCIDENT_TYPES.find((t) => t.id === i.type.id) || i.type; if (!i.szenario || i.szenario.lage) i.szenario = pickSzenario(i.type.id); if (!i.anford) { i.anford = {}; i.anfordDone = true } }
    return g
  } catch { return null }
}
export const clearSave = () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }

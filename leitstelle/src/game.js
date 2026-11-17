import KLINIKEN from './data/kliniken.json'
import ZUSATZ_STANDORTE from './data/zusatz-standorte.json'
import WERKSTAETTEN_DATEN from './data/werkstaetten.json'
// Reine Spiellogik (ohne React/Leaflet)
import { INCIDENT_TYPES, ROLES, matchSlots, addNeeds, growProb, ESCALATE, maxNeeds, diffNeeds } from './stichworte.js'
import { pickSzenario, incidentTitle } from './szenarien.js'
import { rollAnforderung, ersteLagemeldung, folgemeldung, nachforderungsmeldung, abschlussmeldung } from './lagemeldung.js'
import { EINSAETZE, EINSATZ_BY_ID, EINSATZ_BY_NAME, VERGUETUNG_FAKTOR, saisonAktiv } from './data/einsaetze.js'
import { ANTWORTEN, QUITTUNGEN, NACHFRAGEN, pick, fill } from './data/funk-antworten.js'
export { incidentTitle, typeCode } from './szenarien.js'

export const GAME_SEC_PER_REAL_SEC = 10 // bei 1x: 1 echte Sekunde = 10 Spielsekunden
export const SLOW = 0.6 // Tempo ohne Sondersignal (Rückfahrt, Einsätze ohne Sondersignal, leichte Transporte)
export const DETOUR = 1.3 // Umwegfaktor Luftlinie -> Straße
export const CENTER = [50.5558, 9.6808] // Fulda
export const MAX_VEHICLES_PER_STATION = Infinity // Stellplätze vorerst unbegrenzt

export const WORKSHOP_COST = 4000
export const STATION_TYPES = {
  FW: { name: 'Feuerwache', plural: 'Feuerwachen', short: 'FW', cost: 5000, color: '#c1121f' },
  RW: { name: 'Rettungswache', plural: 'Rettungswachen', short: 'RW', cost: 3000, color: '#e09f00' },
  // Luftrettung: ein Standort (Klinikum Fulda, wie Christoph 28), nur einmal baubar, ab 3 Rettungswachen; RTH kommt gratis mit
  LR: { name: 'Luftrettungsstation', plural: 'Luftrettungsstationen', short: 'LR', cost: 20000, color: '#2f6fed', needRW: 3, max: 1 },
}

// ab: Freischaltung – kaufbar ab so vielen Wachen der passenden Art (Feuerwachen bzw. Rettungswachen), wie im Vorbild
export const VEHICLE_TYPES = {
  TSF: { name: 'TSF-W', kind: 'FW', cost: 2000, speed: 70, water: 750, as: 1, ab: 0 },
  LF: { name: 'LF 20', kind: 'FW', cost: 2800, speed: 70, water: 2000, as: 2, ab: 0 },
  HLF: { name: 'HLF 20', kind: 'FW', cost: 3000, speed: 70, water: 1600, as: 2, ab: 2 },
  TLF: { name: 'TLF 4000', kind: 'FW', cost: 3200, speed: 65, water: 4000, as: 1, ab: 2 },
  DLK: { name: 'DLK 23-12', kind: 'FW', cost: 4500, speed: 60, water: 0, as: 0, ab: 3 },
  RW: { name: 'RW', kind: 'FW', cost: 4200, speed: 60, water: 0, as: 0, ab: 4 },
  ELW1: { name: 'ELW 1', kind: 'FW', cost: 2200, speed: 80, water: 0, as: 0, ab: 2 },
  // Sonderfahrzeuge: auf jeder Feuerwache stationierbar (nicht auf Rettungswachen)
  ELW2: { name: 'ELW 2', kind: 'FW', cost: 5500, speed: 70, water: 0, as: 0, ab: 13 },
  ABCE: { name: 'ABC-Erkunder', kind: 'FW', cost: 3500, speed: 80, water: 0, as: 0, ab: 10 },
  GWM: { name: 'GW-Messtechnik', kind: 'FW', cost: 4000, speed: 65, water: 0, as: 0, ab: 10 },
  DEKON: { name: 'Dekon-P', kind: 'FW', cost: 4500, speed: 60, water: 0, as: 0, ab: 12 },
  GWL: { name: 'GW-L', kind: 'FW', cost: 3000, speed: 65, water: 0, as: 0, ab: 7 },
  GWA: { name: 'GW-A', kind: 'FW', cost: 3200, speed: 65, water: 0, as: 0, ab: 5 },
  RTW: { name: 'RTW', kind: 'RW', cost: 2000, speed: 80, ab: 0 },
  NEF: { name: 'NEF', kind: 'RW', cost: 2500, speed: 95, ab: 3 },
  KTW: { name: 'N-KTW', kind: 'RW', cost: 1500, speed: 80, ab: 0 },
  // Rettungshubschrauber: fliegt in Luftlinie ohne Umweg, immer mit vollem Tempo, zählt als Notarzt (Rolle NEF);
  // ob er den Patienten selbst fliegt, entscheidet der Notarzt am Ende des Einsatzes (schwere Fälle). Wartung am Standort.
  RTH: { name: 'RTH', kind: 'LR', cost: 15000, speed: 220, ab: 0, callsign: 'Christoph 28', luft: true },
}
export const countStations = (g, kind) => g.stations.filter((s) => s.kind === kind).length
export const vehicleUnlocked = (g, type) => countStations(g, VEHICLE_TYPES[type].kind) >= (VEHICLE_TYPES[type].ab || 0)
export const unlockText = (type) => { const d = VEHICLE_TYPES[type]; return `ab ${d.ab} ${STATION_TYPES[d.kind]?.plural || 'Wachen'}` }

// Einsatzstichworte nach Hessen-Erlass: siehe stichworte.js
export { INCIDENT_TYPES, ROLES, matchSlots }

export const HOSPITALS = KLINIKEN
// Lkw-Werkstätten im Landkreis (echte Nutzfahrzeugbetriebe aus OSM/Verzeichnissen; Feld plaetze = gleichzeitige Reparaturplätze)
export const WERKSTAETTEN = WERKSTAETTEN_DATEN
export const WERKSTATT_BY_ID = Object.fromEntries(WERKSTAETTEN.map((w) => [w.id, w]))
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
export const etaSec = (vehicle, target, factor = 1) => { const d = VEHICLE_TYPES[vehicle.type]; return (km(vehicle.pos, target) * (d.luft ? 1 : DETOUR)) / (d.speed * (d.luft ? 1 : factor)) * 3600 }

// Fährt das Fahrzeug gerade mit Sondersignal? Anfahrt (außer Stichwörter ohne Sondersignal) und Transport schwerer Patienten.
export function sondersignal(g, v) {
  if (v.status === 3) { const inc = g.incidents.find((i) => i.id === v.incidentId); return !inc?.type.ohneSS }
  if (v.status === 7) return (v.patientSeverity || 1) >= 3
  return false
}
export const tempoFactor = (g, v) => (VEHICLE_TYPES[v.type].luft || sondersignal(g, v) ? 1 : SLOW)

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
  sprech: 'Sprechwunsch', leitstelle: 'Leitstelle', quittung: 'Quittung', status: 'Status', vermerk: 'Vermerk', bau: 'Bau/Kauf', info: '',
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
export const logAsText = (g, entries = g.log) => [...entries].reverse().map((l) => `${fmtClock(l.t)}  ${(LOG_KINDS[l.kind] || 'Info').padEnd(13)} ${l.text.replace(/\n/g, '\n' + ' '.repeat(21))}`).join('\n')

// Erstes Fahrzeug einer neuen Wache (gratis): Feuerwache wählt ein Löschfahrzeug, Rettungswache bekommt einen RTW.
export const FIRST_VEHICLES = { FW: ['HLF', 'LF', 'TSF'], RW: ['RTW'], LR: ['RTH'] }
// Auswahl fürs Bauformular; die neue Wache zählt bei der Freischaltung schon mit
export const firstVehicleOptions = (g, kind) => FIRST_VEHICLES[kind].map((type) => {
  const d = VEHICLE_TYPES[type]
  const locked = countStations(g, kind) + 1 < (d.ab || 0)
  return { type, name: d.luft ? `${d.name} ${d.callsign}` : d.name, locked, text: locked ? unlockText(type) : d.luft ? 'Rettungshubschrauber mit Notarzt' : d.kind === 'RW' ? 'Rettungsdienst' : `${d.water} l Wasser · ${d.as} AS-Trupp${d.as !== 1 ? 's' : ''}` }
})

export function buildStation(g, kind, pos, name, siteId = null, firstVehicle = null) {
  const def = STATION_TYPES[kind]
  if (g.money < def.cost) return { ok: false, msg: 'Nicht genug Geld.' }
  if (siteId && g.stations.some((s) => s.siteId === siteId)) return { ok: false, msg: 'Hier steht schon eine Wache.' }
  if (def.max && countStations(g, kind) >= def.max) return { ok: false, msg: `Es kann nur ${def.max === 1 ? 'eine' : def.max} ${def.max === 1 ? def.name : def.plural} geben.` }
  if (def.needRW && countStations(g, 'RW') < def.needRW) return { ok: false, msg: `${def.name} erst ab ${def.needRW} Rettungswachen.` }
  const opts = firstVehicleOptions(g, kind)
  const first = opts.find((o) => o.type === firstVehicle && !o.locked) || opts.find((o) => !o.locked) || opts[opts.length - 1]
  g.money -= def.cost
  const station = { id: g.nextId++, kind, pos, siteId, name: name || `${def.short} ${g.stations.filter((s) => s.kind === kind).length + 1}` }
  g.stations.push(station)
  addVehicle(g, station, first.type) // erstes Fahrzeug gratis
  addLog(g, `${station.name} gebaut (${STATION_TYPES[kind].name}, ${fmtMoney(STATION_TYPES[kind].cost)}), erstes Fahrzeug: ${VEHICLE_TYPES[first.type].name}.`, { kind: 'bau' })
  return { ok: true, station }
}

// Umbenennen: Wache (Funkrufnamen ihrer Fahrzeuge ziehen mit, wenn sie mit dem alten Wachennamen beginnen) und Fahrzeug
export function renameStation(g, stationId, name) {
  const st = g.stations.find((x) => x.id === stationId)
  if (!st) return { ok: false, msg: 'Wache nicht gefunden.' }
  name = (name || '').trim()
  if (!name) return { ok: false, msg: 'Der Name darf nicht leer sein.' }
  if (name === st.name) return { ok: true }
  if (g.stations.some((x) => x.id !== st.id && x.name === name)) return { ok: false, msg: 'Diesen Namen hat schon eine andere Wache.' }
  const old = st.name
  st.name = name
  for (const v of g.vehicles) if (v.stationId === st.id && v.callsign.startsWith(old + ' ')) v.callsign = name + v.callsign.slice(old.length)
  addLog(g, `${old} umbenannt in ${name}.`, { kind: 'bau' })
  return { ok: true }
}
export function renameVehicle(g, vehicleId, callsign) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v) return { ok: false, msg: 'Fahrzeug nicht gefunden.' }
  callsign = (callsign || '').trim()
  if (!callsign) return { ok: false, msg: 'Der Funkrufname darf nicht leer sein.' }
  if (callsign === v.callsign) return { ok: true }
  if (g.vehicles.some((x) => x.id !== v.id && x.callsign === callsign)) return { ok: false, msg: 'Diesen Funkrufnamen hat schon ein anderes Fahrzeug.' }
  const old = v.callsign
  v.callsign = callsign
  addLog(g, `${old} umbenannt in ${callsign}.`, { kind: 'bau', v })
  return { ok: true }
}

function addVehicle(g, station, type) {
  const n = g.vehicles.filter((v) => v.type === type).length + 1
  const def = VEHICLE_TYPES[type]
  g.vehicles.push({
    id: g.nextId++,
    type,
    stationId: station.id,
    // fester Funkrufname (Hubschrauber: „Christoph 28“), sonst Wache + Typ + Nummer
    callsign: def.callsign ? (n > 1 ? `${def.callsign} ${n}` : def.callsign) : `${station.name} ${def.name} ${n}`,
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
  if (!vehicleUnlocked(g, type)) return { ok: false, msg: `${def.name} erst ${unlockText(type)}.` }
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

// Panne: Das Fahrzeug bleibt liegen, ein Abschlepper kommt (Anfahrt 10 min + 30 s je km zur Werkstatt), schleppt es zur nächsten Lkw-Werkstatt,
// dort Reparatur auf einem freien Platz (Phasen wsPhase: abschlepper → fahrt → warten → reparatur), danach Status 1.
// Kosten (Abschleppen 150 € + 8 € je km, dazu die Reparatur) werden sofort gebucht; das Konto darf dabei ins Minus rutschen.
// Luftfahrzeuge werden am Standort gewartet (kurzer Ausfall wie bisher).
function startPanne(g, v, inc) {
  if (VEHICLE_TYPES[v.type].luft) {
    v.status = 6; v.workshop = false; v.timer = 600
    addLog(g, `${v.callsign}: Technische Panne beim Start! Wartung am Standort, fällt kurz aus.`, { kind: 'status', v, inc })
    return
  }
  const w = workshopOptions(g, v)[0]
  const abschlepp = 150 + Math.round(w.dist * 8)
  g.money -= abschlepp + w.cost
  v.status = 6; v.workshop = true; v.panne = true; v.werkstatt = w.id; v.wsPhase = 'abschlepper'
  v.wsDuration = w.duration; v.timer = Math.round(600 + w.dist * 30); v.route = null; v.incidentId = null
  addLog(g, `${v.callsign}: Panne beim Ausrücken, Fahrzeug bleibt liegen! Abschleppdienst ist angefordert (ca. ${fmtMin(v.timer)}), Ziel ist die Werkstatt ${w.name} (${w.ort}). Kosten ${fmtMoney(abschlepp + w.cost)}.`, { kind: 'status', v, inc })
}

export function dispatch(g, incidentId, vehicleIds) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (!inc) return
  for (const id of vehicleIds) {
    const v = g.vehicles.find((x) => x.id === id)
    if (!v || !isAvailable(v)) continue
    if (v.condition < 30 && Math.random() < Math.min(0.5, (30 - v.condition) / 60)) {
      startPanne(g, v, inc)
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

// Reparatur: eigene Wachen-Werkstatt (40 % günstiger, doppelt so schnell, keine Fahrt) oder Lkw-Werkstatt auf der Karte
// (Fahrzeug fährt mit Status 6 hin, wartet ggf. auf einen freien Platz, wird repariert und fährt mit Status 1 zurück).
export const hasOwnWorkshop = (g, v) => !!VEHICLE_TYPES[v.type].luft || !!g.stations.find((x) => x.id === v.stationId)?.workshop // Hubschrauber: Wartung am Standort
export function repairQuote(g, v) {
  const own = hasOwnWorkshop(g, v)
  const missing = 100 - v.condition
  return { cost: Math.round(missing * 8 * (own ? 0.6 : 1)), duration: Math.max(120, missing * 12 * (own ? 0.5 : 1)), own }
}
// Fahrzeuge je Werkstatt: in Reparatur, wartend, auf Anfahrt
export const workshopVehicles = (g, id) => g.vehicles.filter((v) => v.status === 6 && v.werkstatt === id)
export const workshopBusy = (g, id) => workshopVehicles(g, id).filter((v) => v.wsPhase === 'reparatur').length
export const workshopWaiting = (g, id) => workshopVehicles(g, id).filter((v) => v.wsPhase === 'warten').length
// Werkstattwahl für ein Fahrzeug, nach Fahrzeit sortiert (Anfahrt ohne Sondersignal)
export function workshopOptions(g, v) {
  const q = repairQuote(g, { ...v, stationId: null })
  return WERKSTAETTEN.map((w) => ({ ...w, dist: km(v.pos, w.pos), eta: etaSec(v, w.pos, SLOW), busy: workshopBusy(g, w.id), waiting: workshopWaiting(g, w.id), cost: q.cost, duration: q.duration }))
    .map((w) => ({ ...w, free: Math.max(0, w.plaetze - w.busy - w.waiting) }))
    .sort((a, b) => a.eta - b.eta)
}

// workshopId: id einer Lkw-Werkstatt; ohne Angabe eigene Wachen-Werkstatt (falls vorhanden), sonst nächste Lkw-Werkstatt
// Status 2 (auf der Wache): eigene oder Lkw-Werkstatt; Status 1 (einsatzbereit über Funk, unterwegs): nur Lkw-Werkstatt, Anfahrt von der aktuellen Position
export function sendToWorkshop(g, vehicleId, workshopId = null) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v || (v.status !== 1 && v.status !== 2)) return { ok: false, msg: 'Fahrzeug muss frei sein (Status 1 oder 2).' }
  if (v.condition >= 100) return { ok: false, msg: 'Fahrzeug ist in perfektem Zustand.' }
  const own = v.status === 2 && hasOwnWorkshop(g, v)
  if (!workshopId && own) {
    const q = repairQuote(g, v)
    if (g.money < q.cost) return { ok: false, msg: 'Nicht genug Geld.' }
    g.money -= q.cost
    v.status = 6; v.workshop = true; v.werkstatt = null; v.wsPhase = null; v.timer = q.duration
    addLog(g, `${v.callsign}: Status 6 – ${VEHICLE_TYPES[v.type].luft ? 'Wartung am Standort' : 'in der eigenen Werkstatt'} (${fmtMin(q.duration)}, ${fmtMoney(q.cost)}).`, { kind: 'status', v })
    return { ok: true }
  }
  const w = workshopId ? workshopOptions(g, v).find((x) => x.id === workshopId) : workshopOptions(g, v)[0]
  if (!w) return { ok: false, msg: 'Werkstatt nicht gefunden.' }
  if (g.money < w.cost) return { ok: false, msg: 'Nicht genug Geld.' }
  g.money -= w.cost
  v.status = 6; v.workshop = true; v.werkstatt = w.id; v.wsPhase = 'fahrt'; v.wsDuration = w.duration; v.timer = 0; v.route = null
  addLog(g, `${v.callsign}: Status 6 – Fahrt zur Werkstatt ${w.name} (${w.ort}), Anfahrt ca. ${fmtMin(w.eta)}, Reparatur ${fmtMin(w.duration)}, ${fmtMoney(w.cost)}.`, { kind: 'status', v })
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
  // Hochstufung: halbe Grundwahrscheinlichkeit, mindestens 2 % (F1/H1/R0 2 %, Stufe 2 5 %, Stufe 3 10 %, Stufe 4 17,5 %)
  const pE = ESCALATE[inc.type.id] ? Math.min(0.3, Math.max(0.02, growProb(inc.type.id) * 0.5) * f) : 0
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

// Test-Auslöser (Knopf im Einsatz-Overlay, nur im Entwicklungsmodus): zwingt die Hochstufung des Stichworts.
// Ist die Einsatzleitung vor Ort, meldet sie die Erkundung sofort per Sprechwunsch; sonst beim Eintreffen.
export function testEskalation(g, incidentId) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (!inc) return { ok: false, msg: 'Einsatz nicht gefunden.' }
  if (!(EINSATZ_BY_ID[inc.einsatz]?.ausbreitung?.length) && !ESCALATE[inc.type.id]) return { ok: false, msg: `Für ${inc.type.name} gibt es keine Hochstufung (keine Folgeeinsätze, keine Kette).` }
  if (inc.szenario?.stabil) return { ok: false, msg: 'Harmlose Lage (Fehlalarm/Nachschau): hier ist keine Hochstufung vorgesehen.' }
  inc.devPlan = 'eskaliert'
  inc.devStep = 0
  const elv = g.vehicles.find((v) => v.id === inc.el && v.status === 4)
  if (!elv) { inc.erkundet = false; return { ok: true, msg: 'Hochstufung vorgemerkt: Die Einsatzleitung meldet sie nach dem Eintreffen (Erkundung).' } }
  if (elv.sprechwunsch) return { ok: false, msg: `${elv.callsign} hat noch einen offenen Sprechwunsch.` }
  const text = develop(g, inc)
  if (!text) return { ok: false, msg: 'Keine Hochstufung möglich (Folgeeinsatz nicht freigeschaltet oder Fahrzeugtypen fehlen).' }
  setSprechwunsch(g, elv, 'folge', folgemeldung(`Erkundung: ${text}`), inc.id)
  return { ok: true, msg: `${elv.callsign} meldet sich mit der Erkundung.` }
}

// Setzt den verdeckten Verlauf um. Rückgabe: Meldungstext oder null, wenn nichts passiert.
function develop(g, inc) {
  let plan = inc.devPlan
  inc.devPlan = null
  let text = null
  if (plan === 'eskaliert') {
    // Einsatzleiter erkundet und erhöht das Stichwort. Zuerst die Folgeeinsätze des Katalogs (ausbreitung), sonst die Stichwort-Kette (ESCALATE).
    const cur = inc.einsatz && EINSATZ_BY_ID[inc.einsatz]
    const folgen = (cur?.ausbreitung || []).map((n) => EINSATZ_BY_NAME[n]).filter(Boolean).sort(() => Math.random() - 0.5)
    let next = null, opt = null, katalog = null
    for (const f of folgen) {
      const k = einsatzKandidaten(g, (e) => e === f)[0]
      if (!k) continue
      const sum = (n) => Object.values(n).reduce((a, b) => a + b, 0)
      if (sum(maxNeeds(inc.need, k.need)) <= sum(inc.need)) continue // keine Ausweitung
      katalog = k; next = k.type; opt = { to: k.type.id, why: `Lage hat sich ausgeweitet: ${k.e.name}` }
      break
    }
    if (!next) {
      const options = [...(ESCALATE[inc.type.id] || [])].sort(() => Math.random() - 0.5)
      opt = options.find((o) => { const t = INCIDENT_TYPES.find((x) => x.id === o.to); return t && Object.keys(matchSlots(t.need, g.vehicles)).length === 0 })
      next = opt && INCIDENT_TYPES.find((t) => t.id === opt.to)
      if (next) katalog = katalogFuerStichwort(g, next.id)
    }
    if (next) {
      const oldName = inc.type.name
      const newNeed = maxNeeds(inc.need, katalog ? katalog.need : next.need)
      const added = diffNeeds(newNeed, inc.need)
      inc.type = next
      if (katalog) { inc.einsatz = katalog.e.id; inc.szenario = szenarioVon(katalog.e); inc.reward = Math.max(inc.reward || 0, einsatzReward(katalog.e, next)) }
      else { inc.einsatz = null; inc.szenario = pickSzenario(next.id) || inc.szenario; inc.reward = Math.max(inc.reward || 0, next.reward) }
      inc.anford = rollAnforderung(inc.szenario, (r) => canStaff(g, r))
      inc.anfordDone = true
      for (const r of Object.keys(inc.anford)) if (r !== '__verletzte' && !newNeed[r]) newNeed[r] = 1
      inc.need = newNeed
      inc.extra = { ...next.extra }
      inc.workLeft = Math.max(inc.workLeft, next.work * 0.7)
      inc.escalated = true
      if (next.elw2Ask && inc.elw2 == null) inc.elw2 = canStaff(g, 'ELW2') && Math.random() < 0.6 ? 'needed' : 'notneeded'
      const gruende = Object.keys(added).map((r) => inc.anford?.[r]).filter(Boolean)
      text = `${opt.why}.\nStichwort wird von ${oldName} auf ${next.name} erhöht.${Object.keys(added).length ? `\nNachforderung: ${needText(added)}${gruende.length ? ' (' + gruende.join(', ') + ')' : ''}.` : ''}`
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
        : `Lage hat sich ausgeweitet.\nNachforderung: ${needText(added)}.`
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
    v.sprechwunsch.text += '\n' + text
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
// --- Keine weiteren Einsatzfahrzeuge verfügbar: Einsatz wird mit den alarmierten Kräften abgearbeitet ---
// Der Bedarf sinkt auf das, was alarmiert ist; die Restarbeit wächst um den fehlenden Anteil (halbe Kräfte = ×1,5).
// Rückgabe: { ok, msg, missing, extra } mit extra = zusätzliche Bearbeitungszeit in Sekunden.
export function arbeitenMitVorhandenen(g, incidentId) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (!inc) return { ok: false, msg: 'Einsatz nicht gefunden.' }
  const assigned = g.vehicles.filter((v) => v.incidentId === inc.id)
  if (!assigned.length) return { ok: false, msg: 'Mindestens ein Fahrzeug muss alarmiert sein.' }
  const missing = matchSlots(inc.need, assigned)
  if (!Object.keys(missing).length) return { ok: false, msg: 'Es fehlt nichts.' }
  const total = Object.values(inc.need).reduce((a, b) => a + b, 0)
  const fehlt = Object.values(missing).reduce((a, b) => a + b, 0)
  const share = Math.min(0.9, fehlt / total)
  const extra = Math.round(inc.workLeft * share)
  inc.workLeft += extra
  for (const [r, n] of Object.entries(missing)) { inc.need[r] -= n; if (inc.need[r] <= 0) delete inc.need[r] }
  inc.reduziert = (inc.reduziert || 0) + fehlt
  addLog(g, `Bedarf auf vorhandene Kräfte gesenkt (ohne ${needText(missing)}), Bearbeitung dauert etwa ${fmtMin(extra)} länger.`, { kind: 'status', inc, quiet: true })
  return { ok: true, missing, extra }
}
// Leitstelle funkt das von sich aus (Knopf im Einsatz-Overlay): Ansprechpartner ist die Einsatzleitung, sonst das erste alarmierte Fahrzeug
export function keineFahrzeugeVerfuegbar(g, incidentId) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  const v = inc && (g.vehicles.find((x) => x.id === inc.el) || g.vehicles.find((x) => x.incidentId === inc.id))
  if (!v) return { ok: false, msg: 'Kein alarmiertes Fahrzeug.' }
  const r = arbeitenMitVorhandenen(g, incidentId)
  if (!r.ok) return r
  addLog(g, `Leitstelle an ${v.callsign}: ${ANTWORTEN.keineVerfuegbar}`, { v, inc, kind: 'leitstelle' })
  addLog(g, `${v.callsign}: ${fill(pick(QUITTUNGEN.reduziert), { kraefte: needText(r.missing), dauer: fmtMin(r.extra) })}`, { v, inc, kind: 'quittung' })
  return { ok: true, msg: `${v.callsign} arbeitet mit den Kräften vor Ort (etwa ${fmtMin(r.extra)} länger).` }
}

// --- Antwort der Leitstelle auf einen Sprechwunsch (Texte in data/funk-antworten.js) ---
// Vorschläge aus der Lage (Fahrzeuge auf Anfahrt, fehlende Rollen), Quittung des Fahrzeugs im Funk; bei einer Zusage
// („… wird alarmiert“) hakt die Einsatzleitung nach 5 Spielminuten nach, wenn die Kräfte noch nicht alarmiert sind.
const typeCounts = (vs) => { const m = {}; for (const v of vs) { const n = VEHICLE_TYPES[v.type].name; m[n] = (m[n] || 0) + 1 } return Object.entries(m).map(([n, c]) => `${c}× ${n}`).join(', ') }
export function answerOptions(g, vehicleId) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  const sw = v?.sprechwunsch
  if (!sw) return []
  const inc = g.incidents.find((i) => i.id === sw.incidentId)
  const out = []
  if (sw.kind === 'abschluss') out.push({ text: ANTWORTEN.abschluss, zusage: false })
  if (inc) {
    const assigned = g.vehicles.filter((x) => x.incidentId === inc.id)
    const enRoute = assigned.filter((x) => x.status === 3)
    const missing = matchSlots(inc.need, assigned)
    if (enRoute.length) {
      const eta = Math.max(...enRoute.map((x) => etaSec(x, inc.pos, tempoFactor(g, x))))
      out.push({ text: fill(ANTWORTEN.anfahrt, { kraefte: typeCounts(enRoute), eta: fmtMin(eta) }), zusage: false })
    }
    if (Object.keys(missing).length) out.push({ text: fill(ANTWORTEN.zusage, { kraefte: needText(missing) }), zusage: true })
    // fehlende Kräfte, die die Leitstelle nicht hat: Einsatz mit den vorhandenen abarbeiten; sonst „keine weiteren auf Anfahrt“
    if (sw.kind !== 'abschluss') { if (Object.keys(missing).length) out.push({ text: ANTWORTEN.keineVerfuegbar, zusage: 'reduzieren' }); else if (!enRoute.length) out.push({ text: ANTWORTEN.keine, zusage: false }) }
  }
  out.push({ text: fill(ANTWORTEN.aufgenommen, { art: SPRECH_KIND[sw.kind] || 'Meldung' }), zusage: false })
  return out
}
// Reaktion des Fahrzeugs auf die Antwort der Leitstelle (zusage: true/false aus einem Vorschlag, null = aus dem Text erkennen)
function quittung(g, inc, sw, text, zusage) {
  if (sw.kind === 'abschluss') return pick(QUITTUNGEN.abschluss)
  if (!inc) return pick(QUITTUNGEN.standard)
  const missing = matchSlots(inc.need, g.vehicles.filter((x) => x.incidentId === inc.id))
  const fehlt = Object.keys(missing).length > 0
  const kraefte = needText(missing)
  const reduzieren = zusage === 'reduzieren' || (zusage == null && fehlt && /^nein\b|keine weiteren|nicht verfügbar|keine .*verfügbar/i.test(text))
  if (reduzieren && fehlt) { const r = arbeitenMitVorhandenen(g, inc.id); if (r.ok) return fill(pick(QUITTUNGEN.reduziert), { kraefte, dauer: fmtMin(r.extra) }) }
  const promised = zusage === true || (zusage == null && fehlt && /alarmier|unterwegs|schick|kommt|auf dem weg/i.test(text))
  if (promised && fehlt) { inc.zusage = { roles: { ...missing }, at: g.t }; return fill(pick(QUITTUNGEN.zusage), { kraefte }) }
  if (/^ja\b|anfahrt|eintreffen/i.test(text)) return pick(QUITTUNGEN.anfahrt)
  if (/^nein\b|keine weiteren/i.test(text)) return pick(QUITTUNGEN.keineOk)
  return pick(QUITTUNGEN.standard)
}
// answer = Antwort der Leitstelle (leer = nur quittieren)
export function answerSprechwunsch(g, vehicleId, answer = '', zusage = null) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v?.sprechwunsch) return { ok: false, msg: 'Kein offener Sprechwunsch.' }
  const sw = v.sprechwunsch
  const inc = g.incidents.find((i) => i.id === sw.incidentId)
  const meta = inc ? { v, inc } : { v, incId: sw.incidentId, incTitle: sw.incTitle }
  v.sprechwunsch = null
  // Inhalt des Funkspruchs kommt erst jetzt ins Protokoll (vorher kennt ihn die Leitstelle nicht)
  addLog(g, `${v.callsign}: ${sw.text}`, meta)
  const text = (answer || '').trim()
  if (!text) { addLog(g, `Leitstelle an ${v.callsign}: ${SPRECH_KIND[sw.kind]} aufgenommen.`, { ...meta, kind: 'leitstelle' }); return { ok: true } }
  // Antwort steht als Leitstellen-Eintrag im Funk und im Einsatztagebuch, das Fahrzeug quittiert
  addLog(g, `Leitstelle an ${v.callsign}: ${text}`, { ...meta, kind: 'leitstelle' })
  addLog(g, `${v.callsign}: ${quittung(g, inc, sw, text, zusage)}`, { ...meta, kind: 'quittung' })
  return { ok: true }
}

function releaseVehicle(v) {
  v.sprechwunsch = null
  v.route = null
  v.incidentId = null
  v.status = 1
  v.timer = 0
}

// --- Einsatzkatalog (data/einsaetze.js): Vorbild-Einsätze, verknüpft mit den Hessen-Stichworten ---
const TYPE_BY_ID = Object.fromEntries(INCIDENT_TYPES.map((t) => [t.id, t]))
const PUMPEN = ['G', 'GT', 'S', 'TLF'] // Rollen, die mit Löschfahrzeugen besetzt werden
// Ist der Katalog-Einsatz für den aktuellen Ausbau freigeschaltet (Wachenzahl, Saison, aktiv)?
function einsatzVerfuegbar(g, e) {
  if (e.aktiv === false || !TYPE_BY_ID[e.stichwort]) return false
  const nFW = countStations(g, 'FW'), nRW = countStations(g, 'RW')
  if (nFW < (e.abFW || 0) || nRW < (e.abRW || 0)) return false
  if (e.bisFW != null && nFW > e.bisFW) return false
  return saisonAktiv(e.saison, g.datum ? new Date(g.datum) : new Date())
}
// Bedarf = AAO des Stichworts, erhöht um das, was der Katalog-Einsatz mehr verlangt. Rollen ohne passendes Fahrzeug entfallen.
function einsatzNeed(g, e, type) {
  const need = { ...type.need }
  const nFW = countStations(g, 'FW'), nRW = countStations(g, 'RW')
  for (const [r, n] of Object.entries(e.fahrzeuge || {})) {
    const ab = e.fahrzeugeAb?.[r]
    if (ab && (ROLES[r]?.types.every((t) => VEHICLE_TYPES[t].kind === 'RW') ? nRW : nFW) < ab) continue
    if (r === 'LF') { const have = PUMPEN.reduce((s, k) => s + (need[k] || 0), 0); if (n > have) need.S = (need.S || 0) + n - have }
    else if (ROLES[r]) need[r] = Math.max(need[r] || 0, n)
  }
  for (const r of Object.keys(need)) if (!canStaff(g, r)) delete need[r]
  return need
}
const hasCore = (need) => [...PUMPEN, 'RTW', 'KT', 'KTW'].some((r) => need[r] > 0)
// Szenario-Bausteine (für lagemeldung.js) aus einem Katalog-Einsatz
const szenarioVon = (e) => ({ name: e.name, sehe: e.sehe, mache: e.mache, kraefte: e.kraefte, abschluss: e.abschluss, stabil: !!e.stabil, anforderung: e.anforderung || {}, verletzte: e.patienten && e.patienten[1] >= 2 ? e.patienten : null })
const einsatzReward = (e, type) => e.verguetung ? Math.round(((e.verguetung[0] + e.verguetung[1]) / 2) * VERGUETUNG_FAKTOR / 10) * 10 : type.reward
// Alle derzeit möglichen Katalog-Einsätze (freigeschaltet und mit dem Fuhrpark besetzbar)
function einsatzKandidaten(g, filter = () => true) {
  const out = []
  for (const e of EINSAETZE) {
    if (!filter(e) || !einsatzVerfuegbar(g, e)) continue
    const type = TYPE_BY_ID[e.stichwort]
    const need = einsatzNeed(g, e, type)
    if (!hasCore(need)) continue
    out.push({ e, type, need })
  }
  return out
}
// Zufälliger Katalog-Einsatz zu einem Stichwort (für Hochstufungen), sonst null
function katalogFuerStichwort(g, typeId) {
  const list = einsatzKandidaten(g, (e) => e.stichwort === typeId)
  return list.length ? list[Math.floor(Math.random() * list.length)] : null
}
function spawnIncident(g) {
  const cands = einsatzKandidaten(g)
  if (!cands.length) return
  const total = cands.reduce((s, c) => s + (c.e.gewicht || 1), 0)
  let r = Math.random() * total
  const pick = cands.find((c) => (r -= c.e.gewicht || 1) < 0) || cands[0]
  const { e, type, need } = pick
  const bodenwachen = g.stations.filter((s) => s.kind !== 'LR') // Einsätze entstehen im Umfeld der Feuer- und Rettungswachen, nicht der Luftrettung
  const st = bodenwachen[Math.floor(Math.random() * bodenwachen.length)] || g.stations[0]
  const ang = Math.random() * Math.PI * 2
  const dist = rnd(0.8, 5) // km
  const pos = [st.pos[0] + (Math.cos(ang) * dist) / 111, st.pos[1] + (Math.sin(ang) * dist) / (111 * Math.cos((st.pos[0] * Math.PI) / 180))]
  const elw2 = !type.elw2Ask || need.ELW2 ? null : canStaff(g, 'ELW2') && Math.random() < 0.6 ? 'needed' : 'notneeded'
  const szenario = szenarioVon(e)
  const extra = { ...type.extra }
  for (const k of Object.keys(extra)) if (need[k] || !canStaff(g, k)) delete extra[k]
  const inc = { id: g.nextId++, type, einsatz: e.id, szenario, reward: einsatzReward(e, type), anford: rollAnforderung(szenario, (r) => canStaff(g, r)), anfordDone: false, need, extra, devStep: 0, devPlan: null, devAtT: null, revealed: false, elw2, elw2Asked: false, pos, created: g.t, status: 'open', workLeft: type.work, startedAt: null, dispatched: false }
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
  if (VEHICLE_TYPES[v.type].luft && !(v.route && v.route.key === key)) v.route = { key, pts: [[...target]], i: 0 } // Hubschrauber: Luftlinie, kein Routing
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
      case 6: {
        const w = v.werkstatt && WERKSTATT_BY_ID[v.werkstatt]
        if (w) {
          // Lkw-Werkstatt: Anfahrt → warten auf Platz (Reihenfolge nach Ankunft) → Reparatur → Rückfahrt mit Status 1
          if (v.wsPhase === 'abschlepper') {
            v.timer -= dt
            if (v.timer <= 0) { v.wsPhase = 'fahrt'; v.timer = 0; addLog(g, `${v.callsign}: Abschleppdienst ist eingetroffen, Fahrzeug wird zur Werkstatt ${w.name} geschleppt.`, { v }) }
          } else if (v.wsPhase === 'fahrt') {
            if (driveTo(g, v, w.pos, dt, (e) => addLog(g, `${v.callsign}: Routing fehlgeschlagen (${e.message})`, { v }))) {
              v.wsPhase = 'warten'; v.wsSince = g.t
              addLog(g, `${v.callsign}: in der Werkstatt ${w.name} angekommen.`, { v })
            }
          }
          if (v.wsPhase === 'warten') {
            const before = g.vehicles.filter((x) => x.status === 6 && x.werkstatt === w.id && x.wsPhase === 'warten' && x.wsSince < v.wsSince).length
            if (workshopBusy(g, w.id) + before < w.plaetze) {
              v.wsPhase = 'reparatur'; v.timer = v.wsDuration || repairQuote(g, { ...v, stationId: null }).duration
              addLog(g, `${v.callsign}: Reparatur bei ${w.name} begonnen (${fmtMin(v.timer)}).`, { v })
            }
          } else if (v.wsPhase === 'reparatur') {
            v.timer -= dt
            if (v.timer <= 0) {
              v.condition = 100; v.werkstatt = null; v.wsPhase = null; v.panne = false; v.status = 1; v.route = null
              addLog(g, `${v.callsign}: Reparatur bei ${w.name} fertig, Status 1 – Rückfahrt zur Wache.`, { v })
            }
          }
          break
        }
        v.timer -= dt
        if (v.timer <= 0) {
          v.status = km(v.pos, st.pos) < 0.05 ? 2 : 1
          if (v.workshop) { v.condition = 100; addLog(g, `${v.callsign}: Reparatur fertig, Status ${v.status}.`, { v }) }
          else { v.condition = Math.max(v.condition, 50); addLog(g, `${v.callsign}: Panne behoben, Status ${v.status}.`, { v }) }
        }
        break
      }
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

    // Zugesagte Kräfte („wird alarmiert“): nach 5 Spielminuten hakt die Einsatzleitung nach, wenn sie noch fehlen
    if (inc.zusage && g.t - inc.zusage.at > 300) {
      const missing = matchSlots(inc.need, g.vehicles.filter((v) => v.incidentId === inc.id))
      const open = Object.fromEntries(Object.entries(inc.zusage.roles).filter(([r]) => missing[r]))
      const elv = g.vehicles.find((v) => v.id === inc.el && v.status === 4)
      if (Object.keys(open).length && elv && !elv.sprechwunsch) setSprechwunsch(g, elv, 'nachforderung', fill(pick(NACHFRAGEN), { kraefte: needText(open) }), inc.id)
      inc.zusage = null
    }

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
        const reward = Math.round((inc.reward ?? inc.type.reward) * bonus)
        g.money += reward
        g.points += inc.type.points
        g.done++
        const count = g.vehicles.filter((v) => v.incidentId === inc.id).length
        addLog(g, `Einsatz erledigt: ${incidentTitle(inc)} (+${fmtMoney(reward)}${bonus > 1 ? ' mit Schnelligkeitsbonus' : ''}, Dauer ${fmtMin(g.t - inc.created)}, ${count} Fahrzeuge).`, { inc })
        let patients = inc.type.patient ? (inc.type.rd === 'MANV' ? 4 : 1) : 0
        const severity = inc.need.NEF ? 3 : inc.type.severity || 1 // mit Notarzt = schwer
        // Rettungshubschrauber vor Ort: Der Notarzt entscheidet, ob der Patient geflogen wird – bei schweren Fällen meist (60 %),
        // ohne bodengebundenen Transportwagen immer, bei leichten Fällen fährt der RTW.
        const rth = g.vehicles.find((v) => v.incidentId === inc.id && v.status === 4 && VEHICLE_TYPES[v.type].luft)
        const bodengebunden = g.vehicles.some((v) => v.incidentId === inc.id && v.status === 4 && (v.type === 'RTW' || v.type === 'KTW'))
        const fliegt = rth && patients > 0 && (!bodengebunden || (severity >= 3 && Math.random() < 0.6))
        if (rth && patients > 0) addLog(g, fliegt ? `${rth.callsign}: Notarzt entscheidet – Patient wird geflogen (${SEVERITY_TEXT[severity]}).` : `${rth.callsign}: Notarzt entscheidet – Transport bodengebunden mit RTW, Hubschrauber wird frei.`, { v: rth, inc })
        if (fliegt) { // Hubschrauber nimmt den (ersten) Patienten, bevor die Transportwagen verteilt werden
          patients--
          rth.condition = Math.max(0, (rth.condition ?? 100) - rnd(6, 14))
          rth.incidentId = null; rth.route = null
          requestHospital(g, rth, severity)
        }
        for (const v of g.vehicles) {
          if (v.incidentId !== inc.id) continue
          v.condition = Math.max(0, (v.condition ?? 100) - rnd(6, 14))
          if (v.status === 4 && patients > 0 && (v.type === 'RTW' || v.type === 'KTW')) {
            patients--
            v.incidentId = null
            v.route = null
            requestHospital(g, v, severity)
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
    // Standorte aus zusatz-standorte.json (Luftrettung u. a.) können nachträglich korrigiert worden sein: gebaute Stationen und ihre Fahrzeuge auf der Wache ziehen mit
    for (const st of g.stations) {
      const site = ZUSATZ_STANDORTE.find((x) => x.id === st.siteId)
      if (!site || (st.pos[0] === site.pos[0] && st.pos[1] === site.pos[1])) continue
      for (const v of g.vehicles) if (v.stationId === st.id && v.status === 2) v.pos = [...site.pos]
      st.pos = [...site.pos]
    }
    for (const l of g.log || []) if (!l.kind) l.kind = logKind(l.text)
    for (const i of g.incidents) {
      i.type = INCIDENT_TYPES.find((t) => t.id === i.type.id) || i.type
      const e = i.einsatz && EINSATZ_BY_ID[i.einsatz]
      if (e) i.szenario = szenarioVon(e) // Texte aus dem Katalog (ggf. inzwischen bearbeitet)
      else if (!i.szenario || i.szenario.lage) i.szenario = pickSzenario(i.type.id)
      if (!i.anford) { i.anford = {}; i.anfordDone = true }
    }
    return g
  } catch { return null }
}
export const clearSave = () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }

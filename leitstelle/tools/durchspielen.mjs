// Automatisches Durchspielen der reinen Spiellogik (ohne Oberfläche), um Logik- und Balance-Fehler zu finden.
// Aufruf (bündelt game.js mit esbuild und spielt N Spielstunden):
//   npx esbuild tools/durchspielen.mjs --bundle --platform=node --format=esm --outfile=/tmp/durchspielen.bundle.mjs && node /tmp/durchspielen.bundle.mjs 48
import * as G from '../src/game.js'
import { ROLES } from '../src/stichworte.js'
import OSM_SITES from '../src/data/feuerwehren.json'
import EXTRA_SITES from '../src/data/zusatz-standorte.json'

const HOURS = Number(process.argv[2] || 48)
const DT = 15 // Spielsekunden je Tick
const SITES = [...OSM_SITES, ...EXTRA_SITES]

// Routing: Luftlinie statt OSRM (keine Netzzugriffe)
globalThis.fetch = async (url) => {
  const m = url.match(/driving\/([-\d.]+),([-\d.]+);([-\d.]+),([-\d.]+)/)
  return { ok: true, json: async () => ({ code: 'Ok', routes: [{ geometry: { coordinates: [[+m[1], +m[2]], [+m[3], +m[4]]] } }] }) }
}

const g = G.newGame()
const issues = []
const note = (k, text) => { issues.push(`${G.fmtClock(g.t)} ${k}: ${text}`) }
const byDist = (kind) => SITES.filter((s) => (s.kind || 'FW') === kind && !g.stations.some((st) => st.siteId === s.id))
  .sort((a, b) => G.km(a.pos, G.CENTER) - G.km(b.pos, G.CENTER))
const build = (kind) => {
  const site = byDist(kind)[0]
  const r = G.buildStation(g, kind, site.pos, site.name, site.id)
  if (!r.ok) note('Bau', r.msg)
  else purchases.push(`${G.fmtClock(g.t)} ${kind} ${site.name}`)
  return r
}
const purchases = []
const SPECIAL = ['DLK', 'ELW1', 'NEF', 'TLF', 'RW', 'KTW', 'GWL', 'GWA', 'ELW2', 'ABCE', 'GWM', 'DEKON']
const typeCount = {}
const missing = {}
const waitStats = { max: 0, over: 0, n: 0 }
const seenLog = new Set()
const events = []
const lastStatus = new Map()

// Erste Wachen
build('FW'); build('RW')

function ki() {
  // Sprechwünsche
  for (const v of g.vehicles.filter((x) => x.status === 5)) {
    const opts = G.transportOptions(g, v)
    const wish = opts.find((h) => h.id === v.request.wishId && h.free > 0)
    const h = wish || opts.find((o) => o.free > 0)
    if (h) { const r = G.confirmTransport(g, v.id, h.id); if (!r.ok) note('Transport', r.msg) }
  }
  // Alarmieren
  for (const inc of g.incidents) {
    if (inc.status !== 'open') continue
    const ids = G.recommend(g, inc)
    // Wie ein umsichtiger Disponent: Erstalarm nur, wenn alles Benötigte frei ist; Nachforderungen mit dem, was da ist
    const already = g.vehicles.some((v) => v.incidentId === inc.id)
    const full = Object.keys(G.matchSlots(inc.need, [...g.vehicles.filter((v) => v.incidentId === inc.id), ...ids.map((id) => g.vehicles.find((v) => v.id === id))])).length === 0
    if (ids.length && (full || already)) G.dispatch(g, inc.id, ids)
    const assigned = g.vehicles.filter((v) => v.incidentId === inc.id)
    const unfilled = G.matchSlots(inc.need, assigned)
    for (const role of Object.keys(unfilled)) {
      const types = ROLES[role].types
      const owned = g.vehicles.filter((v) => types.includes(v.type))
      if (owned.length) continue // nur gerade unterwegs
      missing[role] = (missing[role] || 0) + 1
      // Fehlenden Typ kaufen (günstigsten), wenn Geld da ist
      const type = [...types].sort((a, b) => G.VEHICLE_TYPES[a].cost - G.VEHICLE_TYPES[b].cost)[0]
      const kind = G.VEHICLE_TYPES[type].kind
      const st = g.stations.find((s) => s.kind === kind)
      if (st && g.money >= G.VEHICLE_TYPES[type].cost) { const r = G.buyVehicle(g, st.id, type); if (r.ok) purchases.push(`${G.fmtClock(g.t)} ${type} für ${inc.type.name}`); else note('Kauf', r.msg) }
      else if (!st) note('Kauf', `keine ${kind}-Wache für ${type} (${inc.type.name})`)
    }
  }
  // Lagemeldung anfordern
  for (const inc of g.incidents) if (inc.status === 'working' && !inc.revealed && inc.el) G.requestLagemeldung(g, inc.id)
  // ELW-2-Rückfrage
  for (const inc of g.incidents) if (inc.type.elw2Ask && !inc.elw2Asked) G.askElw2(g, inc.id)
  // Werkstatt
  for (const v of g.vehicles) if (v.status === 2 && v.condition < 40) { const r = G.sendToWorkshop(g, v.id); if (!r.ok) note('Werkstatt', r.msg) }
  // Ausbau: zweites Fahrzeug je Wache, dann neue Wachen, dann Sonderfahrzeuge (schaltet größere Einsätze frei)
  const fw = g.stations.filter((s) => s.kind === 'FW').length, rw = g.stations.filter((s) => s.kind === 'RW').length
  if (g.money > 12000 && fw + rw < 8) build(fw <= rw ? 'FW' : 'RW')
  else if (g.money > 15000 && fw + rw >= 8) {
    const type = SPECIAL.find((t) => g.vehicles.filter((v) => v.type === t).length < (['NEF', 'DLK', 'TLF', 'ELW1'].includes(t) ? 2 : 1))
    if (type) {
      const kind = G.VEHICLE_TYPES[type].kind
      const st = g.stations.filter((s) => s.kind === kind).sort((a, b) => g.vehicles.filter((v) => v.stationId === a.id).length - g.vehicles.filter((v) => v.stationId === b.id).length)[0]
      const r = G.buyVehicle(g, st.id, type)
      if (r.ok) purchases.push(`${G.fmtClock(g.t)} ${type} (Sonder, ${st.name})`); else note('Kauf', r.msg)
    }
  } else if (g.money > 8000) {
    const st = g.stations.find((s) => g.vehicles.filter((v) => v.stationId === s.id).length < 2)
    if (st) { const t = st.kind === 'FW' ? 'LF' : 'RTW'; const r = G.buyVehicle(g, st.id, t); if (r.ok) purchases.push(`${G.fmtClock(g.t)} ${t} (2. Fahrzeug ${st.name})`) }
  }
}

function check() {
  for (const k of ['money', 'points', 't']) if (!Number.isFinite(g[k])) note('NaN', `${k} = ${g[k]}`)
  for (const v of g.vehicles) {
    if (!Number.isFinite(v.pos[0]) || !Number.isFinite(v.condition)) note('NaN', `${v.callsign} pos/condition`)
    const key = `${v.status}|${v.incidentId}`
    const last = lastStatus.get(v.id)
    if (!last || last.key !== key) lastStatus.set(v.id, { key, since: g.t })
    else if (g.t - last.since > 3 * 3600 && v.status !== 2 && !last.noted) { last.noted = true; note('Hängt', `${v.callsign} seit 3 h in Status ${v.status}`) }
  }
  for (const inc of g.incidents) {
    if (inc.status === 'open' && g.t - inc.created > 2 * 3600 && !inc.noted) { inc.noted = true; note('Wartet', `${inc.type.name} seit 2 h offen, fehlt: ${JSON.stringify(G.matchSlots(inc.need, g.vehicles.filter((v) => v.incidentId === inc.id)))}`) }
  }
  for (const l of g.log) {
    if (seenLog.has(l)) continue
    seenLog.add(l)
    if (/fehlgeschlagen|Panne|NaN|undefined|null/.test(l.text)) note('Funk', l.text)
    const m = l.text.match(/^Neuer Einsatz: (.+)$/)
    if (m) typeCount[m[1]] = (typeCount[m[1]] || 0) + 1
    if (/Nachforderung|erhöht|ELW 2|Erkundung/.test(l.text)) events.push(l.text)
  }
}

const hourly = []
let nextKi = 0, nextHour = g.t + 3600, steps = (HOURS * 3600) / DT
const doneBefore = new Map()
const origSplice = g.incidents
for (let i = 0; i < steps; i++) {
  // Wartezeiten erfassen, bevor Einsätze verschwinden
  for (const inc of g.incidents) if (inc.status === 'working' && inc.startedAt != null && !doneBefore.has(inc.id)) {
    doneBefore.set(inc.id, true); const w = inc.startedAt - inc.created; waitStats.n++; waitStats.max = Math.max(waitStats.max, w); if (w > inc.type.deadline) waitStats.over++
  }
  G.tick(g, DT)
  await new Promise((r) => setImmediate(r)) // Routen-Promises abarbeiten
  if (g.t >= nextKi) { ki(); check(); nextKi = g.t + 60 }
  if (g.t >= nextHour) {
    nextHour += 3600
    hourly.push({ h: G.fmtClock(g.t), money: Math.round(g.money), st: g.stations.length, fz: g.vehicles.length, done: g.done, offen: g.incidents.filter((x) => x.status === 'open').length, laufend: g.incidents.filter((x) => x.status === 'working').length })
  }
}

// Spielstand für den Browser-Test schreiben (SAVE=pfad): im Browser als localStorage "leitstelle-save-v2" einspielen
if (process.env.SAVE) {
  const { writeFileSync } = await import('node:fs')
  for (const v of g.vehicles) delete v.route
  writeFileSync(process.env.SAVE, JSON.stringify(g))
  console.log('Spielstand geschrieben:', process.env.SAVE)
}
console.log('== Stundenwerte ==')
console.table(hourly)
console.log('== Käufe ==\n' + purchases.join('\n'))
console.log('== Fehlende Rollen (Einsätze ohne passendes Fahrzeug) ==', missing)
console.log('== Wartezeiten ==', { n: waitStats.n, maxMin: Math.round(waitStats.max / 60), ueberFrist: waitStats.over })
console.log('== Fahrzeuge je Typ ==', Object.fromEntries(Object.keys(G.VEHICLE_TYPES).map((t) => [t, g.vehicles.filter((v) => v.type === t).length]).filter(([, n]) => n)))
console.log('== Einsätze je Stichwort ==', typeCount)
console.log(`== Entwicklungen (${events.length}) ==\n` + events.slice(0, 25).join('\n'))
console.log('== Auffälligkeiten ==\n' + (issues.length ? issues.join('\n') : 'keine'))

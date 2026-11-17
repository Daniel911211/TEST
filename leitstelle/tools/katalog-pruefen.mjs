// Prüft den Einsatzkatalog (src/data/einsaetze.js) auf Fehler, die beim Bearbeiten passieren können.
// Aufruf: node tools/katalog-pruefen.mjs
import { EINSAETZE, saisonAktiv } from '../src/data/einsaetze.js'
import { INCIDENT_TYPES, ROLES } from '../src/stichworte.js'

const typeIds = new Set(INCIDENT_TYPES.map((t) => t.id))
const roles = new Set([...Object.keys(ROLES), 'LF'])
const saisons = new Set([null, undefined, 'weihnachten', 'silvester', 'halloween', 'vatertag', 'muttertag', 'sommer', 'ostern', 'fussball'])
const fehler = [], hinweise = []
const ids = new Set(), names = new Set(EINSAETZE.map((e) => e.name))

for (const e of EINSAETZE) {
  const wo = `${e.id || '?'} (${e.name || '?'})`
  if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) fehler.push(`${wo}: id fehlt oder enthält ungültige Zeichen`)
  if (ids.has(e.id)) fehler.push(`${wo}: id doppelt`)
  ids.add(e.id)
  if (!e.name) fehler.push(`${wo}: name fehlt`)
  if (!typeIds.has(e.stichwort)) fehler.push(`${wo}: unbekanntes Stichwort ${e.stichwort}`)
  for (const r of Object.keys(e.fahrzeuge || {})) if (!roles.has(r)) fehler.push(`${wo}: unbekannte Rolle in fahrzeuge: ${r}`)
  for (const r of Object.keys(e.fahrzeugeAb || {})) if (!(e.fahrzeuge || {})[r]) fehler.push(`${wo}: fahrzeugeAb.${r} ohne Eintrag in fahrzeuge`)
  for (const [r, v] of Object.entries(e.anforderung || {})) {
    if (!ROLES[r]) fehler.push(`${wo}: unbekannte Rolle in anforderung: ${r}`)
    if (!Array.isArray(v) || typeof v[0] !== 'number' || v[0] <= 0 || v[0] > 1 || typeof v[1] !== 'string') fehler.push(`${wo}: anforderung.${r} muss [0–1, 'Begründung'] sein`)
  }
  for (const r of Object.keys(e.kraefte || {})) if (!ROLES[r]) fehler.push(`${wo}: unbekannte Rolle in kraefte: ${r}`)
  if (!Array.isArray(e.patienten) || e.patienten.length !== 2 || e.patienten[0] > e.patienten[1]) fehler.push(`${wo}: patienten muss [min, max] sein`)
  if (e.verguetung != null && (!Array.isArray(e.verguetung) || e.verguetung.length !== 2)) fehler.push(`${wo}: verguetung muss [min, max] oder null sein`)
  for (const n of e.ausbreitung || []) if (!names.has(n)) fehler.push(`${wo}: ausbreitung nennt unbekannten Einsatz "${n}"`)
  if (!saisons.has(e.saison)) fehler.push(`${wo}: unbekannte saison ${e.saison}`)
  if (typeof e.abFW !== 'number' || typeof e.abRW !== 'number') fehler.push(`${wo}: abFW/abRW müssen Zahlen sein`)
  if (e.aktiv !== false) {
    if (!e.sehe || !e.mache) hinweise.push(`${wo}: ohne Lagemeldungstext (sehe/mache) – es wird die Stichwort-Beschreibung verwendet`)
    if (e.stichwort[0] === 'R' && !(e.fahrzeuge?.RTW || e.fahrzeuge?.KT || e.fahrzeuge?.KTW)) hinweise.push(`${wo}: Rettungsdienst-Einsatz ohne RTW/KTW in fahrzeuge`)
  }
}
const aktiv = EINSAETZE.filter((e) => e.aktiv !== false)
console.log(`Einträge: ${EINSAETZE.length}, aktiv: ${aktiv.length}, saisonal: ${EINSAETZE.filter((e) => e.saison).length}, heute saisonal aktiv: ${aktiv.filter((e) => e.saison && saisonAktiv(e.saison)).length}`)
const stufen = {}
for (const e of aktiv) { const k = e.stichwort[0] === 'R' ? `RW ${e.abRW}` : `FW ${e.abFW}`; stufen[k] = (stufen[k] || 0) + 1 }
console.log('Freischaltung (Zahl der Einsätze je Stufe):', Object.entries(stufen).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([k, n]) => `${k}: ${n}`).join(', '))
for (const h of hinweise) console.log('Hinweis:', h)
for (const f of fehler) console.log('FEHLER:', f)
console.log(fehler.length ? `${fehler.length} Fehler` : 'Keine Fehler')
process.exit(fehler.length ? 1 : 0)

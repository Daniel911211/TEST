// Lagemeldungen der Einsatzleitung, zusammengesetzt nach dem Schema „Was sehe ich – Was mache ich – Was brauche ich“
// (Ortsangabe entfällt, der Absender steht im Sprechwunsch). Drei Arten:
//   erste Lagemeldung nach dem Eintreffen, Folgemeldung bei Änderung der Lage, Abschlussmeldung am Ende.
// Texte kommen aus den Szenario-Bausteinen (szenarien.js); fremde Kräfte werden nur genannt, wenn sie am Einsatz sind.
import { ROLES } from './stichworte.js'

const rnd = (a, b) => a + Math.random() * (b - a)
export const needText = (n) => Object.entries(n).map(([k, c]) => `${c}× ${ROLES[k].short}`).join(', ')
const join = (parts) => parts.filter(Boolean).map((p) => p.trim()).filter(Boolean).join(' ')

// Beim Erzeugen eines Einsatzes: Anforderungswahrscheinlichkeiten des Szenarios würfeln.
// Ergebnis { ROLLE: Begründung } nur für Rollen, die der Spieler überhaupt besetzen kann (sonst bliebe der Einsatz hängen).
export function rollAnforderung(szenario, canStaff) {
  const out = {}
  for (const [role, [p, grund]] of Object.entries(szenario?.anforderung || {})) {
    if (ROLES[role] && Math.random() < p && canStaff(role)) out[role] = grund
  }
  if (szenario?.verletzte) {
    const [a, b] = szenario.verletzte
    out.__verletzte = Math.round(rnd(a, b))
  }
  return out
}

// Teil „Was sehe ich“: Schadensbild plus Zahl der Verletzten (Zahlen statt „mehrere“)
function sehe(inc) {
  const n = inc.anford?.__verletzte
  return join([inc.szenario?.sehe || `${inc.type.bild}.`, n ? `Verletzte: etwa ${n}${n >= 10 ? ', davon mehrere schwer' : ''}.` : ''])
}

// Teil „Was mache ich“: eigene Maßnahmen plus Sätze zu Kräften, die am Einsatz sind (vor Ort oder auf Anfahrt)
function mache(inc, assigned) {
  const parts = [inc.szenario?.mache]
  for (const [role, satz] of Object.entries(inc.szenario?.kraefte || {})) {
    const types = ROLES[role]?.types || []
    const here = assigned.filter((v) => types.includes(v.type))
    if (!here.length) continue
    parts.push(here.some((v) => v.status === 4) ? satz : `${ROLES[role].name} auf Anfahrt.`)
  }
  return join(parts)
}

// Teil „Was brauche ich“: Nachforderung mit Begründung, nicht alarmierte Kräfte, oder „Kräfte ausreichend“
function brauche(inc, assigned, missing, added) {
  const parts = []
  if (added && Object.keys(added).length) {
    const gruende = Object.keys(added).map((r) => inc.anford?.[r]).filter(Boolean)
    parts.push(`Erbitte ${needText(added)}${gruende.length ? ': ' + gruende.join(', ') : ''}.`)
  }
  const rest = Object.fromEntries(Object.entries(missing).filter(([r]) => !added?.[r]))
  // Fahrzeuge, die laut AAO zum Stichwort gehören, aber noch nicht alarmiert sind → Nachforderung des Einsatzleiters
  if (Object.keys(rest).length) parts.push(`Nachforderung: ${needText(rest)} zur Einsatzstelle!`)
  // Noch Fahrzeuge auf Anfahrt: Einsatzleiter fragt allgemein nach (er sieht sie noch nicht)
  const frage = assigned.some((v) => v.status === 3) ? 'Frage: Weitere Kräfte auf Anfahrt?' : ''
  // Solange Fahrzeuge noch anfahren, reichen die Kräfte vor Ort nicht – dann keine „Kräfte ausreichend“-Meldung
  if (!parts.length) parts.push(frage ? frage : inc.szenario?.stabil ? 'Meldebild bestätigt, Kräfte ausreichend.' : 'Kräfte ausreichend, keine Nachforderung.')
  else if (frage) parts.push(frage)
  return join(parts)
}

// Erste Lagemeldung. missing = noch nicht alarmierte Rollen (nach Anwendung der Anforderung), added = jetzt nachgeforderte Rollen,
// aenderung = optionaler Entwicklungsschritt (Nachforderung/Hochstufung aus der Spiellogik)
export function ersteLagemeldung(inc, assigned, missing, added, aenderung) {
  return join([`Lagemeldung – ${sehe(inc)}`, mache(inc, assigned), brauche(inc, assigned, missing, added), aenderung ? `Lage ändert sich: ${aenderung}` : ''])
}

// Folgemeldung: Lageänderung (Text aus der Spiellogik: Grund, Hochstufung, Nachforderung)
export const folgemeldung = (text) => `Folgemeldung – ${text}`

// Nachforderung ohne Lagemeldung (wenn die Einsatzleitung von selbst keine Lage meldet)
export const nachforderungsmeldung = (inc, added) => {
  const gruende = Object.keys(added).map((r) => inc.anford?.[r]).filter(Boolean)
  return `Nachforderung – Erbitte ${needText(added)}${gruende.length ? ': ' + gruende.join(', ') : ''}.`
}

// Abschlussmeldung: je Stichwortgruppe ein eigener Abschluss, Szenario kann ihn überschreiben
const ABSCHLUSS = [
  [/^(FBMA|FRWM)/, 'Keine Feststellung, Anlage zurückgestellt, Objekt an den Betreiber übergeben.'],
  [/^FWALD/, 'Feuer aus, Fläche abgelöscht, Nachkontrolle in einer Stunde vereinbart.'],
  [/^FGAS|^HGAS/, 'Austritt gestoppt, Messwerte unauffällig, Bereich freigegeben.'],
  [/^HUNWETTER/, 'Gefahrenstelle beseitigt, Straße freigegeben.'],
  [/^HKLEMM|^HZUG/, 'Person befreit und an den Rettungsdienst übergeben, Unfallstelle an die Polizei übergeben.'],
  [/^HGEFAHR|^HRADIO/, 'Stoff aufgenommen, Messwerte unauffällig, Einsatzstelle an die Behörde übergeben.'],
  [/^F/, 'Feuer aus, Brandstelle kontrolliert und an den Eigentümer übergeben.'],
  [/^H/, 'Technische Hilfe abgeschlossen, Einsatzstelle gesichert und übergeben.'],
]
export function abschlussmeldung(inc, vehicles) {
  const text = inc.szenario?.abschluss || (inc.szenario?.stabil ? 'Keine weiteren Maßnahmen erforderlich, Einsatz beendet.' : ABSCHLUSS.find(([re]) => re.test(inc.type.id))?.[1] || 'Einsatz beendet.')
  return `Abschlussmeldung – ${text} ${vehicles} Fahrzeug${vehicles === 1 ? '' : 'e'} frei, Kräfte rücken ein.`
}

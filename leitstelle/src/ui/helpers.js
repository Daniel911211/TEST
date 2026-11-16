// Kleine Helfer nur für die Oberfläche (keine Spiellogik)
import { VEHICLE_TYPES, STATION_TYPES } from '../game.js'

// Fahrzeuggruppen für Filterknöpfe
export const VEHICLE_GROUPS = [
  ['alle', 'Alle'],
  ['loesch', 'Löschfahrzeuge'],
  ['sonder', 'Sonderfahrzeuge'],
  ['rd', 'Rettungsdienst'],
]
export const groupOf = (type) => {
  const d = VEHICLE_TYPES[type]
  if (d.kind === 'RW') return 'rd'
  return d.water > 0 ? 'loesch' : 'sonder'
}
export const groupName = (key) => VEHICLE_GROUPS.find(([k]) => k === key)?.[1] || key

export const stationOf = (g, v) => g.stations.find((s) => s.id === v.stationId)
export const stationTypeName = (s) => STATION_TYPES[s.kind].name

// Fahrzeuge einer Wache, in fester Reihenfolge (nach Typ, dann Name)
export const vehiclesOf = (g, stationId) =>
  g.vehicles.filter((v) => v.stationId === stationId).sort((a, b) => a.type.localeCompare(b.type) || a.callsign.localeCompare(b.callsign))

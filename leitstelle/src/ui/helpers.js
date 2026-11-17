// Kleine Helfer nur für die Oberfläche (keine Spiellogik)
import { VEHICLE_TYPES, STATION_TYPES } from '../game.js'

// Fahrzeuggruppen für Filterknöpfe
export const VEHICLE_GROUPS = [
  ['fw', 'Feuerwehr'],
  ['rd', 'Rettungsdienst'],
]
export const groupOf = (type) => (['RW', 'LR'].includes(VEHICLE_TYPES[type].kind) ? 'rd' : 'fw')
export const groupName = (key) => VEHICLE_GROUPS.find(([k]) => k === key)?.[1] || key

export const stationOf = (g, v) => g.stations.find((s) => s.id === v.stationId)
// Kurzname ohne Wachenname, z. B. "HLF 20 1" – für Listen, in denen die Wache ohnehin bekannt ist
export const shortName = (v, station) => (station && v.callsign.startsWith(station.name + ' ') ? v.callsign.slice(station.name.length + 1) : v.callsign)
export const stationTypeName = (s) => STATION_TYPES[s.kind].name

// Fahrzeuge einer Wache, in fester Reihenfolge (nach Typ, dann Name)
export const vehiclesOf = (g, stationId) =>
  g.vehicles.filter((v) => v.stationId === stationId).sort((a, b) => a.type.localeCompare(b.type) || a.callsign.localeCompare(b.callsign))

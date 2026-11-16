// Töne der Oberfläche. Alarmtöne liegen in public/sound/ (Originale außerhalb des Repos im Ordner Feuerwehrsimulation\Sound).
// Welcher Ton beim Alarmieren läuft, wählt der Spieler in der Alarmierungsmaske (Einsatz-Overlay); Vorgabe nach Einsatzart.
// Ein/aus über den Schalter in der Kopfzeile, Einstellung bleibt im Browser (localStorage).
const KEY = 'leitstelle-sound'

// Neue Töne: Datei nach public/sound/ legen und hier eintragen (id, Anzeigename, Dateiname).
export const ALARM_SOUNDS = [
  { id: 'fw', name: 'Feuerwehr (Sirene, 14 s)', file: 'alarm-fw.mp3' },
  { id: 'rd', name: 'Rettungsdienst (Melder, 4 s)', file: 'alarm-rd.mp3' },
  { id: 'none', name: 'Kein Ton', file: null },
]
export const SOUND_BY_ID = Object.fromEntries(ALARM_SOUNDS.map((s) => [s.id, s]))

// Vorgabe je Einsatzart: R-Stichworte (Rettungsdienst, Krankentransport) → Melder, sonst Sirene
export const defaultAlarm = (typeId) => (typeId?.[0] === 'R' ? 'rd' : 'fw')

export const soundOn = () => { try { return localStorage.getItem(KEY) !== 'aus' } catch { return true } }
export const setSoundOn = (on) => { try { localStorage.setItem(KEY, on ? 'an' : 'aus') } catch { /* ignore */ } }

const audio = {}
let current = null
// id aus ALARM_SOUNDS; force = auch bei ausgeschaltetem Ton spielen (Anhören in der Maske).
// Ein laufender Ton wird abgebrochen, damit sich die Töne nicht überlagern.
export function playAlarm(id = 'fw', force = false) {
  const s = SOUND_BY_ID[id]
  if (!s?.file || (!force && !soundOn())) return
  if (!audio[id]) { audio[id] = new Audio(`sound/${s.file}`); audio[id].preload = 'auto' }
  stopAlarm()
  current = audio[id]
  current.currentTime = 0
  current.play().catch(() => { /* Browser verlangt erst eine Nutzeraktion */ })
}
export function stopAlarm() { if (current) { current.pause(); current.currentTime = 0 } }
export const alarmPlaying = () => !!current && !current.paused

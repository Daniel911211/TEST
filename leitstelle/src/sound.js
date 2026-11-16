// Töne der Oberfläche. Alarmtöne = eigene Dateien in public/, abgespielt beim Alarmieren von Fahrzeugen:
//   fw: alarm.mp3    (Feuerwehr, 14 s)
//   rd: alarm-rd.mp3 (Rettungsdienst, 4 s)
// Ein/aus über den Schalter in der Kopfzeile, Einstellung bleibt im Browser (localStorage).
const KEY = 'leitstelle-sound'
const FILES = { fw: 'alarm.mp3', rd: 'alarm-rd.mp3' }

export const soundOn = () => { try { return localStorage.getItem(KEY) !== 'aus' } catch { return true } }
export const setSoundOn = (on) => { try { localStorage.setItem(KEY, on ? 'an' : 'aus') } catch { /* ignore */ } }

const audio = {}
let current = null
// which: 'fw' | 'rd' – ein laufender Ton wird abgebrochen, damit sich die Töne nicht überlagern
export function playAlarm(which = 'fw') {
  if (!soundOn()) return
  const key = FILES[which] ? which : 'fw'
  if (!audio[key]) { audio[key] = new Audio(FILES[key]); audio[key].preload = 'auto' }
  stopAlarm()
  current = audio[key]
  current.currentTime = 0
  current.play().catch(() => { /* Browser verlangt erst eine Nutzeraktion */ })
}
export function stopAlarm() { if (current) { current.pause(); current.currentTime = 0 } }

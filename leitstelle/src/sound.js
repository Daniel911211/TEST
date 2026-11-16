// Töne der Oberfläche. Alarmton = eigene Datei public/alarm.mp3 (14 s), abgespielt beim Alarmieren von Fahrzeugen.
// Ein/aus über den Schalter in der Kopfzeile, Einstellung bleibt im Browser (localStorage).
const KEY = 'leitstelle-sound'

export const soundOn = () => { try { return localStorage.getItem(KEY) !== 'aus' } catch { return true } }
export const setSoundOn = (on) => { try { localStorage.setItem(KEY, on ? 'an' : 'aus') } catch { /* ignore */ } }

let alarm = null
export function playAlarm() {
  if (!soundOn()) return
  if (!alarm) { alarm = new Audio('alarm.mp3'); alarm.preload = 'auto' }
  alarm.currentTime = 0
  alarm.play().catch(() => { /* Browser verlangt erst eine Nutzeraktion */ })
}
export function stopAlarm() { if (alarm) { alarm.pause(); alarm.currentTime = 0 } }

// Töne der Oberfläche. Alarmtöne liegen in public/sound/ (Originale außerhalb des Repos im Ordner Feuerwehrsimulation\Sound).
// Welcher Ton beim Alarmieren läuft, wählt der Spieler in der Alarmierungsmaske (Einsatz-Overlay); Vorgabe nach Einsatzart.
// Ein/aus über den Schalter in der Kopfzeile, Einstellung bleibt im Browser (localStorage).
// Nach dem Alarmton folgt eine Durchsage über die Sprachausgabe des Browsers (Web Speech API, deutsche Stimme).
const KEY = 'leitstelle-sound'

// Neue Töne: Datei nach public/sound/ legen und hier eintragen (id, Anzeigename, Dateiname).
export const ALARM_SOUNDS = [
  { id: 'dringend', name: 'Dringend', file: 'melder-dringend.mp3', hint: 'Meldertöne dringend (3 s)' },
  { id: 'normal', name: 'Normal', file: 'melder-normal.mp3', hint: 'Meldertöne nicht dringend (4 s)' },
  { id: 'none', name: 'Stumm', file: null, hint: 'Kein Ton, keine Durchsage' },
]
export const SOUND_BY_ID = Object.fromEntries(ALARM_SOUNDS.map((s) => [s.id, s]))

// Vorgabe je Einsatzart: Stichwort ohne Sondersignal (R0, Krankentransport) → Normal, sonst Dringend
export const defaultAlarm = (type) => (type?.ohneSS ? 'normal' : 'dringend')

export const soundOn = () => { try { return localStorage.getItem(KEY) !== 'aus' } catch { return true } }
export const setSoundOn = (on) => { try { localStorage.setItem(KEY, on ? 'an' : 'aus') } catch { /* ignore */ } }

const audio = {}
let current = null
// id aus ALARM_SOUNDS; force = auch bei ausgeschaltetem Ton spielen (Anhören in der Maske).
// Ein laufender Ton wird abgebrochen, damit sich die Töne nicht überlagern.
// text = Durchsage nach dem Ton (durchsageText); bei Stumm gibt es weder Ton noch Durchsage.
export function playAlarm(id = 'dringend', force = false, text = null) {
  const s = SOUND_BY_ID[id]
  if (!s?.file || (!force && !soundOn())) return
  if (!audio[id]) { audio[id] = new Audio(`sound/${s.file}`); audio[id].preload = 'auto' }
  stopAlarm()
  current = audio[id]
  current.currentTime = 0
  current.onended = () => { if (text) durchsage(text, force) }
  current.play().catch(() => { /* Browser verlangt erst eine Nutzeraktion */ })
}
export function stopAlarm() {
  if (current) { current.onended = null; current.pause(); current.currentTime = 0 }
  if (sprache) sprache.cancel()
}
export const alarmPlaying = () => !!current && !current.paused

// --- Durchsage (Sprachausgabe) ---
const sprache = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
if (sprache) sprache.getVoices() // Stimmenliste früh anfordern (Chrome liefert sie erst asynchron)
// Wehrname für die Durchsage: „Feuerwehr Neuhof Giesel“ / „Neuhof-Giesel“ → „Giesel“ (nur der Ortsteil), „Feuerwehr Neuhof“ → „Neuhof“.
// Nur bei genau zwei Namensteilen; Zusätze wie Mitte/Nord bleiben beim Ort („Hilders Mitte“).
function ortsname(name) {
  const rest = name.replace(/^(Freiwillige )?Feuerwehr[\s-]*/i, '').trim()
  const teile = rest.split(/[\s-]+/)
  return teile.length === 2 && !/^(Mitte|Nord|Ost|Süd|West|Zentrum)$/i.test(teile[1]) ? teile[1] : rest
}
// „Alarm für die Feuerwehr Neuhof.“ – genannt werden die alarmierten Wachen (Namen = Stationsnamen, ohne Vorsilbe „Feuerwehr“);
// bei mehreren Wachen werden alle aufgezählt („Neuhof, Giesel und Dorfborn“). Reine Rettungsdienst-Alarmierung: „für den Rettungsdienst …“.
export function durchsageText(stationen = []) {
  const fw = [...new Set(stationen.filter((s) => s.kind === 'FW').map((s) => ortsname(s.name)))]
  const rd = [...new Set(stationen.filter((s) => s.kind !== 'FW' && s.kind !== 'LR').map((s) => s.name))]
  const nenne = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} und ${l[l.length - 1]}` : l[0])
  const wer = fw.length ? `die Feuerwehr ${nenne(fw)}` : rd.length ? `den Rettungsdienst ${nenne(rd)}` : 'die Feuerwehr'
  return `Alarm für ${wer}.`
}
// Deutsche Stimme: bevorzugt eine natürliche (Online-/Google-/Microsoft-Stimme), sonst die erste deutsche
function stimme() {
  const vs = sprache.getVoices().filter((v) => /^de([-_]|$)/i.test(v.lang))
  return vs.find((v) => /natural|online|google|neural/i.test(v.name)) || vs[0] || null
}
export function durchsage(text, force = false) {
  if (!sprache || !text || (!force && !soundOn())) return
  sprache.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'de-DE'; u.rate = 0.95
  const v = stimme(); if (v) u.voice = v
  sprache.speak(u)
}

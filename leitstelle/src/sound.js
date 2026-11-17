// Töne der Oberfläche. Alarmtöne liegen in public/sound/ (Originale außerhalb des Repos im Ordner Feuerwehrsimulation\Sound).
// Welcher Ton beim Alarmieren läuft, wählt der Spieler in der Alarmierungsmaske (Einsatz-Overlay); Vorgabe nach Einsatzart.
// Ein/aus über den Schalter in der Kopfzeile, Einstellung bleibt im Browser (localStorage).
// Nach dem Alarmton folgt eine Durchsage über die Sprachausgabe des Browsers (Web Speech API, deutsche Stimme).
import { typeCode } from './szenarien.js'
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
// Stichwort-Kürzel so, wie es die Leitstelle spricht: F3Y → „Feuer 3 Ypsilon“, H KLEMM 2 Y → „Hilfeleistung Klemm 2 Ypsilon“
const WORTE = {
  F: 'Feuer', H: 'Hilfeleistung', R: 'Rettungsdienst', Y: 'Ypsilon',
  BMA: 'Brandmeldeanlage', RWM: 'Rauchwarnmelder', EINST: 'Einsturz', ABST: 'Absturz', ELEK: 'Elektrounfall',
  WASS: 'Wasser', MANV: 'Massenanfall von Verletzten', LEBEL: 'lebensbedrohlich', KTP: 'Krankentransport', LKW: 'LKW',
}
export const spokenCode = (code) => (code.match(/[A-Za-zÄÖÜäöü]+|\d+/g) || [])
  .map((t) => WORTE[t] || (t.length > 1 ? t[0] + t.slice(1).toLowerCase() : t)).join(' ')
// „Einsatz für die Feuerwehr: Feuer 3, Bauentwicklung im Museum. Einsatzbereitschaft herstellen.“ (Rettungsdienst-Stichworte R/KTP: „für den Rettungsdienst“)
export const durchsageText = (inc) => {
  const code = typeCode(inc.type)
  const wer = /^(F|H)/.test(code) ? 'die Feuerwehr' : 'den Rettungsdienst'
  return `Einsatz für ${wer}: ${spokenCode(code)}${inc.szenario ? ', ' + inc.szenario.name : ''}. Einsatzbereitschaft herstellen.`
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

// Töne werden direkt im Browser erzeugt (Web Audio), es gibt keine Audiodateien.
let ctx = null
let master = null
let volume = 0.6
let muted = false

try {
  const v = JSON.parse(localStorage.getItem('rennleitung-sound') || 'null')
  if (v) { volume = v.volume; muted = v.muted }
} catch { /* ohne Speicher gelten die Standardwerte */ }

const save = () => {
  try { localStorage.setItem('rennleitung-sound', JSON.stringify({ volume, muted })) } catch { /* egal */ }
}

// Browser erlauben Ton erst nach einer Eingabe: beim ersten Klick oder Tastendruck starten
function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ctx = new AC()
    master = ctx.createGain()
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  master.gain.value = muted ? 0 : volume
  return true
}
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', ensure)
  window.addEventListener('keydown', ensure)
}

function tone(freq, start, dur, gain = 0.2, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  const t = ctx.currentTime + start
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.008)
  g.gain.setValueAtTime(gain, t + dur - 0.02)
  g.gain.linearRampToValueAtTime(0, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function noise(start, dur, gain = 0.12) {
  const n = Math.floor(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1800
  g.gain.value = gain
  src.buffer = buf
  src.connect(f).connect(g).connect(master)
  src.start(ctx.currentTime + start)
}

const ready = () => ctx && ctx.state === 'running' && !muted

export const sound = {
  // Funkspruch eines Fahrers: Knacken und Doppelton
  radio() { if (!ready()) return; noise(0, 0.07); tone(1250, 0.06, 0.07, 0.14, 'square'); tone(1600, 0.15, 0.06, 0.1, 'square') },
  // Antwort vom Kommandostand: leiser Einzelton
  box() { if (!ready()) return; noise(0, 0.04, 0.06); tone(900, 0.04, 0.06, 0.07, 'square') },
  // Race-Control-Meldung, je nach Wichtigkeit
  message(level) {
    if (!ready()) return
    if (level === 'bad') { tone(392, 0, 0.14, 0.2, 'triangle'); tone(311, 0.16, 0.22, 0.2, 'triangle') }
    else if (level === 'warn') { tone(660, 0, 0.09, 0.16); tone(880, 0.1, 0.12, 0.16) }
    else if (level === 'flag') { tone(523, 0, 0.1, 0.16); tone(659, 0.1, 0.1, 0.16); tone(784, 0.2, 0.2, 0.16) }
    else if (level === 'ok') { tone(784, 0, 0.08, 0.12); tone(1047, 0.09, 0.14, 0.12) }
    else tone(880, 0, 0.05, 0.08)
  },
  // Neuer Vorfall
  incident(hazard) {
    if (!ready()) return
    const f = hazard ? 1040 : 820
    for (let i = 0; i < (hazard ? 3 : 2); i++) tone(f, i * 0.13, 0.08, 0.2, 'square')
  },
  get volume() { return volume },
  get muted() { return muted },
  setVolume(v) { volume = v; muted = false; save(); if (ctx) master.gain.value = volume },
  setMuted(m) { muted = m; save(); if (ctx) master.gain.value = muted ? 0 : volume },
}

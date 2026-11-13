// Alle Sounds werden per Web Audio API synthetisiert, es gibt keine Audiodateien.
let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(ac, seconds) {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function unlockAudio() {
  getCtx();
}

// Schuss: kurzer Rausch-Knall mit tiefem Bass-Schlag.
export function playShot() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const noise = ac.createBufferSource();
  noise.buffer = noiseBuffer(ac, 0.3);
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.25);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.8, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(filter).connect(gain).connect(ac.destination);
  noise.start(t);
  noise.stop(t + 0.3);

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.6, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(g2).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}

// Leerer Abzug: trockenes Klicken.
export function playEmpty() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(900, t);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

// Nachladen: zwei metallische Klicks nacheinander.
export function playReload() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  [0, 0.18].forEach((offset, i) => {
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(i === 0 ? 1200 : 700, t + offset);
    osc.frequency.exponentialRampToValueAtTime(300, t + offset + 0.08);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.3, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.1);
    osc.connect(gain).connect(ac.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.1);
  });
}

// Treffer: kurzer, fallender Hühnerschrei.
export function playHit() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.linearRampToValueAtTime(1100, t + 0.06);
  osc.frequency.exponentialRampToValueAtTime(250, t + 0.4);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, t);
  filter.Q.value = 3;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.4, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.45);
}

// Gelegentliches Gackern eines vorbeifliegenden Huhns.
export function playCluck() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  for (let i = 0; i < 3; i++) {
    const o = ac.createOscillator();
    o.type = 'square';
    const start = t + i * 0.12;
    o.frequency.setValueAtTime(500 + i * 80, start);
    o.frequency.exponentialRampToValueAtTime(350, start + 0.08);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.08, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
    o.connect(g).connect(ac.destination);
    o.start(start);
    o.stop(start + 0.09);
  }
}

// Endsignal nach Ablauf der Zeit.
export function playGameOver() {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  [440, 330, 220].forEach((freq, i) => {
    const o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ac.createGain();
    const start = t + i * 0.25;
    g.gain.setValueAtTime(0.3, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    o.connect(g).connect(ac.destination);
    o.start(start);
    o.stop(start + 0.4);
  });
}

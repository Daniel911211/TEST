import { WIDTH, HEIGHT } from './draw.js';
import * as audio from './audio.js';

export const GAME_SECONDS = 90;
export const MAGAZINE = 8;
export const RELOAD_SECONDS = 1.1;

// Drei Entfernungsebenen: weit hinten klein und wertvoll, vorne groß und billig.
const LAYERS = [
  { scale: 0.45, points: 50, speed: [60, 100], yRange: [120, 220], spawnWeight: 3 },
  { scale: 0.75, points: 20, speed: [90, 150], yRange: [170, 300], spawnWeight: 4 },
  { scale: 1.15, points: 10, speed: [140, 220], yRange: [230, 380], spawnWeight: 3 },
];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pickLayer() {
  const total = LAYERS.reduce((s, l) => s + l.spawnWeight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < LAYERS.length; i++) {
    r -= LAYERS[i].spawnWeight;
    if (r <= 0) return i;
  }
  return LAYERS.length - 1;
}

export function createGame() {
  return {
    timeLeft: GAME_SECONDS,
    score: 0,
    ammo: MAGAZINE,
    reloading: 0,
    shots: 0,
    hits: 0,
    chickens: [],
    texts: [],
    spawnTimer: 0.5,
    flash: 0,
    recoil: 0,
    over: false,
    elapsed: 0,
  };
}

function spawnChicken(game) {
  const layerIndex = pickLayer();
  const layer = LAYERS[layerIndex];
  const dir = Math.random() < 0.5 ? 1 : -1;
  const speed = rand(layer.speed[0], layer.speed[1]);
  const x = dir === 1 ? -60 * layer.scale : WIDTH + 60 * layer.scale;
  game.chickens.push({
    x,
    y: rand(layer.yRange[0], layer.yRange[1]),
    baseY: 0,
    dir,
    speed,
    scale: layer.scale,
    points: layer.points,
    layer: layerIndex,
    flap: Math.random() * Math.PI * 2,
    wobble: Math.random() * Math.PI * 2,
    dead: false,
    vy: 0,
    rot: 0,
    clucked: false,
  });
  game.chickens.sort((a, b) => a.layer - b.layer);
}

// Simuliert einen Zeitschritt. dt in Sekunden.
export function update(game, dt) {
  if (game.over) return;
  game.elapsed += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.over = true;
    audio.playGameOver();
    return;
  }

  if (game.reloading > 0) {
    game.reloading -= dt;
    if (game.reloading <= 0) {
      game.reloading = 0;
      game.ammo = MAGAZINE;
    }
  }

  game.flash = Math.max(0, game.flash - dt * 6);
  game.recoil = Math.max(0, game.recoil - dt * 5);

  // Mit fortschreitender Zeit kommen die Hühner etwas schneller.
  const difficulty = 1 + (1 - game.timeLeft / GAME_SECONDS) * 0.6;
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    spawnChicken(game);
    game.spawnTimer = rand(0.4, 1.1) / difficulty;
  }

  for (const c of game.chickens) {
    if (c.dead) {
      c.vy += 900 * dt;
      c.y += c.vy * dt;
      c.x += c.dir * c.speed * 0.3 * dt;
      c.rot += dt * 6;
    } else {
      c.x += c.dir * c.speed * difficulty * dt;
      c.wobble += dt * 2.5;
      c.y += Math.sin(c.wobble) * 0.6;
      c.flap += dt * 14;
      if (!c.clucked && Math.random() < dt * 0.15) {
        c.clucked = true;
        audio.playCluck();
      }
    }
  }

  game.chickens = game.chickens.filter(
    (c) => c.x > -150 && c.x < WIDTH + 150 && c.y < HEIGHT + 100,
  );

  for (const t of game.texts) {
    t.life -= dt;
    t.y -= 40 * dt;
  }
  game.texts = game.texts.filter((t) => t.life > 0);
}

// Trefferprüfung: Ellipse um den Körper plus Kopfbereich.
function hitTest(c, x, y) {
  const dx = (x - c.x) / c.scale;
  const dy = (y - c.y) / c.scale;
  const bodyHit = (dx * dx) / (26 * 26) + (dy * dy) / (20 * 20) <= 1;
  const hx = dx * c.dir - 24;
  const hy = dy + 22;
  const headHit = hx * hx + hy * hy <= 15 * 15;
  return bodyHit || headHit;
}

export function shoot(game, x, y) {
  if (game.over) return;
  if (game.reloading > 0) return;
  if (game.ammo <= 0) {
    audio.playEmpty();
    return;
  }
  game.ammo -= 1;
  game.shots += 1;
  game.flash = 1;
  game.recoil = 1;
  audio.playShot();

  // Vorderste Ebene zuerst prüfen (höchster Layer-Index = nächstes Huhn).
  for (let i = game.chickens.length - 1; i >= 0; i--) {
    const c = game.chickens[i];
    if (c.dead) continue;
    if (hitTest(c, x, y)) {
      c.dead = true;
      c.vy = -120;
      game.score += c.points;
      game.hits += 1;
      game.texts.push({ text: `+${c.points}`, x: c.x, y: c.y - 30 * c.scale, life: 1 });
      audio.playHit();
      break;
    }
  }

  if (game.ammo === 0) {
    startReload(game);
  }
}

export function startReload(game) {
  if (game.over || game.reloading > 0 || game.ammo === MAGAZINE) return;
  game.reloading = RELOAD_SECONDS;
  audio.playReload();
}

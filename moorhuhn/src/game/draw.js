// Alle Grafiken werden direkt auf dem Canvas gezeichnet.
export const WIDTH = 960;
export const HEIGHT = 540;

// Statische Landschaft (Himmel, Hügel, Moor, Bäume, Gras).
export function drawBackground(ctx, time) {
  // Himmel
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT * 0.7);
  sky.addColorStop(0, '#6fb1e8');
  sky.addColorStop(1, '#d6ecfa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Sonne
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(820, 80, 42, 0, Math.PI * 2);
  ctx.fill();

  // Wolken (langsam ziehend)
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const cloudOffset = (time * 8) % (WIDTH + 300);
  drawCloud(ctx, ((cloudOffset + 100) % (WIDTH + 300)) - 150, 90, 1.2);
  drawCloud(ctx, ((cloudOffset + 500) % (WIDTH + 300)) - 150, 150, 0.9);
  drawCloud(ctx, ((cloudOffset + 850) % (WIDTH + 300)) - 150, 60, 0.7);

  // Ferne Hügel
  ctx.fillStyle = '#8fb58f';
  ctx.beginPath();
  ctx.moveTo(0, 330);
  ctx.quadraticCurveTo(160, 240, 330, 320);
  ctx.quadraticCurveTo(480, 250, 640, 310);
  ctx.quadraticCurveTo(800, 230, WIDTH, 320);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Nähere Hügel
  ctx.fillStyle = '#5f9a5a';
  ctx.beginPath();
  ctx.moveTo(0, 380);
  ctx.quadraticCurveTo(200, 320, 400, 390);
  ctx.quadraticCurveTo(600, 330, 760, 385);
  ctx.quadraticCurveTo(880, 350, WIDTH, 390);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Bäume am Horizont
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 110 + (i % 2) * 30;
    drawTree(ctx, x, 392 - (i % 3) * 6, 0.8 + (i % 3) * 0.15);
  }

  // Moorfläche
  const moor = ctx.createLinearGradient(0, 420, 0, HEIGHT);
  moor.addColorStop(0, '#4b7d3f');
  moor.addColorStop(1, '#2f4f2a');
  ctx.fillStyle = moor;
  ctx.fillRect(0, 420, WIDTH, HEIGHT - 420);

  // Tümpel
  ctx.fillStyle = '#4b6f8a';
  ctx.beginPath();
  ctx.ellipse(300, 480, 130, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(280, 476, 60, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Schilf und Gras
  ctx.strokeStyle = '#2d5a26';
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % WIDTH;
    const h = 20 + (i % 5) * 7;
    const sway = Math.sin(time * 2 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(x, HEIGHT - 10);
    ctx.quadraticCurveTo(x + sway, HEIGHT - 10 - h / 2, x + sway * 2, HEIGHT - 10 - h);
    ctx.stroke();
  }
}

function drawCloud(ctx, x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 25 * s, y - 12 * s, 28 * s, 0, Math.PI * 2);
  ctx.arc(x + 55 * s, y, 24 * s, 0, Math.PI * 2);
  ctx.arc(x + 28 * s, y + 10 * s, 22 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx, x, y, s) {
  ctx.fillStyle = '#5a3b1e';
  ctx.fillRect(x - 3 * s, y - 18 * s, 6 * s, 20 * s);
  ctx.fillStyle = '#2f6b2a';
  ctx.beginPath();
  ctx.moveTo(x, y - 48 * s);
  ctx.lineTo(x + 16 * s, y - 16 * s);
  ctx.lineTo(x - 16 * s, y - 16 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 36 * s);
  ctx.lineTo(x + 20 * s, y - 4 * s);
  ctx.lineTo(x - 20 * s, y - 4 * s);
  ctx.closePath();
  ctx.fill();
}

// Ein Moorhuhn. scale bestimmt die Größe, dir die Flugrichtung (1 = nach rechts).
// flap ist die Flügelphase, dead markiert ein abgeschossenes Huhn.
export function drawChicken(ctx, x, y, scale, dir, flap, dead) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * scale, scale);
  if (dead) {
    ctx.rotate(Math.PI);
  }

  // Hinterer Flügel
  const wingAngle = Math.sin(flap) * 0.9;
  ctx.fillStyle = '#6b4423';
  ctx.save();
  ctx.translate(-4, -6);
  ctx.rotate(-wingAngle - 0.3);
  ctx.beginPath();
  ctx.ellipse(-14, 0, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Körper
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a86f3c';
  ctx.beginPath();
  ctx.ellipse(2, 4, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Schwanzfedern
  ctx.fillStyle = '#5a3516';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.lineTo(-36, -10 + i * 7);
    ctx.lineTo(-20, 4);
    ctx.closePath();
    ctx.fill();
  }

  // Hals und Kopf
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.ellipse(16, -12, 8, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(24, -22, 11, 0, Math.PI * 2);
  ctx.fill();

  // Kamm
  ctx.fillStyle = '#d63a2f';
  ctx.beginPath();
  ctx.arc(20, -32, 4, 0, Math.PI * 2);
  ctx.arc(26, -34, 4, 0, Math.PI * 2);
  ctx.arc(31, -31, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Kehllappen
  ctx.beginPath();
  ctx.ellipse(28, -12, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Schnabel
  ctx.fillStyle = '#f2b531';
  ctx.beginPath();
  ctx.moveTo(33, -24);
  ctx.lineTo(46, -20);
  ctx.lineTo(33, -17);
  ctx.closePath();
  ctx.fill();

  // Auge (groß und etwas dümmlich)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(27, -24, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  if (dead) {
    ctx.moveTo(24, -27); ctx.lineTo(30, -21);
    ctx.moveTo(30, -27); ctx.lineTo(24, -21);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.arc(28, -24, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vorderer Flügel
  ctx.fillStyle = '#a86f3c';
  ctx.save();
  ctx.translate(-2, -4);
  ctx.rotate(wingAngle);
  ctx.beginPath();
  ctx.ellipse(-12, 0, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Beine
  ctx.strokeStyle = '#f2b531';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 14); ctx.lineTo(-6, 24);
  ctx.moveTo(6, 14); ctx.lineTo(4, 24);
  ctx.stroke();

  ctx.restore();
}

// Fadenkreuz an der Mausposition.
export function drawCrosshair(ctx, x, y, recoil) {
  const r = 22 + recoil * 10;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,40,40,0.95)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - r - 10, y); ctx.lineTo(x - r + 8, y);
  ctx.moveTo(x + r - 8, y); ctx.lineTo(x + r + 10, y);
  ctx.moveTo(x, y - r - 10); ctx.lineTo(x, y - r + 8);
  ctx.moveTo(x, y + r - 8); ctx.lineTo(x, y + r + 10);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,40,40,0.95)';
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Schwebende Punktzahl nach einem Treffer.
export function drawFloatingText(ctx, text, x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#222';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#ffe34d';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Weißer Blitz beim Schuss.
export function drawMuzzleFlash(ctx, intensity) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalAlpha = intensity * 0.35;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

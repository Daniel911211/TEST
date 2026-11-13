import { useEffect, useRef, useState, useCallback } from 'react';
import { WIDTH, HEIGHT, drawBackground, drawChicken, drawCrosshair, drawFloatingText, drawMuzzleFlash } from './game/draw.js';
import { createGame, update, shoot, startReload, MAGAZINE, GAME_SECONDS } from './game/engine.js';
import { unlockAudio } from './game/audio.js';

const HIGHSCORE_KEY = 'moorhuhn-highscore';

function loadHighscore() {
  try {
    return Number(localStorage.getItem(HIGHSCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighscore(value) {
  try {
    localStorage.setItem(HIGHSCORE_KEY, String(value));
  } catch {
    // Speicher nicht verfügbar, dann eben nicht.
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGame());
  const mouseRef = useRef({ x: WIDTH / 2, y: HEIGHT / 2, inside: false });
  const [phase, setPhase] = useState('start'); // start | playing | over
  const [hud, setHud] = useState({ score: 0, ammo: MAGAZINE, timeLeft: GAME_SECONDS, reloading: false });
  const [result, setResult] = useState(null);
  const [highscore, setHighscore] = useState(loadHighscore);

  const toCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }, []);

  const startGame = useCallback(() => {
    unlockAudio();
    gameRef.current = createGame();
    setResult(null);
    setPhase('playing');
  }, []);

  // Render- und Update-Schleife
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let hudTick = 0;

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const game = gameRef.current;

      if (phase === 'playing') {
        update(game, dt);
        hudTick += dt;
        if (hudTick > 0.1) {
          hudTick = 0;
          setHud({
            score: game.score,
            ammo: game.ammo,
            timeLeft: game.timeLeft,
            reloading: game.reloading > 0,
          });
        }
        if (game.over) {
          const accuracy = game.shots ? Math.round((game.hits / game.shots) * 100) : 0;
          const best = Math.max(highscore, game.score);
          if (best > highscore) {
            setHighscore(best);
            saveHighscore(best);
          }
          setResult({ score: game.score, hits: game.hits, shots: game.shots, accuracy, isRecord: game.score > highscore && game.score > 0 });
          setPhase('over');
        }
      }

      drawBackground(ctx, game.elapsed);
      for (const c of game.chickens) {
        drawChicken(ctx, c.x, c.y, c.scale, c.dir, c.flap, c.dead);
      }
      for (const t of game.texts) {
        drawFloatingText(ctx, t.text, t.x, t.y, Math.min(1, t.life * 1.5));
      }
      drawMuzzleFlash(ctx, game.flash);
      if (phase === 'playing' && mouseRef.current.inside) {
        drawCrosshair(ctx, mouseRef.current.x, mouseRef.current.y, game.recoil);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, highscore]);

  // Tastatur: R oder Leertaste zum Nachladen
  useEffect(() => {
    const onKey = (e) => {
      if (phase !== 'playing') return;
      if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
        e.preventDefault();
        startReload(gameRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const onPointerMove = (e) => {
    const p = toCanvasCoords(e);
    mouseRef.current = { ...p, inside: true };
  };

  const onPointerLeave = () => {
    mouseRef.current.inside = false;
  };

  const onPointerDown = (e) => {
    if (phase !== 'playing') return;
    e.preventDefault();
    if (e.button === 2) {
      startReload(gameRef.current);
      return;
    }
    const p = toCanvasCoords(e);
    mouseRef.current = { ...p, inside: true };
    shoot(gameRef.current, p.x, p.y);
  };

  const seconds = Math.ceil(hud.timeLeft);
  const timeClass = seconds <= 10 ? 'hud-time warning' : 'hud-time';

  return (
    <div className="app">
      <div className="stage">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className={phase === 'playing' ? 'canvas playing' : 'canvas'}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerDown={onPointerDown}
          onContextMenu={(e) => e.preventDefault()}
        />

        {phase === 'playing' && (
          <div className="hud">
            <div className="hud-box">
              <span className="hud-label">Punkte</span>
              <span className="hud-value">{hud.score}</span>
            </div>
            <div className="hud-box">
              <span className="hud-label">Zeit</span>
              <span className={timeClass}>{seconds}</span>
            </div>
            <div className="hud-box">
              <span className="hud-label">{hud.reloading ? 'Nachladen…' : 'Munition'}</span>
              <span className="ammo">
                {Array.from({ length: MAGAZINE }).map((_, i) => (
                  <span key={i} className={i < hud.ammo && !hud.reloading ? 'shell' : 'shell empty'} />
                ))}
              </span>
            </div>
          </div>
        )}

        {phase === 'start' && (
          <div className="overlay">
            <h1 className="title">Moorhuhn</h1>
            <p className="subtitle">Die Jagd ist eröffnet</p>
            <ul className="rules">
              <li><strong>{GAME_SECONDS} Sekunden</strong> Zeit, so viele Hühner wie möglich treffen.</li>
              <li>Kleine, weit entfernte Hühner bringen <strong>50</strong> Punkte, mittlere <strong>20</strong>, nahe <strong>10</strong>.</li>
              <li><strong>{MAGAZINE} Schuss</strong> im Magazin. Nachladen mit <kbd>R</kbd>, <kbd>Leertaste</kbd> oder Rechtsklick.</li>
            </ul>
            <button className="btn" onClick={startGame}>Spiel starten</button>
            {highscore > 0 && <p className="best">Rekord: {highscore} Punkte</p>}
          </div>
        )}

        {phase === 'over' && result && (
          <div className="overlay">
            <h1 className="title small">Zeit abgelaufen</h1>
            {result.isRecord && <p className="record">Neuer Rekord!</p>}
            <div className="score-big">{result.score}</div>
            <p className="subtitle">Punkte</p>
            <table className="stats">
              <tbody>
                <tr><td>Treffer</td><td>{result.hits}</td></tr>
                <tr><td>Schüsse</td><td>{result.shots}</td></tr>
                <tr><td>Trefferquote</td><td>{result.accuracy} %</td></tr>
                <tr><td>Rekord</td><td>{highscore}</td></tr>
              </tbody>
            </table>
            <button className="btn" onClick={startGame}>Noch einmal</button>
          </div>
        )}
      </div>
    </div>
  );
}

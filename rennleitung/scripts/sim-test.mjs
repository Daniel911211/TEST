import { Race } from '../src/sim/race.js'

for (const key of ['spa', 'monza', 'monaco']) {
  const r = new Race(key, 3)
  r.start()
  let lapTimes = []
  let last = 0
  // einfacher Bot: löst offene Fälle zufällig, setzt Gelb bei stehenden Autos
  for (let i = 0; i < 60 * 20 * 40 && r.state !== 'FINISHED'; i++) {
    r.step(0.05)
    if (i % 40 === 0) {
      for (const inc of r.incidents) {
        if (inc.kind === 'decision') r.decide(inc.id, { culprit: 'a', opt: inc.options ? 'nfa' : 'warn' })
      }
      const stopped = r.cars.some((c) => c.status === 'stopped')
      if (stopped && r.state === 'GREEN') r.callSC()
      if (!stopped && r.state === 'SC' && !r.scEnding) r.scInThisLap()
    }
    for (const c of r.cars) {
      if (!Number.isFinite(c.dist) || !Number.isFinite(c.speed)) throw new Error('NaN ' + c.code)
    }
  }
  const lead = r.standings()[0]
  console.log(key, 'state', r.state, 't=', r.t.toFixed(0), 'turns', r.track.corners.length,
    'finished', r.cars.filter((c) => c.status === 'fin').length, 'safety', r.safety.toFixed(0), 'fair', r.fairness.toFixed(0),
    'msgs', r.messages.length, 'leader', lead.code)
}

import { Race } from '../src/sim/race.js'

for (const key of ['spa', 'monza', 'monaco']) {
  const r = new Race(key, 3)
  r.startFormation()
  for (let i = 0; i < 20 * 600 && r.state === 'FORMATION'; i++) r.step(0.05)
  if (r.state !== 'GRIDREADY') throw new Error('Feld kommt nicht in die Aufstellung: ' + r.state)
  const form = r.t
  for (const c of r.cars) if (Math.abs(c.dist - c.slot - c.gridOver) > 0.01) throw new Error('falscher Startplatz ' + c.code)
  if (r.cars.some((c) => c.stalled)) r.abortStart()
  for (let i = 0; i < 20 * 600 && r.state === 'FORMATION'; i++) r.step(0.05)
  r.cars.forEach((c) => (c.stalled = false))
  r.startLights()
  for (let i = 0; i < 20 * 20 && r.state === 'LIGHTS'; i++) r.step(0.05)
  if (r.state !== 'GREEN') throw new Error('kein Start: ' + r.state)
  console.log(key, 'Einführungsrunde', form.toFixed(0), 's, Fälle am Start:', r.incidents.map((i) => i.type).join(',') || '-')
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
  const fin = r.cars.filter((c) => c.status === 'fin')
  console.log('   Stopps:', fin.map((c) => c.stops).join(''), 'Mischungen:', fin.map((c) => c.usedDry.join('') + (c.usedWet ? 'w' : '')).join(' '), r.laps <= 3 ? '(Kurzrennen: keine Pflichtstopps)' : 'Regel verletzt: ' + fin.filter((c) => c.usedDry.length < 2 && !c.usedWet).length)
  console.log(key, 'state', r.state, 't=', r.t.toFixed(0), 'turns', r.track.corners.length,
    'finished', r.cars.filter((c) => c.status === 'fin').length, 'safety', r.safety.toFixed(0), 'fair', r.fairness.toFixed(0),
    'msgs', r.messages.length, 'leader', lead.code)
}

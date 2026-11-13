import { buildTrack } from './tracks.js'
import { DRIVERS } from './drivers.js'
import { LINES, REPLIES } from './radio.js'

const rnd = (a, b) => a + Math.random() * (b - a)
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))

export const OPTIONS = {
  nfa: { key: 'nfa', label: 'Keine Strafe', sev: 0, tone: 'ok' },
  warn: { key: 'warn', label: 'Verwarnung', sev: 1 },
  lap: { key: 'lap', label: 'Rundenzeit streichen', sev: 1 },
  t5: { key: 't5', label: '5 Sek.', sev: 2 },
  lap5: { key: 'lap5', label: 'Streichen + 5 Sek.', sev: 2 },
  t10: { key: 't10', label: '10 Sek.', sev: 3 },
  dt: { key: 'dt', label: 'Durchfahrt', sev: 4, tone: 'bad' },
  sg: { key: 'sg', label: 'Stop & Go 10 s', sev: 5, tone: 'bad' },
  black: { key: 'black', label: 'Disqualifikation', sev: 7, tone: 'bad' },
}
export const OPTION_LIST = Object.values(OPTIONS)

export const RULES = {
  jumpStart:
    'Frühstart: Bewegt sich ein Auto, bevor die Lichter ausgehen, und löst den Sensor aus, gibt es 5 Sekunden. Wer klar vor dem Signal losfährt, bekommt eine Durchfahrtsstrafe. Ein Zucken ohne Sensorauslösung bleibt straffrei.',
  gridPosition:
    'Startposition: Die Aufstandsfläche der Vorderreifen muss hinter der weißen Linie der Startbox stehen. Steht ein Reifen darüber, gibt es 5 Sekunden. Berührt der Reifen die Linie nur, bleibt es straffrei.',
  overtakeYellow:
    'Unter Gelb, VSC und Safety Car darf nicht überholt werden. Ausnahme: Das überholte Auto ist offensichtlich langsam oder defekt. Gelb/VSC: 5 Sek. Doppelgelb/Safety Car: 10 Sek.',
  collision:
    'Überholrichtlinie innen: Der Angreifer hat Anspruch auf Platz, wenn seine Vorderachse am Einlenkpunkt mindestens auf Höhe der Spiegel des Verteidigers ist. Lenkt der Verteidiger trotzdem ein und verursacht die Kollision, trägt er die Schuld. Liegt der Angreifer dahinter, trägt er die Schuld. Nur knapp auf Höhe: Rennunfall. Richtwert 5 Sek., bei Ausfall 10 Sek.',
  unsafeRelease:
    'Unsichere Freigabe: Muss ein anderes Auto deutlich bremsen oder ausweichen, gibt es 5 Sekunden. Leichtes Lupfen ohne Gefahr: Verwarnung. Kein Einfluss: keine Strafe.',
  trackLimits:
    'Track Limits: Alle vier Räder jenseits der weißen Linie. Ohne Vorteil: keine Strafe. Kleiner Vorteil: Verwarnung. Klarer Zeitgewinn: 5 Sekunden.',
}

export const TYPE_TITLE = {
  jumpStart: 'Frühstart',
  gridPosition: 'Falsche Startposition',
  overtakeYellow: 'Überholen unter Gelb',
  collision: 'Kollision',
  unsafeRelease: 'Unsichere Freigabe',
  trackLimits: 'Track Limits',
  hazard: 'Auto steht auf der Strecke',
}

export const sectorOf = (s, L) => Math.min(2, Math.floor(s / (L / 3)))
const mod = (x, L) => ((x % L) + L) % L

export class Race {
  constructor(trackKey, laps = 10) {
    this.track = buildTrack(trackKey)
    this.L = this.track.length
    this.laps = laps
    this.t = 0
    this.state = 'GRID' // GRID | FORMATION | GRIDREADY | LIGHTS | GREEN | VSC | SC | RED | RESTART | FINISHED
    this.raceStart = null
    this.lightsAt = null
    this.lightsOutAt = null
    this.formations = 0
    this.sectors = ['green', 'green', 'green']
    this.messages = []
    this.radioLog = []
    this.incidents = []
    this.nextIncId = 1
    this.caseNo = 0
    this.safety = 100
    this.fairness = 80
    this.feedback = []
    this.feedbackLog = []
    this.flow = 100
    // Funk
    this.radioQueue = []
    this.usedLines = {}
    this.nextAmbient = rnd(15, 30)
    this.dangerT = 0
    this.scIdleT = 0
    // Wetter: mit 55 % Wahrscheinlichkeit zieht ein Schauer durch
    const dur = laps * this.track.lapRef
    this.rain = 0
    this.wet = 0
    this.rainPlan = Math.random() < 0.55 ? { start: rnd(0.15, 0.6) * dur, dur: rnd(90, 240), peak: rnd(0.35, 1) } : null
    this.rainPhase = 'dry'
    this.heavyT = 0
    this.scEnding = false
    this.sc = null
    this.vscEndAt = null
    this.restartAt = null
    this.chequered = false
    this.finishCount = 0
    this.order = []
    this.cars = DRIVERS.map((d, i) => ({
      ...d,
      id: i,
      dist: -(12 + i * 8),
      slot: -(12 + i * 8),
      slotLat: i % 2 ? 0.35 : -0.35,
      onGrid: true,
      stalled: false,
      speed: 0,
      lat: i % 2 ? 0.35 : -0.35,
      latTarget: i % 2 ? 0.35 : -0.35,
      status: 'run', // run | stopped | out | dsq | fin
      pace: d.teamPace + rnd(-0.003, 0.003),
      form: 1,
      penaltySec: 0,
      warnings: 0,
      pending: null,
      serve: null,
      blockT: 0,
      passing: null,
      finishTime: null,
      finishIdx: null,
      lapStart: 0,
      bestLap: null,
      lapDirty: false,
    }))
    this.msg('CARS ON GRID - AWAITING FORMATION LAP')
  }

  // ---------- Hilfsfunktionen ----------
  msg(text, level = 'info') {
    this.messages.push({ t: this.t, text, level, id: (this.msgSeq = (this.msgSeq || 0) + 1) })
    if (this.messages.length > 200) this.messages.shift()
  }
  radio(car, text, box = false) {
    this.radioLog.push({ t: this.t, name: car.name, code: car.code, color: car.color, text, box, id: (this.radioSeq = (this.radioSeq || 0) + 1) })
    if (this.radioLog.length > 80) this.radioLog.shift()
  }
  // Spruch aus der Sammlung, ohne direkte Wiederholung; optional mit Antwort vom Kommandostand
  say(key, car, vars = {}, { force = false, replyChance = 0.4 } = {}) {
    if (!car || !LINES[key]) return
    if (!force && car.lastRadio != null && this.t - car.lastRadio < 6) return
    const used = (this.usedLines[key] ||= [])
    let pool = LINES[key].filter((l) => !used.includes(l) && (vars.other || !l.includes('{other}')))
    if (!pool.length) { used.length = 0; pool = LINES[key].filter((l) => vars.other || !l.includes('{other}')) }
    const line = pick(pool)
    used.push(line)
    const w = this.where(car)
    const text = line
      .replaceAll('{other}', vars.other ? vars.other.last : 'der da')
      .replaceAll('{turn}', w.name)
      .replaceAll('{sector}', String(w.sector + 1))
      .replaceAll('{pos}', String(vars.pos ?? ''))
    car.lastRadio = this.t
    this.radio(car, text)
    if (REPLIES[key] && Math.random() < replyChance) this.radioQueue.push({ at: this.t + rnd(2, 4), car, text: pick(REPLIES[key]) })
  }
  sayRandom(key, n = 1, vars = {}) {
    const alive = this.cars.filter((c) => c.status === 'run')
    for (let i = 0; i < n && alive.length; i++) this.say(key, alive.splice(Math.floor(Math.random() * alive.length), 1)[0], vars)
  }
  logEvent(text, delta) {
    this.feedbackLog.push({ t: this.t, text, delta: Math.round(delta) })
  }
  tag(c) {
    return `CAR ${c.num} (${c.code})`
  }
  where(c) {
    const s = mod(c.dist, this.L)
    const k = this.track.cornerAt(s)
    return { sector: sectorOf(s, this.L), turn: k.n, name: k.name, label: `Kurve ${k.n} (${k.name})` }
  }
  lapNo(c) {
    return clamp(Math.floor(c.dist / this.L) + 1, 1, this.laps)
  }
  standings() {
    const rank = (c) => (c.status === 'fin' ? 0 : c.status === 'run' || c.status === 'stopped' ? 1 : c.status === 'out' ? 2 : 3)
    return [...this.cars].sort((a, b) => {
      const ra = rank(a), rb = rank(b)
      if (ra !== rb) return ra - rb
      if (ra === 0) return a.finishIdx - b.finishIdx
      return b.dist - a.dist
    })
  }

  // ---------- Bedienung ----------
  // 1) Einführungsrunde: das Feld fährt langsam eine Runde und stellt sich wieder auf
  startFormation() {
    if (this.state !== 'GRID' && this.state !== 'GRIDREADY') return
    this.formations++
    this.state = 'FORMATION'
    const fault = Math.random() < 0.3 ? pick(this.cars.filter((c) => c.status === 'run')) : null
    for (const c of this.cars) {
      if (c.status !== 'run') continue
      c.dist = c.slot - this.L
      c.onGrid = false
      c.speed = 0
      c.gridOver = c === fault ? +rnd(0.1, 1.3).toFixed(2) : 0
    }
    this.msg(this.formations > 1 ? 'EXTRA FORMATION LAP STARTED' : 'FORMATION LAP STARTED', 'flag')
    this.radioQueue.push({ at: this.t + 12, key: 'formation' }, { at: this.t + 30, key: 'formation' })
  }
  // 2) Startampel: fünf rote Lichter, dann gehen sie nach zufälliger Wartezeit aus
  startLights() {
    if (this.state !== 'GRIDREADY') return
    this.state = 'LIGHTS'
    this.lightsAt = this.t
    this.lightsOutAt = this.t + 5 + rnd(0.5, 2.3)
    this.jump = Math.random() < 0.3 ? { car: pick(this.cars.filter((c) => c.status === 'run' && !c.stalled)), kind: pick(['twitch', 'roll', 'roll', 'clear']), done: false } : null
    this.msg('START PROCEDURE - LIGHTS SEQUENCE', 'warn')
  }
  // Start abbrechen: zusätzliche Einführungsrunde, Renndistanz minus eine Runde
  abortStart() {
    if (this.state !== 'GRIDREADY') return
    const stalled = this.cars.filter((c) => c.stalled)
    if (!stalled.length) this.flow = clamp(this.flow - 8, 0, 100)
    else this.logEvent('Start abgebrochen: Auto stand in der Aufstellung', 0)
    this.msg('START ABORTED - EXTRA FORMATION LAP, RACE DISTANCE REDUCED BY ONE LAP', 'bad')
    this.laps = Math.max(1, this.laps - 1)
    let back = Math.min(...this.cars.filter((c) => c.status === 'run').map((c) => c.slot))
    for (const c of stalled) {
      c.stalled = false
      back -= 8
      c.slot = back
      this.msg(`${this.tag(c)} - PUSHED TO PIT LANE, WILL START FROM THE BACK`, 'info')
    }
    this.sayRandom('abort', 2)
    this.startFormation()
  }
  lightsOn() {
    return this.state === 'LIGHTS' ? Math.min(5, Math.floor(this.t - this.lightsAt) + 1) : 0
  }
  go() {
    this.state = 'GREEN'
    this.raceStart = this.t
    if (this.rainPlan) this.rainPlan.start += this.t
    this.nextAmbient = this.t + rnd(15, 30)
    this.msg('LIGHTS OUT AND AWAY WE GO', 'flag')
    this.radioQueue.push({ at: this.t + 6, key: 'start' }, { at: this.t + 11, key: 'start' })
    for (const c of this.cars) {
      c.lapStart = this.t
      c.onGrid = false
      if (c.stalled) {
        c.stalled = false
        this.stopCar(c, 'STALLED ON GRID')
        this.safety = clamp(this.safety - 15, 0, 100)
        this.logEvent(`Start trotz stehendem Auto (${c.code})`, -15)
        this.radioQueue.push({ at: this.t + 3, key: 'danger' })
      }
    }
    this.spawnStartCases()
  }
  spawnStartCases() {
    const loc = { sector: 0, turn: 0, label: 'Startaufstellung' }
    const j = this.jump
    if (j && j.car.status === 'run') {
      const c = j.car
      const early = j.kind === 'twitch' ? +rnd(0.3, 0.9).toFixed(2) : j.kind === 'roll' ? +rnd(0.08, 0.25).toFixed(2) : +rnd(0.3, 0.6).toFixed(2)
      const inc = this.makeBase('decision', 'jumpStart', [c.id], loc)
      inc.ideal = { culprit: null, sev: j.kind === 'twitch' ? 0 : j.kind === 'roll' ? 2 : 4 }
      inc.facts = [
        ['Fahrer', `${c.num} ${c.name} - ${c.team}`],
        ['Startplatz', `P${this.cars.filter((o) => o.slot > c.slot).length + 1}`],
        ['Erste Bewegung', `${early.toFixed(2)} s vor Erlöschen der Lichter`],
        ['Sensor', j.kind === 'twitch' ? 'nicht ausgelöst, Auto stand wieder' : 'ausgelöst'],
        ['Vorteil', j.kind === 'clear' ? 'deutlich, mehrere Meter' : j.kind === 'roll' ? 'gering' : 'keiner'],
      ]
      inc.statements = [{ code: c.code, text: pick(['Ich habe mich nicht bewegt! Die Kupplung hat nur kurz gegriffen.', 'Das war im Rahmen. Der Sensor spinnt.', 'Okay, vielleicht war ich einen Hauch zu früh.']) }]
      inc.replay = { kind: 'jump', variant: j.kind }
      inc.expert = j.kind === 'twitch' ? 'Experten: Zucken ohne Sensorauslösung, keine Strafe.' : j.kind === 'roll' ? 'Experten: Frühstart, Sensor ausgelöst. 5 Sekunden.' : 'Experten: Klarer Frühstart. Durchfahrtsstrafe.'
      this.incidents.push(inc)
      this.msg(`${this.tag(c)} - FALSE START - UNDER INVESTIGATION`, 'warn')
      this.say('jump', c, {}, { force: true })
    }
    for (const c of this.cars) {
      if (!c.gridOver || c.status !== 'run') continue
      const over = +(c.gridOver - 0.45).toFixed(2) // Meter, die der Vorderreifen über der Linie steht
      const inc = this.makeBase('decision', 'gridPosition', [c.id], loc)
      inc.ideal = { culprit: null, sev: over > 0.03 ? 2 : 0 }
      inc.options = ['nfa', 'warn', 't5', 't10']
      inc.facts = [
        ['Fahrer', `${c.num} ${c.name} - ${c.team}`],
        ['Startplatz', `P${this.cars.filter((o) => o.slot > c.slot).length + 1}`],
        ['Meldung', 'Startbox-Kamera: Auto steht weit vorn'],
      ]
      inc.tip = 'Tipp: Ans Ende scrubben, hineinzoomen und die Vorderreifen gegen die weiße Linie prüfen.'
      inc.statements = [{ code: c.code, text: pick(['Ich sehe die Linie aus dem Cockpit nicht. Niemand sieht die.', 'Ich stand perfekt. Glaube ich.']) }]
      inc.replay = { kind: 'grid', over }
      inc.expert = over > 0.03 ? `Experten: Vorderreifen ${over.toFixed(2)} m über der Linie. 5 Sekunden.` : `Experten: Reifen noch ${Math.abs(over).toFixed(2)} m hinter der Linie, keine Strafe.`
      this.incidents.push(inc)
      this.msg(`${this.tag(c)} - INCORRECT STARTING POSITION - UNDER INVESTIGATION`, 'warn')
      c.gridOver = 0
    }
  }

  cycleSector(i) {
    if (this.state === 'GRID' || this.state === 'FINISHED') return
    const order = ['green', 'yellow', 'double']
    const next = order[(order.indexOf(this.sectors[i]) + 1) % 3]
    this.setSector(i, next)
  }
  setSector(i, flag) {
    if (this.sectors[i] === flag) return
    this.sectors[i] = flag
    const name = flag === 'green' ? 'CLEAR' : flag === 'yellow' ? 'YELLOW' : 'DOUBLE YELLOW'
    this.msg(`SECTOR ${i + 1} - ${name}`, flag === 'green' ? 'ok' : 'warn')
    if (flag !== 'green' && this.state === 'GREEN' && !this.cars.some((c) => c.status === 'stopped' && sectorOf(mod(c.dist, this.L), this.L) === i)) {
      this.radioQueue.push({ at: this.t + rnd(4, 9), key: 'yellowNoReason' })
    }
  }
  allGreen() {
    for (let i = 0; i < 3; i++) this.setSector(i, 'green')
  }

  callVSC() {
    if (this.state !== 'GREEN') return
    this.state = 'VSC'
    this.vscEndAt = null
    if (!this.cars.some((c) => c.status === 'stopped') && this.wet < 0.6) this.flow = clamp(this.flow - 2, 0, 100)
    this.msg('VIRTUAL SAFETY CAR DEPLOYED', 'warn')
    this.reactRadio('vsc')
  }
  endVSC() {
    if (this.state !== 'VSC' || this.vscEndAt) return
    this.vscEndAt = this.t + 8
    this.msg('VSC ENDING - THIS IS THE VSC ENDING MESSAGE', 'warn')
  }
  callSC() {
    if (this.state !== 'GREEN' && this.state !== 'VSC') return
    const lead = this.standings().find((c) => c.status === 'run')
    this.state = 'SC'
    this.vscEndAt = null
    this.scEnding = false
    if (!this.cars.some((c) => c.status === 'stopped') && this.wet < 0.6) this.flow = clamp(this.flow - 4, 0, 100)
    this.sc = { dist: (lead ? lead.dist : 0) + 70, speed: 0, lat: 0 }
    this.msg('SAFETY CAR DEPLOYED', 'warn')
    this.reactRadio('sc')
  }
  scInThisLap() {
    if (this.state !== 'SC' || this.scEnding) return
    this.scEnding = true
    this.msg('SAFETY CAR IN THIS LAP', 'warn')
    if (this.cars.some((c) => c.status === 'stopped')) {
      this.safety = clamp(this.safety - 12, 0, 100)
      this.msg('WARNING - STOPPED CAR STILL ON TRACK', 'bad')
    }
  }
  callRed() {
    if (!['GREEN', 'VSC', 'SC'].includes(this.state)) return
    this.state = 'RED'
    if (this.wet < 0.75) this.flow = clamp(this.flow - 6, 0, 100)
    this.sc = null
    this.scEnding = false
    this.vscEndAt = null
    this.msg('RED FLAG - SESSION SUSPENDED', 'bad')
    this.reactRadio('red')
  }
  restart() {
    if (this.state !== 'RED') return
    const run = this.standings().filter((c) => c.status === 'run' || c.status === 'stopped')
    const alive = run.filter((c) => c.status === 'run')
    if (!alive.length) return
    const lead = alive[0]
    const base = Math.ceil(lead.dist / this.L) * this.L - 10
    alive.forEach((c, i) => {
      c.dist = base - i * 8
      c.speed = 0
      c.lat = i % 2 ? 0.35 : -0.35
      c.latTarget = c.lat
      c.passing = null
    })
    this.allGreen()
    this.state = 'RESTART'
    this.restartAt = this.t + 6
    this.msg('RACE WILL RESUME IN 6 SECONDS', 'warn')
    this.sayRandom('restart', 1)
  }

  // Strafen
  applyPenalty(car, key, reason) {
    const o = OPTIONS[key]
    const tag = this.tag(car)
    if (key === 'nfa') {
      this.msg(`${tag} - NO FURTHER ACTION (${reason})`, 'ok')
      return
    }
    if (key === 'lap' || key === 'lap5') {
      if (key === 'lap5') car.penaltySec += 5
      this.msg(`${tag} - LAP TIME DELETED${key === 'lap5' ? ' + 5 SECOND TIME PENALTY' : ''} (${reason})`, key === 'lap5' ? 'bad' : 'warn')
      return
    }
    if (key === 'warn') {
      car.warnings++
      this.msg(`${tag} - WARNING (${reason})`, 'warn')
      return
    }
    if (key === 't5' || key === 't10') {
      const s = key === 't5' ? 5 : 10
      car.penaltySec += s
      this.msg(`${s} SECOND TIME PENALTY FOR ${tag} (${reason})`, 'bad')
      return
    }
    if (key === 'black') {
      car.status = 'dsq'
      car.speed = 0
      this.msg(`${tag} - DISQUALIFIED, BLACK AND ORANGE FLAG (${reason})`, 'bad')
      return
    }
    // Durchfahrt / Stop&Go: nur sinnvoll für fahrende Autos
    if (car.status !== 'run') {
      const s = key === 'dt' ? 20 : 30
      car.penaltySec += s
      this.msg(`${s} SECOND TIME PENALTY FOR ${tag} - NOT SERVED (${reason})`, 'bad')
      return
    }
    car.pending = key === 'dt' ? { type: 'dt', rem: 20 } : { type: 'sg', rem: 10 }
    this.msg(`${key === 'dt' ? 'DRIVE THROUGH' : '10 SECOND STOP & GO'} PENALTY FOR ${tag} (${reason})`, 'bad')
  }

  penalizeCar(carId, key) {
    const c = this.cars[carId]
    if (!c || c.status === 'dsq' || c.status === 'fin') return
    this.applyPenalty(c, key, 'DIRECT RACE CONTROL ACTION')
    const o = OPTIONS[key]
    const dl = key === 'black' ? 30 : o.sev * 4
    this.fairness = clamp(this.fairness - dl, 0, 100)
    if (dl) this.logEvent(`Posten ${c.code}: Direktstrafe (${o.label})`, -dl)
    if (key !== 'nfa') this.reactRadio('penalty', c, key)
  }

  decide(incId, { culprit = null, opt }) {
    const inc = this.incidents.find((i) => i.id === incId && i.status === 'open' && i.kind === 'decision')
    if (!inc) return
    const [a, b] = inc.carIds.map((id) => this.cars[id])
    const sev = OPTIONS[opt].sev
    let target = null
    let delta = 0
    let verdict = ''
    if (inc.type === 'collision') {
      if (opt !== 'nfa') {
        if (!culprit) return
        target = culprit === 'a' ? a : b
      }
      const ic = inc.ideal.culprit
      const culpritOk = opt === 'nfa' ? ic === null : culprit === ic
      if (opt === 'nfa') delta = ic === null ? 6 : -(6 + inc.ideal.sev * 2)
      else delta = culpritOk && sev === inc.ideal.sev ? 6 : -((culpritOk ? 0 : 18) + Math.abs(sev - inc.ideal.sev) * 3)
      const who = ic === 'a' ? a.code : ic === 'b' ? b.code : null
      verdict = who
        ? `Experten: Schuld bei ${who}${inc.ideal.sev ? `, Richtwert ${inc.ideal.sev <= 2 ? '5' : inc.ideal.sev === 3 ? '10' : 'Durchfahrt'}` : ''}.`
        : 'Experten: Rennunfall, keine Strafe.'
    } else {
      target = a
      delta = sev === inc.ideal.sev ? 6 : -Math.abs(sev - inc.ideal.sev) * 3.5
      verdict = inc.expert || ''
    }
    this.fairness = clamp(this.fairness + delta, 0, 100)
    const fb = {
      id: `${inc.id}-${this.t}`,
      delta: Math.round(delta),
      text: `Fall ${String(inc.no).padStart(2, '0')} (${TYPE_TITLE[inc.type]}) ${delta > 0 ? 'korrekt' : 'fragwürdig'}`,
      verdict,
    }
    this.feedback.push(fb)
    this.logEvent(fb.text, delta)
    const reason = { jumpStart: 'FALSE START', gridPosition: 'INCORRECT STARTING POSITION', collision: 'CAUSING A COLLISION', unsafeRelease: 'UNSAFE RELEASE', overtakeYellow: 'OVERTAKING UNDER YELLOW' }[inc.type] || 'TRACK LIMITS'
    if (target) {
      this.applyPenalty(target, opt, reason)
      if (opt !== 'nfa') this.reactRadio('penalty', target, opt)
    } else {
      this.msg(`${this.tag(a)} / ${this.tag(b)} - RACING INCIDENT, NO FURTHER ACTION`, 'ok')
      if (inc.type === 'collision') {
        this.say('nfaVictim', b, { other: a }, { force: true })
        this.say('nfaRelief', a, {}, { force: true })
      }
    }
    inc.status = 'done'
    inc.result = opt
    this.cleanupIncidents()
    return fb
  }

  cleanupIncidents() {
    this.incidents = this.incidents.filter((i) => i.status === 'open' || this.t - (i.doneAt ?? this.t) < 0)
  }

  reactRadio(kind, car, key) {
    if (kind === 'sc') this.sayRandom('sc', 2)
    else if (kind === 'vsc') this.sayRandom('vsc', 1)
    else if (kind === 'red') this.sayRandom(this.wet > 0.7 ? 'rainHeavy' : 'red', 2)
    else if (kind === 'penalty' && car) {
      const k = key === 'black' ? 'black' : ['dt', 'sg', 't10'].includes(key) ? 'penaltyHeavy' : key === 'warn' ? 'warn' : key === 'lap' ? 'lapDeleted' : 'penaltyLight'
      this.say(k, car, {}, { force: true })
    }
  }

  // ---------- Simulation ----------
  step(dt) {
    if (this.state === 'GRID' || this.state === 'FINISHED') return
    this.t += dt
    const order = this.standings().filter((c) => c.status === 'run' || c.status === 'stopped')
    this.order = order

    if (this.state === 'FORMATION') {
      const run = this.cars.filter((c) => c.status === 'run')
      if (run.every((c) => c.onGrid)) {
        this.state = 'GRIDREADY'
        this.msg('ALL CARS ON GRID - READY FOR START', 'ok')
        if (Math.random() < 0.18) {
          const c = pick(run)
          c.stalled = true
          this.msg(`${this.tag(c)} - STALLED ON GRID, YELLOW FLAGS`, 'bad')
          this.say('stall', c, {}, { force: true })
        }
      }
    }
    if (this.state === 'LIGHTS') {
      const j = this.jump
      if (j && !j.done && this.t >= this.lightsOutAt - (j.kind === 'twitch' ? 1.4 : j.kind === 'roll' ? 0.3 : 0.5)) {
        j.done = true
        j.car.dist += j.kind === 'twitch' ? 0.3 : j.kind === 'roll' ? 0.7 : 2.5
      }
      if (this.t >= this.lightsOutAt) this.go()
    }
    if (this.state === 'VSC' && this.vscEndAt && this.t >= this.vscEndAt) {
      this.state = 'GREEN'
      this.vscEndAt = null
      this.msg('VSC ENDED - GREEN FLAG', 'ok')
    }
    if (this.state === 'RESTART' && this.t >= this.restartAt) {
      this.state = 'GREEN'
      this.msg('LIGHTS OUT - RACE RESUMED', 'flag')
    }
    if (this.sc) {
      const idx = Math.floor(mod(this.sc.dist, this.L) / this.track.ds) % this.track.n
      const target = this.track.v[idx] * 0.42
      this.sc.speed += clamp(target - this.sc.speed, -30 * dt, 12 * dt)
      this.sc.dist += this.sc.speed * dt
    }

    const running = order.filter((c) => c.status === 'run')
    for (let i = 0; i < running.length; i++) this.stepCar(running[i], dt, running, i)
    for (const c of order) if (c.status === 'stopped') this.stepStopped(c, dt)

    this.weather(dt)
    this.hazards(dt)
    this.randomEvents(dt)
    this.chatter(dt)
    this.expireIncidents()
  }

  stepStopped(c, dt) {
    c.speed = Math.max(0, c.speed - 45 * dt)
    c.dist += c.speed * dt
    c.lat += clamp(c.verge - c.lat, -1.5 * dt, 1.5 * dt)
    if (c.rejoinAt && this.t >= c.rejoinAt && this.state !== 'RED') {
      c.status = 'run'
      c.rejoinAt = null
      c.latTarget = 0
      this.msg(`${this.tag(c)} - BACK ON TRACK`, 'info')
    }
  }

  stepCar(c, dt, running, idxInOrder) {
    const T = this.track, L = this.L
    const s = mod(c.dist, L)
    const idx = Math.floor(s / T.ds) % T.n
    const sec = sectorOf(s, L)
    const st = this.state
    let v = T.v[idx] * c.pace * c.form * (1 - 0.14 * this.wet)
    let catchGap = null
    const pre = st === 'FORMATION' || st === 'GRIDREADY' || st === 'LIGHTS'
    if (st === 'RED' || st === 'RESTART' || st === 'GRIDREADY' || st === 'LIGHTS') v = 0
    else if (st === 'FORMATION') {
      const target = c.slot + c.gridOver
      const rem = target - c.dist
      if (c.onGrid) v = 0
      else {
        v = Math.min(T.v[idx] * 0.6, Math.sqrt(2 * 5 * Math.max(0, rem)) + 0.6)
        // Reifen aufwärmen: Schlangenlinien, kurz vor dem Startplatz einordnen
        c.latTarget = rem > 90 ? 0.7 * Math.sin(this.t * 1.7 + c.id) : c.slotLat
        if (rem < 0.3) { c.dist = target; c.speed = 0; c.onGrid = true; c.lat = c.slotLat; v = 0 }
      }
    }
    else if (st === 'VSC') v *= 0.6
    else if (st === 'SC') {
      const ahead = idxInOrder > 0 ? running[idxInOrder - 1] : this.sc
      const gap = ahead.dist - c.dist
      catchGap = gap
      v *= gap > 40 && gap < this.L * 0.6 ? 0.62 : 0.42
    } else {
      const f = this.sectors[sec]
      if (f === 'yellow') v *= 0.8
      else if (f === 'double') v *= 0.55
    }

    if (st !== 'GREEN' || this.sectors.some((f) => f !== 'green') || c.serve) c.lapDirty = true
    // Strafen abfahren
    if (c.serve) {
      c.serve.rem -= dt
      v = c.serve.type === 'dt' ? v * 0.3 : 0
      if (c.serve.rem <= 0) {
        this.msg(`${this.tag(c)} - PENALTY SERVED`, 'info')
        c.serve = null
      }
    }

    // Vordermann / Überholen
    let blocker = null, bgap = 1e9
    const consider = (o, isSC) => {
      const g = mod(o.dist - c.dist, L)
      if (st === 'FORMATION' && o.onGrid) return
      if (g > 0 && g < 45 && (st === 'FORMATION' || Math.abs(o.lat - c.lat) < 0.6) && g < bgap) {
        bgap = g
        blocker = o
        blocker.isSC = isSC
      }
    }
    for (const o of running) if (o !== c) consider(o, false)
    if (this.sc) consider(this.sc, true)
    const free = st === 'GREEN'
    if (blocker) {
      const sp = st === 'FORMATION' ? 9 : st === 'SC' || st === 'VSC' ? 14 : 11
      if (bgap < sp + 2) v = Math.min(v, blocker.speed * 0.99)
      else v = Math.min(v, blocker.speed + (bgap - sp) * 0.9)
      c.blockT += dt
      if (free && this.t > 70 && this.t > (this.nextStuck || 0) && c.blockT > 9 && !blocker.isSC && Math.random() < dt * 0.02 && (c.lastRadio == null || this.t - c.lastRadio > 50)) {
        this.nextStuck = this.t + rnd(25, 50)
        this.say(blocker.dist < c.dist - L * 0.5 ? 'blue' : 'stuck', c, { other: blocker })
      }
      const lapped = !blocker.isSC && blocker.dist < c.dist - L * 0.5
      if (free && !c.passing && this.sectors[sec] === 'green' && !blocker.isSC && c.blockT > (lapped ? 0.3 : 3) && (lapped || Math.random() < dt * 0.3)) {
        c.passing = { until: this.t + 5, side: Math.random() < 0.5 ? -1 : 1 }
      }
    } else c.blockT = 0
    if (c.passing) {
      if (this.t > c.passing.until || !free) {
        c.passing = null
        c.latTarget = 0
      } else {
        c.latTarget = c.passing.side * 0.85
        v *= 1.05
      }
    } else if (Math.abs(c.latTarget) > 0.4 && c.latTarget === c.passing) c.latTarget = 0
    if (!c.passing && !pre && Math.abs(c.latTarget) > 0.4 && this.state !== 'RESTART' && this.state !== 'RED') c.latTarget = 0

    const a = v > c.speed ? 14 : st === 'RED' ? 42 : 38
    c.speed += clamp(v - c.speed, -a * dt, a * dt)
    const prev = c.dist
    c.dist += c.speed * dt
    c.lat += clamp(c.latTarget - c.lat, -1.2 * dt, 1.2 * dt)
    if (Math.floor(c.dist / L) > Math.floor(prev / L) && c.dist > 0) this.onLine(c, idxInOrder)
  }

  onLine(c, idxInOrder) {
    c.form = rnd(0.985, 1.003)
    const lt = this.t - c.lapStart
    if (!c.lapDirty && c.dist > this.L * 0.5 && (c.bestLap === null || lt < c.bestLap)) c.bestLap = lt
    c.lapStart = this.t
    c.lapDirty = false
    if (c.dist >= this.laps * this.L - 1 || this.chequered) {
      this.finish(c)
      return
    }
    if (c.pending) {
      c.serve = c.pending
      this.msg(`${this.tag(c)} - SERVING ${c.pending.type === 'dt' ? 'DRIVE THROUGH' : 'STOP & GO'} PENALTY`, 'info')
      c.pending = null
    }
    if (idxInOrder === 0 && this.state === 'SC' && this.scEnding) {
      this.state = 'GREEN'
      this.sc = null
      this.scEnding = false
      this.allGreen()
      this.msg('SAFETY CAR IN - TRACK CLEAR, GREEN FLAG', 'ok')
    }
  }

  finish(c) {
    c.status = 'fin'
    c.finishTime = this.t
    c.finishIdx = this.finishCount++
    c.speed = 0
    if (!this.chequered) {
      this.chequered = true
      this.sc = null
      this.state = this.state === 'SC' || this.state === 'VSC' ? 'GREEN' : this.state
      this.msg('CHEQUERED FLAG', 'flag')
      for (const o of this.cars) if (o.status === 'stopped') o.status = 'out'
    }
    this.msg(`${this.tag(c)} - FINISHED P${this.finishCount}`, 'info')
    if (this.finishCount === 1) this.say('win', c, {}, { force: true, replyChance: 1 })
    else if (Math.random() < 0.3) this.say(this.finishCount >= this.cars.length - 4 ? 'finishLast' : 'finishMid', c, { pos: this.finishCount }, { force: true })
    if (!this.cars.some((o) => o.status === 'run' || o.status === 'stopped')) {
      this.state = 'FINISHED'
      this.msg('SESSION FINISHED', 'flag')
    }
  }

  weather(dt) {
    const p = this.rainPlan
    let target = 0
    if (p && this.t > p.start && this.t < p.start + p.dur) {
      const u = this.t - p.start
      target = p.peak * Math.min(1, u / 40, (p.dur - u) / 40)
    }
    this.rain = Math.max(0, target)
    if (this.rain > this.wet) this.wet = Math.min(this.rain, this.wet + dt / 28)
    else this.wet = Math.max(this.rain, this.wet - dt / 110)
    const phase = this.rain > 0.02 ? (this.wet > 0.7 ? 'heavy' : 'rain') : this.wet > 0.08 ? 'drying' : 'dry'
    if (phase !== this.rainPhase) {
      if (phase === 'rain' && this.rainPhase !== 'heavy') { this.msg('RAIN REPORTED - LOW GRIP CONDITIONS', 'warn'); this.sayRandom('rainStart', 2) }
      if (phase === 'heavy') { this.msg('HEAVY RAIN - RISK OF AQUAPLANING', 'bad'); this.sayRandom('rainHeavy', 2) }
      if (phase === 'drying') { this.msg('RAIN STOPPED - TRACK DRYING', 'ok'); this.sayRandom('rainEnd', 1) }
      this.rainPhase = phase
    }
    if (phase === 'heavy' && (this.state === 'GREEN' || this.state === 'VSC')) {
      this.heavyT += dt
      if (this.heavyT > 14) { this.heavyT = 0; this.sayRandom('rainHeavy', 1) }
    }
  }

  chatter(dt) {
    const q = this.radioQueue
    for (let i = q.length - 1; i >= 0; i--) {
      if (this.t < q[i].at) continue
      const e = q.splice(i, 1)[0]
      if (e.key) this.sayRandom(e.key, 1)
      else this.radio(e.car, e.text, true)
    }
    if (this.state === 'GREEN' && !this.chequered && this.t > this.nextAmbient) {
      this.nextAmbient = this.t + rnd(22, 45)
      this.sayRandom('ambient', 1)
    }
  }

  hazards(dt) {
    let danger = 0
    for (const c of this.cars) {
      if (c.status !== 'stopped') continue
      const sec = sectorOf(mod(c.dist, this.L), this.L)
      const covered = this.state !== 'GREEN' || this.sectors[sec] !== 'green'
      if (!covered) danger++
      if (c.recov != null) {
        const rate = this.state === 'RED' ? 1.5 : this.state === 'SC' ? 1 : this.state === 'VSC' ? 0.7 : this.sectors[sec] !== 'green' ? 0.35 : 0.1
        c.recov -= dt * rate
        if (c.recov <= 0) {
          c.status = 'out'
          c.speed = 0
          this.msg(`${this.tag(c)} - REMOVED FROM TRACK`, 'ok')
        }
      }
    }
    const flood = this.wet > 0.78 && (this.state === 'GREEN' || this.state === 'VSC')
    this.safety = clamp(this.safety + (danger ? -0.7 * danger * dt : flood ? -0.45 * dt : 0.04 * dt), 0, 100)
    this.dangerT = danger ? this.dangerT + dt : 0
    if (this.dangerT > 7) { this.dangerT = -18; this.sayRandom('danger', 1) }
    const stoppedSecs = new Set(this.cars.filter((c) => c.status === 'stopped').map((c) => sectorOf(mod(c.dist, this.L), this.L)))
    const idle = (this.state === 'SC' || this.state === 'VSC') && !stoppedSecs.size && this.wet < 0.6
    if (idle) this.flow = clamp(this.flow - 0.25 * dt, 0, 100)
    this.scIdleT = idle && !this.scEnding && !this.vscEndAt ? this.scIdleT + dt : 0
    if (this.scIdleT > 30) { this.scIdleT = 0; this.sayRandom('scTooLong', 1) }
    for (let k = 0; k < 3; k++) if (this.sectors[k] !== 'green' && !stoppedSecs.has(k) && this.state === 'GREEN') this.flow = clamp(this.flow - 0.05 * dt, 0, 100)
    for (const inc of this.incidents) {
      if (inc.kind === 'hazard' && inc.status === 'open' && this.cars[inc.carIds[0]].status !== 'stopped') inc.status = 'done'
    }
    this.incidents = this.incidents.filter((i) => i.status === 'open')
  }

  expireIncidents() {
    for (const inc of this.incidents) {
      if (inc.kind === 'decision' && inc.status === 'open' && this.t > inc.deadline) {
        inc.status = 'done'
        const miss = inc.ideal.sev >= 2 ? 10 : 3
        this.fairness = clamp(this.fairness - miss, 0, 100)
        this.logEvent(`Fall ${String(inc.no).padStart(2, '0')} (${TYPE_TITLE[inc.type]}): nicht entschieden`, -miss)
        this.msg(`CASE ${inc.no} - NO DECISION WITHIN TIME, CASE CLOSED`, 'warn')
      }
    }
    this.incidents = this.incidents.filter((i) => i.status === 'open')
  }

  // ---------- Zufallsereignisse ----------
  randomEvents(dt) {
    if (!['GREEN', 'SC', 'VSC'].includes(this.state) || this.chequered) return
    const open = this.incidents.filter((i) => i.kind === 'decision').length
    if (open >= 4) return
    const mult = this.state === 'GREEN' ? 1 : 0.25
    if (Math.random() > (dt * mult * (1 + 2.2 * this.wet)) / 45) return
    const types = ['trackLimits', 'trackLimits', 'collision', 'collision', 'unsafeRelease', 'breakdown', 'offTrack']
    if (this.state !== 'GREEN' || this.sectors.some((f) => f !== 'green')) types.push('overtakeYellow', 'overtakeYellow', 'overtakeYellow')
    if (this.wet > 0.3) types.push('offTrack', 'offTrack', 'offTrack', 'collision')
    const type = pick(types)
    this.spawn(type)
  }

  runningCars() {
    return this.order.filter((c) => c.status === 'run')
  }

  makeBase(kind, type, carIds, loc) {
    const inc = {
      id: this.nextIncId++,
      kind,
      type,
      carIds,
      lap: this.lapNo(this.cars[carIds[0]]),
      sector: loc ? loc.sector : 0,
      turn: loc ? loc.turn : 1,
      place: loc && loc.label ? loc.label : 'Boxengasse',
      s: mod(this.cars[carIds[0]].dist, this.L),
      created: this.t,
      status: 'open',
    }
    if (kind === 'decision') {
      inc.no = ++this.caseNo
      inc.deadline = this.t + 110
    }
    return inc
  }

  stopCar(c, why) {
    c.status = 'stopped'
    c.verge = (c.lat >= 0 ? 1 : -1) * 1.3
    c.recov = rnd(35, 60)
    c.passing = null
    c.latTarget = c.verge
    const w = this.where(c)
    this.msg(`${this.tag(c)} - STOPPED ON TRACK AT TURN ${w.turn} (${why})`, 'bad')
    this.incidents.push({ ...this.makeBase('hazard', 'hazard', [c.id], w), why })
  }

  spawn(type) {
    const run = this.runningCars()
    if (run.length < 4) return
    if (type === 'breakdown') {
      const c = pick(run.slice(1))
      this.stopCar(c, 'TECHNICAL')
      this.say('breakdown', c, {}, { force: true })
      return
    }
    if (type === 'offTrack') {
      const c = pick(run.slice(1))
      c.rejoinAt = this.t + rnd(15, 25)
      this.stopCar(c, 'SPIN')
      c.recov = null
      this.say('spin', c, {}, { force: true })
      return
    }
    if (type === 'trackLimits') {
      const c = pick(run)
      const w = this.where(c)
      const prior = Math.floor(rnd(0, 3))
      const over = +rnd(-0.5, 0.9).toFixed(2) // Meter, die Reifen über der Linie (negativ: Linie noch berührt)
      const gain = Math.max(0, +(over * 0.35 + rnd(0, 0.1)).toFixed(2))
      const inc = this.makeBase('decision', 'trackLimits', [c.id], w)
      const violation = over > 0.05
      inc.ideal = { culprit: null, sev: !violation ? 0 : prior >= 1 || gain > 0.2 ? 2 : 1 }
      inc.options = ['nfa', 'lap', 'lap5']
      inc.optionSev = { nfa: 0, lap: 1, lap5: 2 }
      inc.facts = [
        ['Fahrer', `${c.num} ${c.name} - ${c.team}`],
        ['Ort', `Ausgang ${w.label}`],
        ['Runde', `Runde ${inc.lap} von ${this.laps}`],
        ['Rundenzeit', gain ? `-${gain.toFixed(2)} s Vorteil` : 'kein Zeitgewinn'],
        ['Bisherige Verstöße', String(prior)],
        ['Sender', 'Track-Limit-Schleife ausgelöst'],
      ]
      inc.tip = 'Tipp: Zum Moment der größten Abweichung scrubben, hineinzoomen und den inneren Reifen gegen die Linie prüfen.'
      inc.statements = [{ code: c.code, text: pick(['Ich hatte noch einen halben Reifen auf der Linie.', 'Da war eine Rutscherei, kein Vorteil.', 'Die Linie ist dort unmöglich zu sehen.']) }]
      inc.replay = { kind: 'limits', over, gain }
      inc.expert = violation
        ? `Experten: Verstoß. Der Reifen lag ${over.toFixed(2)} m jenseits der Linie${inc.ideal.sev === 2 ? ' - bei Wiederholung oder Vorteil Streichen + 5 Sek.' : ' - Rundenzeit streichen genügt.'}`
        : `Experten: Kein Vergehen. Der innere Reifen berührte noch ${Math.abs(over).toFixed(2)} m die weiße Linie.`
      inc.consequence = 'Kein Einfluss auf andere Fahrer.'
      this.incidents.push(inc)
      this.msg(`${this.tag(c)} - TRACK LIMITS AT TURN ${w.turn} - UNDER INVESTIGATION`, 'warn')
      if (Math.random() < 0.6) this.say('trackLimits', c)
      return
    }
    if (type === 'overtakeYellow') {
      const i = Math.floor(rnd(1, run.length))
      const A = run[i - 1], B = run[i] // A hat B überholt
      const w = this.where(A)
      const dbl = this.state === 'SC' || this.sectors[w.sector] === 'double'
      const status = this.state === 'VSC' ? 'Virtual Safety Car' : this.state === 'SC' ? 'Safety Car' : this.sectors[w.sector] === 'double' ? 'Doppelgelb' : 'Gelb'
      const slow = Math.random() < 0.2
      const ref = Math.round(rnd(150, 230))
      const va = ref + Math.round(rnd(4, 14))
      const inc = this.makeBase('decision', 'overtakeYellow', [A.id, B.id], w)
      inc.ideal = { culprit: null, sev: slow ? 0 : dbl ? 3 : 2 }
      inc.facts = [
        ['Überholt hat', `${A.num} ${A.name} - ${A.team}`],
        ['Überholt wurde', `${B.num} ${B.name} - ${B.team}`],
        ['Status', status],
        ['Tempo ' + A.code, `${va} km/h (Referenz ${ref} km/h)`],
      ]
      if (slow) inc.facts.push(['Überholter', 'fährt offensichtlich langsam (Defekt)'])
      inc.statements = [{ code: A.code, text: slow ? 'Der war ja fast stehend, da musste ich vorbei!' : pick(['Ich bin nur auf der Linie geblieben, er hat gebremst.', 'Ich war schon vorher vorbei, glaube ich.']) }]
      inc.replay = { kind: 'yellow', status, va, ref, slow }
      inc.expert = slow ? 'Experten: Überholter Wagen war offensichtlich langsam, keine Strafe.' : `Experten: Überholen unter ${status}, Richtwert ${dbl ? '10' : '5'} Sek.`
      inc.consequence = status
      this.incidents.push(inc)
      this.msg(`${this.tag(A)} - OVERTAKING UNDER ${status.toUpperCase()} - UNDER INVESTIGATION`, 'warn')
      this.say('overtakeYellow', A, { other: B })
      return
    }
    if (type === 'unsafeRelease') {
      const i = Math.floor(rnd(1, run.length))
      const a = run[i - 1], b = run[i] // a: aus der Box entlassen, b: Betroffener
      const react = Math.round(rnd(0, 60))
      const inc = this.makeBase('decision', 'unsafeRelease', [a.id, b.id], { sector: 0, turn: 1 })
      inc.ideal = { culprit: null, sev: react > 30 ? 2 : react >= 10 ? 1 : 0 }
      inc.facts = [
        ['Freigegeben', `${a.num} ${a.name} - ${a.team}`],
        ['Betroffen', `${b.num} ${b.name} - ${b.team}`],
        ['Reaktion von ' + b.code, `Bremsung -${react} km/h`],
        ['Ort', 'Boxengasse'],
      ]
      inc.statements = [
        { code: b.code, text: pick(['Der kam direkt vor mir raus, ich musste voll auf die Bremse!', 'Das war knapp, aber ich konnte ausweichen.']) },
        { code: a.code, text: 'Die Ampel war grün, ich habe nur freigegebene Fahrt genutzt.' },
      ]
      inc.replay = { kind: 'release', react }
      inc.consequence = `${b.code} bremst um ${react} km/h.`
      this.incidents.push(inc)
      this.msg(`${this.tag(a)} / ${this.tag(b)} - UNSAFE RELEASE - UNDER INVESTIGATION`, 'warn')
      if (react >= 10) this.say('unsafeVictim', b, { other: a })
      else this.say('unsafeReleased', a)
      return
    }
    if (type === 'collision') {
      // Angreifer hinter Verteidiger, physisch nah
      const pairs = []
      for (let i = 1; i < run.length; i++) {
        const g = run[i - 1].dist - run[i].dist
        if (g < 80) pairs.push([run[i], run[i - 1]])
      }
      if (!pairs.length) return
      const [A, B] = pick(pairs)
      const axle = pick(['ahead', 'ahead', 'level', 'behind'])
      const culprit = axle === 'ahead' ? 'b' : axle === 'behind' ? 'a' : null
      const roll = Math.random()
      const outcome = roll < 0.45 ? 'none' : roll < 0.8 ? 'one' : 'both'
      const w = this.where(A)
      const inc = this.makeBase('decision', 'collision', [A.id, B.id], w)
      const base = outcome === 'none' ? 2 : 3
      inc.ideal = { culprit, sev: culprit ? (outcome === 'both' ? 4 : base) : 0 }
      const axleTxt = axle === 'ahead' ? 'Vorderachse auf Höhe der Spiegel' : axle === 'level' ? 'Vorderachse knapp auf Höhe' : 'Vorderachse hinter den Spiegeln'
      let consequence = 'beide fahren weiter'
      const stopped = []
      if (outcome === 'one') stopped.push(pick([A, B]))
      if (outcome === 'both') stopped.push(A, B)
      if (stopped.length) consequence = stopped.map((c) => `${c.code} bleibt stehen`).join(', ')
      inc.facts = [
        ['Auto A (Angreifer)', `${A.num} ${A.name} - ${A.team}`],
        ['Auto B (Verteidiger)', `${B.num} ${B.name} - ${B.team}`],
        ['Ort', `${w.label} - Sektor ${w.sector + 1}`],
        ['Folge', consequence],
        ['Überholpunkt A', axleTxt],
      ]
      inc.statements = [
        { code: A.code, text: axle === 'behind' ? 'Ich wollte es probieren, er hat nicht aufgemacht.' : 'Ich war innen, er hat einfach die Tür zugemacht.' },
        { code: B.code, text: axle === 'ahead' ? 'Der kam aus dem Nichts, viel zu spät gebremst.' : 'Ich habe ihn nicht gesehen, ich bin ganz normal eingelenkt.' },
      ]
      inc.stopId = stopped.length === 1 ? stopped[0].id : null
      inc.replay = { kind: 'collision', axle, outcome }
      inc.consequence = consequence
      this.incidents.push(inc)
      this.msg(`${this.tag(A)} / ${this.tag(B)} - COLLISION AT TURN ${w.turn} - UNDER INVESTIGATION`, 'warn')
      for (const c of stopped) this.stopCar(c, 'COLLISION')
      this.say(stopped.includes(B) ? 'dnfCollision' : 'collisionVictim', B, { other: A }, { force: true })
      this.say(stopped.includes(A) ? 'dnfCollision' : 'collisionAttacker', A, { other: B }, { force: true })
    }
  }

  report() {
    const score = this.safety * 0.4 + this.fairness * 0.4 + this.flow * 0.2
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F'
    const summary = {
      A: 'Souverän. Fahrer und Teams loben die Rennleitung.',
      B: 'Solide Leistung mit kleinen Schwächen.',
      C: 'Durchwachsen. Mehrere Teams fordern ein Gespräch mit dem Rennleiter.',
      D: 'Mangelhaft. Der Weltverband kündigt eine Untersuchung an.',
      F: 'Katastrophal. Der Rennleiter wird mit sofortiger Wirkung abgesetzt.',
    }[grade]
    const cases = this.feedbackLog.filter((e) => e.text.startsWith('Fall'))
    const open = this.incidents.filter((i) => i.kind === 'decision').length
    return {
      grade,
      summary,
      safety: Math.round(this.safety),
      fairness: Math.round(this.fairness),
      flow: Math.round(this.flow),
      decided: cases.length,
      good: cases.filter((e) => e.delta > 0).length,
      open,
      log: [...this.feedbackLog].reverse().slice(0, 40),
    }
  }

  // ---------- Ansicht ----------
  snapshot() {
    const st = this.standings()
    const avg = this.L / this.track.lapRef
    const leader = st[0]
    const rows = st.map((c, i) => {
      let gap = ''
      if (c.status === 'fin') gap = 'ZIEL'
      else if (c.status === 'out') gap = 'OUT'
      else if (c.status === 'dsq') gap = 'DSQ'
      else if (i > 0 && this.raceStart !== null) {
        const prev = st[i - 1]
        const dd = prev.dist - c.dist
        gap = dd >= this.L ? `+${Math.floor(dd / this.L)} L` : `+${(dd / avg).toFixed(1)}`
        if (prev.status !== 'run' && prev.status !== 'stopped' && prev.status !== 'fin') gap = ''
      }
      return {
        id: c.id,
        pos: i + 1,
        code: c.code,
        name: c.name,
        num: c.num,
        color: c.color,
        status: c.status,
        penaltySec: c.penaltySec,
        warnings: c.warnings,
        serving: !!(c.pending || c.serve),
        gap,
      }
    })
    let results = null
    if (this.state === 'FINISHED') {
      const fin = this.cars.filter((c) => c.status === 'fin').map((c) => ({ ...c, adj: c.finishTime + c.penaltySec }))
      fin.sort((a, b) => a.adj - b.adj)
      results = fin.map((c, i) => ({
        pos: i + 1, code: c.code, name: c.name, team: c.team, color: c.color, num: c.num,
        penaltySec: c.penaltySec,
        time: i === 0 ? lapFmt(c.adj) : `+${(c.adj - fin[0].adj).toFixed(3)}`,
        best: c.bestLap ? lapFmt(c.bestLap) : '-',
      }))
      for (const c of this.cars.filter((c) => c.status === 'out' || c.status === 'dsq')) {
        results.push({ pos: results.length + 1, code: c.code, name: c.name, team: c.team, color: c.color, num: c.num, penaltySec: 0, time: c.status === 'dsq' ? 'DSQ' : 'DNF', best: c.bestLap ? lapFmt(c.bestLap) : '-' })
      }
    }
    return {
      t: this.t,
      raceTime: this.raceStart === null ? 0 : this.t - this.raceStart,
      lights: this.lightsOn(),
      stalled: this.cars.filter((c) => c.stalled).map((c) => c.name),
      state: this.state,
      lap: leader ? this.lapNo(leader) : 1,
      laps: this.laps,
      sectors: [...this.sectors],
      rows,
      incidents: this.incidents.map((i) => ({ ...i })),
      messages: this.messages.slice(-60),
      radio: this.radioLog.slice(-40),
      safety: this.safety,
      fairness: this.fairness,
      scEnding: this.scEnding,
      vscEnding: !!this.vscEndAt,
      restartIn: this.state === 'RESTART' ? Math.max(0, Math.ceil(this.restartAt - this.t)) : 0,
      results,
      feedback: this.feedback.slice(-3),
      flow: this.flow,
      weather: {
        rain: this.rain,
        wet: this.wet,
        phase: this.rainPhase,
        forecast: this.rainPlan && this.t < this.rainPlan.start ? Math.max(0, this.rainPlan.start - this.t) : null,
      },
      report: this.report(),
      track: { name: this.track.name, gp: this.track.gp },
    }
  }
}

export const lapFmt = (t) => {
  const m = Math.floor(t / 60)
  const s = (t - m * 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}
export const clockStr = (t) => {
  const s = Math.floor(15 * 3600 + t)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`
}
export const raceTimeStr = (t) => {
  const s = Math.floor(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${Math.floor(s / 60)}:${p(s % 60)}`
}

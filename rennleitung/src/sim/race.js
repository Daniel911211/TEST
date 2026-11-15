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
  grid3: { key: 'grid3', label: '3 Startplätze zurück', sev: 2, tone: 'bad' },
}
export const OPTION_LIST = Object.values(OPTIONS)

export const RULES = {
  trackLimits:
    'Die weiße Linie gehört zur Strecke. Ein Verstoß liegt erst vor, wenn alle vier Räder jenseits der Linie sind.\n• Ein Reifen berührt die Linie noch: kein Vergehen\n• Erster Verstoß ohne klaren Vorteil: Rundenzeit streichen\n• Wiederholung oder mehr als 0,2 s Zeitgewinn: Streichen + 5 Sekunden',
  trackLimitsQuali:
    'Die weiße Linie gehört zur Strecke. Ein Verstoß liegt erst vor, wenn alle vier Räder jenseits der Linie sind.\n• Ein Reifen berührt die Linie noch: kein Vergehen\n• Verstoß: Die Rundenzeit wird gestrichen',
  collision:
    'Entscheidend ist der Einlenkpunkt: Wo ist die Vorderachse des Angreifers (innen)?\n• Auf Höhe der Spiegel des Verteidigers oder weiter vorn: Der Angreifer hat Anspruch auf Platz. Lenkt der Verteidiger trotzdem ein, ist er schuld\n• Hinter den Spiegeln: Der Angreifer ist schuld\n• Nur knapp auf Höhe: Rennunfall, keine Strafe\nStrafe für den Schuldigen: 5 Sekunden, wenn beide weiterfahren. 10 Sekunden, wenn ein Auto ausfällt.',
  unsafeRelease:
    'Ein Auto darf nicht in den Weg eines anderen freigegeben werden. Maßstab ist, wie stark das andere Auto bremsen muss.\n• Weniger als 10 km/h: keine Strafe\n• 10 bis 30 km/h: Verwarnung\n• Mehr als 30 km/h: 5 Sekunden',
  overtakeYellow:
    'Unter Gelb, VSC und Safety Car ist Überholen verboten.\n• Gelb oder VSC: 5 Sekunden\n• Doppelgelb oder Safety Car: 10 Sekunden\n• Ausnahme: Das überholte Auto ist offensichtlich langsam oder defekt. Dann keine Strafe',
  gridPosition:
    'Die Vorderreifen müssen hinter der weißen Linie der Startbox stehen.\n• Reifen berührt die Linie nur: keine Strafe\n• Reifen steht über der Linie: 5 Sekunden',
  jumpStart:
    'Kein Auto darf sich bewegen, bevor die Lichter ausgehen.\n• Zucken, ohne den Sensor auszulösen: keine Strafe\n• Sensor ausgelöst: 5 Sekunden\n• Klar vor dem Signal losgefahren: Durchfahrtsstrafe',
  pitSpeed:
    'In der Boxengasse gilt Tempo 80.\n• Bis 80,0 km/h: keine Strafe\n• Bis 10 km/h zu schnell: 5 Sekunden\n• Mehr als 10 km/h zu schnell: 10 Sekunden',
  pitClosed:
    'Bei roter Boxenampel darf niemand einfahren.\n• Einfahrt ohne Schaden: 10 Sekunden Stop & Go\n• Ausnahme: Ein beschädigtes Auto kommt zur Reparatur. Dann keine Strafe',
  blueFlags:
    'Überrundete müssen das schnellere Auto bei der ersten Gelegenheit vorbeilassen.\n• Bis 3 Posten mit blauer Flagge: keine Strafe\n• 4 bis 5 Posten: Verwarnung\n• Mehr als 5 Posten: 5 Sekunden',
  forcingOff:
    'Wer außen am Scheitelpunkt mit der Vorderachse gleichauf ist, hat am Kurvenausgang Anspruch auf eine Wagenbreite (2,0 m) Platz.\n• Gleichauf und weniger als 2,0 m Platz: 5 Sekunden\n• Nicht gleichauf: keine Strafe, der Verteidiger darf die ganze Strecke nutzen\n• Genug Platz gelassen: keine Strafe',
  weaving:
    'Beim Verteidigen ist ein einziger Richtungswechsel erlaubt, und nur vor dem Bremspunkt.\n• Ein Wechsel vor dem Bremspunkt: keine Strafe\n• Zweiter Wechsel: Verwarnung\n• Wechsel in der Bremszone, der Hintermann muss ausweichen: 5 Sekunden',
  cutChicane:
    'Wer abkürzt, darf daraus keinen dauerhaften Vorteil ziehen.\n• Position gewonnen und behalten: 5 Sekunden\n• Position zurückgegeben: keine Strafe\n• Nur Zeit gewonnen: Verwarnung\n• Zeit verloren: keine Strafe',
  scGap:
    'Hinter dem Safety Car sind höchstens 10 Wagenlängen Abstand zum Vordermann erlaubt.\n• Bis 10 Wagenlängen: keine Strafe\n• 11 bis 20 Wagenlängen: Verwarnung\n• Mehr als 20 Wagenlängen: 5 Sekunden\n• Ausnahme: Sind die Lichter des Safety Cars aus, bestimmt der Führende das Tempo',
  impeding:
    'Wer langsam fährt, muss die Ideallinie für Autos auf schneller Runde freimachen. Maßstab ist der Zeitverlust.\n• Weniger als 0,1 s: keine Strafe\n• 0,1 bis 0,3 s: Verwarnung\n• Mehr als 0,3 s: 3 Startplätze zurück',
}

export const TYPE_TITLE = {
  impeding: 'Behindern im Qualifying',
  blueFlags: 'Blaue Flaggen ignoriert',
  forcingOff: 'Abdrängen',
  weaving: 'Spurwechsel beim Verteidigen',
  cutChicane: 'Abkürzen der Strecke',
  scGap: 'Abstand hinter dem Safety Car',
  pitClosed: 'Einfahrt bei gesperrter Boxengasse',
  protest: 'Protest',
  pitSpeed: 'Tempo in der Boxengasse',
  jumpStart: 'Frühstart',
  gridPosition: 'Falsche Startposition',
  overtakeYellow: 'Überholen unter Gelb',
  collision: 'Kollision',
  unsafeRelease: 'Unsichere Freigabe',
  trackLimits: 'Track Limits',
  hazard: 'Auto steht auf der Strecke',
}

// Reifen: base = Tempo im Trockenen, life = Haltbarkeit als Anteil der Renndistanz
export const TYRES = {
  S: { name: 'Soft', color: '#ff3b3b', base: 1.0, life: 0.36 },
  M: { name: 'Medium', color: '#ffd21f', base: 0.994, life: 0.58 },
  H: { name: 'Hard', color: '#f2f2f2', base: 0.989, life: 0.9 },
  I: { name: 'Intermediate', color: '#3fd65a', base: 0.93, life: 0.7 },
  W: { name: 'Regen', color: '#3b8bff', base: 0.885, life: 0.9 },
}
const isWetTyre = (k) => k === 'I' || k === 'W'

// Schwierigkeit: Häufigkeit der Vorfälle, Frist je Fall, gleichzeitig offene Fälle, Gewicht von Fehlurteilen
export const DIFFS = {
  easy: { label: 'Einsteiger', rate: 0.6, deadline: 180, open: 2, pen: 0.7, hint: true },
  normal: { label: 'Normal', rate: 1, deadline: 110, open: 4, pen: 1, hint: false },
  hard: { label: 'Profi', rate: 1.5, deadline: 70, open: 6, pen: 1.3, hint: false },
}

export const sectorOf = (s, L) => Math.min(2, Math.floor(s / (L / 3)))
const mod = (x, L) => ((x % L) + L) % L

export class Race {
  constructor(trackKey, laps = 10, opts = {}) {
    this.diffKey = DIFFS[opts.diff] ? opts.diff : 'normal'
    this.diff = DIFFS[this.diffKey]
    // Qualifying: alle Autos fahren verteilt über die Strecke drei gezeitete Runden, die beste zählt
    this.quali = opts.session === 'quali'
    if (this.quali) laps = 3
    const grid = !this.quali && Array.isArray(opts.grid) && opts.grid.length === DRIVERS.length ? opts.grid : null
    const qOrder = DRIVERS.map((_, i) => i).sort(() => Math.random() - 0.5)
    const startDist = (i) => (this.quali ? -((qOrder.indexOf(i) + 0.5) * this.track.length) / DRIVERS.length : -(12 + (grid ? grid.indexOf(i) : i) * 8))
    const startLat = (i) => (this.quali ? 0 : (grid ? grid.indexOf(i) : i) % 2 ? 0.9 : -0.9)
    this.track = buildTrack(trackKey)
    this.L = this.track.length
    // Flaggenposten: etwa alle 280 m, auf der Seite gegenüber der Boxengasse
    const nPosts = Math.round(this.L / 280)
    this.posts = Array.from({ length: nPosts }, (_, i) => ({ no: i + 1, s: ((i + 0.5) * this.L) / nPosts, lat: -this.track.pit.side * 2.7 }))
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
    // Streckensicherung: manuell oder automatisch. actor sagt, wer gerade handelt ('du' oder 'auto').
    this.auto = false
    this.actor = 'du'
    this.ad = { clearAt: null, secClearAt: [null, null, null], rainAt: null, rainOn: false, note: '' }
    this.flow = 100
    // Funk
    this.radioQueue = []
    this.pitClosed = false
    this.protestQueue = []
    this.medReadyAt = 0
    this.usedLines = {}
    this.nextAmbient = rnd(15, 30)
    this.dangerT = 0
    this.scIdleT = 0
    // Wetter: mit 55 % Wahrscheinlichkeit zieht ein Schauer durch
    const dur = laps * this.track.lapRef
    this.rain = 0
    this.wet = 0
    this.rainPlan = !this.quali && Math.random() < 0.55 ? { start: rnd(0.15, 0.6) * dur, dur: rnd(90, 240), peak: rnd(0.35, 1) } : null
    this.rainPhase = 'dry'
    this.raceDist = laps * this.L
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
      dist: startDist(i),
      slot: startDist(i),
      slotLat: startLat(i),
      onGrid: !this.quali,
      lapTimes: [],
      gridDrop: 0,
      stalled: false,
      speed: 0,
      lat: startLat(i),
      latTarget: startLat(i),
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
      ...(() => { const t = pick(['M', 'M', 'M', 'M', 'M', 'S', 'S', 'S', 'H', 'H']); return { tyre: t, usedDry: [t] } })(),
      wear: 0,
      usedWet: false,
      stops: 0,
      pitAt: rnd(0.72, 0.95),
      mustAt: rnd(1.15, 2.2), // spätester Pflichtstopp, in Runden vor Rennende
      wetThr: rnd(0.2, 0.4),
      dryThr: rnd(0.08, 0.16),
      pit: null,
      bestLap: null,
      lapDirty: false,
    }))
    this.teams = [...new Set(this.cars.map((c) => c.team))]
    // Arztwagen (Medical Car): steht beim Start hinter dem Feld, folgt ihm in der Einführungsrunde und in
    // Runde 1 und fährt danach auf seinen Parkplatz neben dem Safety Car. null = geparkt.
    this.med = this.quali ? null : { dist: -(12 + (this.cars.length - 1) * 8) - 22, speed: 0, lat: 0, gap: 22, pitU: null, shift: 0 }
    this.msg('FELD STEHT IN DER STARTAUFSTELLUNG')
  }

  // ---------- Hilfsfunktionen ----------
  msg(text, level = 'info') {
    // einheitliche Schreibweise: Punkt als Trenner, neue Fälle mit ihrer Nummer
    text = text.replace(' - WIRD UNTERSUCHT', ` - FALL ${String(this.caseNo).padStart(2, '0')}`).replace(/ - /g, ' · ')
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
    this.feedbackLog.push({ t: this.t, text, delta: Math.round(delta), by: 'du' })
  }
  // Eingriff der Streckensicherung fürs Protokoll, mit Vermerk, wer ihn ausgelöst hat
  logAction(text) {
    this.feedbackLog.push({ t: this.t, text, delta: 0, by: this.actor, safety: true })
  }
  // Im Automatik-Modus sind die Bedienelemente der Streckensicherung für den Spieler gesperrt
  // Was ein Flaggenposten gerade zeigt: flag = Flagge, waved = geschwenkt, board = Tafel (SC / VSC)
  postFlag(p) {
    const L = this.L
    if (this.state === 'RED' || this.state === 'RESTART') return { flag: 'red', waved: true, board: null }
    if (this.chequered) return p.no === this.posts.length ? { flag: 'chq', waved: true, board: null } : { flag: null, waved: false, board: null }
    if (!['GREEN', 'VSC', 'SC'].includes(this.state)) return { flag: null, waved: false, board: null }
    const board = this.state === 'SC' ? 'SC' : this.state === 'VSC' ? 'VSC' : null
    const sec = this.sectors[sectorOf(p.s, L)]
    let flag = sec === 'double' ? 'double' : sec === 'yellow' || board === 'SC' ? 'yellow' : null
    let waved = false
    if (flag) {
      for (const c of this.cars) {
        if (c.status !== 'stopped') continue
        // Der Posten direkt vor der Gefahrenstelle schwenkt, der erste dahinter zeigt Grün
        if (mod(c.dist - p.s, L) < 300) waved = true
        else if (mod(p.s - c.dist, L) < L / this.posts.length && !board) flag = 'green'
      }
    }
    // Blaue Flagge: ein Überrundeter am Posten, der Schnellere dicht dahinter
    if (!flag && this.state === 'GREEN') {
      for (const b of this.order) {
        if (b.status !== 'run' || b.pit || Math.abs(mod(b.dist - p.s + L / 2, L) - L / 2) > 140) continue
        if (this.order.some((a) => a !== b && a.status === 'run' && !a.pit && a.dist - b.dist > L * 0.5 && mod(b.dist - a.dist, L) < 70)) { flag = 'blue'; waved = true; break }
      }
    }
    return { flag, waved, board }
  }
  locked() {
    return this.auto && this.actor !== 'auto'
  }
  tag(c) {
    return c.last.toUpperCase()
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
  startQuali() {
    if (!this.quali || this.state !== 'GRID') return
    this.state = 'GREEN'
    this.raceStart = this.t
    this.nextAmbient = this.t + rnd(15, 30)
    for (const c of this.cars) {
      c.lapStart = this.t
      c.speed = this.track.v[Math.floor(mod(c.dist, this.L) / this.track.ds) % this.track.n] * 0.85
    }
    this.msg('QUALIFYING LÄUFT - DREI GEZEITETE RUNDEN, DIE BESTE ZÄHLT', 'flag')
  }
  startFormation() {
    if (this.quali) return
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
    // Der Arztwagen fährt die Einführungsrunde hinter dem Feld mit
    if (this.med && this.med.pitU == null) this.med.dist -= this.L
    this.msg(this.formations > 1 ? 'ZUSÄTZLICHE EINFÜHRUNGSRUNDE GESTARTET' : 'EINFÜHRUNGSRUNDE GESTARTET', 'flag')
    this.radioQueue.push({ at: this.t + 12, key: 'formation' }, { at: this.t + 30, key: 'formation' })
  }
  // 2) Startampel: fünf rote Lichter, dann gehen sie nach zufälliger Wartezeit aus
  startLights() {
    if (this.state !== 'GRIDREADY') return
    if (this.medReadyAt && this.t < this.medReadyAt) {
      this.safety = clamp(this.safety - 12, 0, 100)
      this.logEvent('Start ohne bereiten Arztwagen', -12)
      this.msg('START OHNE BEREITEN ARZTWAGEN', 'bad')
      this.medReadyAt = 0
    }
    this.state = 'LIGHTS'
    this.lightsAt = this.t
    this.lightsOutAt = this.t + 5 + rnd(0.5, 2.3)
    this.jump = Math.random() < 0.3 ? { car: pick(this.cars.filter((c) => c.status === 'run' && !c.stalled)), kind: pick(['twitch', 'roll', 'roll', 'clear']), done: false } : null
    this.msg('STARTAMPEL LÄUFT', 'warn')
  }
  // Start abbrechen: zusätzliche Einführungsrunde, Renndistanz minus eine Runde
  abortStart() {
    if (this.state !== 'GRIDREADY') return
    const stalled = this.cars.filter((c) => c.stalled)
    if (!stalled.length) this.flow = clamp(this.flow - 8, 0, 100)
    else this.logEvent('Start abgebrochen, weil ein Auto stehen blieb', 0)
    this.msg('START ABGEBROCHEN - NEUE EINFÜHRUNGSRUNDE, RENNEN EINE RUNDE KÜRZER', 'bad')
    this.laps = Math.max(1, this.laps - 1)
    let back = Math.min(...this.cars.filter((c) => c.status === 'run').map((c) => c.slot))
    for (const c of stalled) {
      c.stalled = false
      back -= 8
      c.slot = back
      this.msg(`${this.tag(c)} - IN DIE BOXENGASSE GESCHOBEN, STARTET VON HINTEN`, 'info')
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
    this.raceDist = this.laps * this.L
    if (this.rainPlan) this.rainPlan.start += this.t
    this.nextAmbient = this.t + rnd(15, 30)
    this.msg('LICHTER AUS - DAS RENNEN LÄUFT', 'flag')
    if (this.med) this.msg('ARZTWAGEN FOLGT DEM FELD IN RUNDE 1', 'info')
    this.radioQueue.push({ at: this.t + 6, key: 'start' }, { at: this.t + 11, key: 'start' })
    for (const c of this.cars) {
      c.lapStart = this.t
      c.onGrid = false
      if (c.stalled) {
        c.stalled = false
        this.stopCar(c, 'MOTOR ABGEWÜRGT')
        this.safety = clamp(this.safety - 15, 0, 100)
        this.logEvent(`Start trotz stehendem Auto (${c.last})`, -15)
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
      this.msg(`${this.tag(c)} - FRÜHSTART - WIRD UNTERSUCHT`, 'warn')
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
      inc.tip = 'Tipp: Spule ans Ende, zoome hinein und prüfe, ob ein Vorderreifen über der weißen Linie steht.'
      inc.statements = [{ code: c.code, text: pick(['Ich sehe die Linie aus dem Cockpit nicht. Niemand sieht die.', 'Ich stand perfekt. Glaube ich.']) }]
      inc.replay = { kind: 'grid', over }
      inc.expert = over > 0.03 ? `Experten: Vorderreifen ${over.toFixed(2)} m über der Linie. 5 Sekunden.` : `Experten: Reifen noch ${Math.abs(over).toFixed(2)} m hinter der Linie, keine Strafe.`
      this.incidents.push(inc)
      this.msg(`${this.tag(c)} - FALSCHE STARTPOSITION - WIRD UNTERSUCHT`, 'warn')
      c.gridOver = 0
    }
  }

  // ---------- Automatische Streckensicherung ----------
  // Übernimmt Flaggen, VSC, Safety Car, Rote Flagge und den Neustart nach Rot.
  // Start und Fälle bleiben beim Spieler. Die Automatik reagiert wie ein Mensch:
  // mit ein paar Sekunden Verzögerung und gelegentlich mit einer Fehleinschätzung.
  setAuto(on) {
    if (this.auto === !!on) return
    this.auto = !!on
    this.ad = { clearAt: null, secClearAt: [null, null, null], rainAt: null, rainOn: false, note: '' }
    for (const c of this.cars) if (c.haz) c.haz.seenAt = null
    this.msg(on ? 'AUTOMATIK ÜBERNIMMT DIE STRECKENSICHERUNG' : 'STRECKENSICHERUNG WIEDER MANUELL', 'info')
  }
  autoDirector() {
    if (!this.auto) return
    const st = this.state
    if (!['GREEN', 'VSC', 'SC', 'RED'].includes(st) || this.chequered) {
      this.ad.note = st === 'RESTART' ? 'Neustart läuft' : this.chequered ? 'Rennen ist abgewinkt' : 'wartet auf den Start'
      return
    }
    this.actor = 'auto'
    try {
      this.autoThink(st, this.ad)
    } finally {
      this.actor = 'du'
    }
  }
  autoThink(st, A) {
    const L = this.L
    const stopped = this.cars.filter((c) => c.status === 'stopped')
    const flags = [0, 0, 0] // gewünschte Flagge je Sektor: 1 = Gelb, 2 = Doppelgelb
    let want = 0 // gewünschte Neutralisierung: 2 = VSC, 3 = Safety Car, 4 = Rot
    let pending = 0
    for (const c of stopped) {
      const h = c.haz
      const need = { rand: 1, teil: 2, linie: 3 }[h.pos]
      if (h.seenAt == null) {
        // Meldung der Streckenposten braucht ein paar Sekunden; die Einschätzung liegt manchmal eine Stufe daneben
        h.seenAt = this.t + rnd(2, 6)
        const r = Math.random()
        h.plan = clamp(need + (r < 0.14 ? -1 : r > 0.9 ? 1 : 0), 1, 3)
        h.reviewAt = h.seenAt + rnd(14, 28)
      }
      if (this.t < h.seenAt) { pending++; continue }
      // Arzt angefordert: Arztwagen losschicken und die Stelle entsprechend hoch absichern
      const med = h.medical && h.medical.state !== 'done' ? h.medical : null
      if (med) {
        if (med.state === 'needed' && this.t >= h.seenAt + 1.5) this.sendMedical(c.id)
        h.plan = Math.max(h.plan, 3)
        if (med.heavy) want = 4
      }
      // Zu schwach abgesichert: nach einer Weile wird nachgebessert
      if (this.t >= h.reviewAt && h.plan < need) h.plan = need
      const sec = sectorOf(mod(c.dist, L), L)
      flags[sec] = Math.max(flags[sec], h.plan >= 2 ? 2 : 1)
      if (h.plan >= 2) want = Math.max(want, h.plan)
    }
    const seen = stopped.length - pending
    // Boxengasse sperren, solange ein gemeldetes Auto im Bereich der Einfahrt steht
    const wantClosed = stopped.some((c) => c.haz.nearPit && this.t >= c.haz.seenAt)
    if (st !== 'RED' && wantClosed !== this.pitClosed && (wantClosed || A.closedPit)) { this.togglePit(); A.closedPit = wantClosed }
    // Massenunfall: drei oder mehr Autos, die geborgen werden müssen (Dreher fahren selbst weiter)
    if (stopped.filter((c) => !c.haz.self && this.t >= c.haz.seenAt).length >= 3) want = 4
    // Starkregen: erst Safety Car, bei Aquaplaning Abbruch
    if (this.wet > 0.78) {
      if (A.rainAt == null) A.rainAt = this.t + rnd(4, 10)
      if (this.t >= A.rainAt) A.rainOn = true
    } else {
      A.rainAt = null
      if (this.wet < 0.6) A.rainOn = false
    }
    if (A.rainOn) want = Math.max(want, this.wet > 0.93 ? 4 : 3)
    if (this.quali) want = 0 // im Qualifying nur Flaggen

    // Absichern und hochstufen
    if (st !== 'RED') {
      for (let k = 0; k < 3; k++) {
        const cur = this.sectors[k] === 'double' ? 2 : this.sectors[k] === 'yellow' ? 1 : 0
        if (flags[k] > cur) this.setSector(k, flags[k] === 2 ? 'double' : 'yellow')
      }
    }
    if (want === 4 && st !== 'RED') this.callRed()
    else if (want === 3 && (st === 'GREEN' || st === 'VSC')) this.callSC()
    else if (want === 3 && st === 'SC' && this.scEnding) this.scStayOut()
    else if (want === 2 && st === 'GREEN') this.callVSC()
    else if (want === 2 && st === 'VSC' && this.vscEndAt) {
      this.vscEndAt = null
      this.logAction('VSC bleibt aktiv')
      this.msg('VSC BLEIBT AKTIV', 'warn')
    }

    // Freigeben, wenn nichts mehr zu sichern ist (manchmal trödelt die Automatik dabei)
    // Unter Rot zählen nur Autos, die geborgen werden müssen: gedrehte Autos fahren erst nach dem Neustart weiter
    const toRecover = stopped.filter((c) => !c.haz.self).length
    const calm = !this.medOnTrack() && (this.state === 'RED' ? toRecover === 0 && !A.rainOn : stopped.length === 0 && want === 0)
    if (calm && this.state !== 'GREEN') {
      if (A.clearAt == null) A.clearAt = this.t + rnd(2, 5) + (Math.random() < 0.15 ? rnd(8, 15) : 0)
      if (this.t >= A.clearAt) {
        if (this.state === 'VSC') this.endVSC()
        else if (this.state === 'SC') {
          // erst die Überrundeten vorbeilassen, dann das Safety Car reinholen
          if (this.sc && this.sc.collected && !this.unlapUsed && this.lappedCars().length) this.letLappedPass()
          else if (!this.cars.some((c) => c.unlap)) this.scInThisLap()
        }
        else if (this.state === 'RED') this.restart()
      }
    } else A.clearAt = null
    if (this.state === 'GREEN') {
      for (let k = 0; k < 3; k++) {
        const busy = flags[k] > 0 || stopped.some((c) => sectorOf(mod(c.dist, L), L) === k)
        if (this.sectors[k] !== 'green' && !busy) {
          if (A.secClearAt[k] == null) A.secClearAt[k] = this.t + rnd(2, 5)
          else if (this.t >= A.secClearAt[k]) { this.setSector(k, 'green'); A.secClearAt[k] = null }
        } else A.secClearAt[k] = null
      }
    }

    A.note = pending
      ? 'prüft eine Meldung der Streckenposten'
      : this.state === 'RED'
        ? calm ? 'bereitet den Neustart vor' : 'Rennen unterbrochen, Bergung läuft'
        : seen
          ? `sichert ${seen === 1 ? 'eine Stelle' : seen + ' Stellen'} ab`
          : A.rainOn
            ? 'neutralisiert wegen Regen'
            : this.state !== 'GREEN'
              ? 'gibt die Strecke wieder frei'
              : 'Strecke frei, beobachtet'
  }

  cycleSector(i) {
    if (this.state === 'GRID' || this.state === 'FINISHED' || this.locked()) return
    const order = ['green', 'yellow', 'double']
    const next = order[(order.indexOf(this.sectors[i]) + 1) % 3]
    this.setSector(i, next)
  }
  setSector(i, flag, internal = false) {
    if (this.sectors[i] === flag) return
    if (!internal && this.locked()) return
    this.sectors[i] = flag
    if (!internal && flag !== 'green') this.logAction(`Sektor ${i + 1}: ${flag === 'yellow' ? 'Gelb' : 'Doppelgelb'}`)
    const name = flag === 'green' ? 'FREI' : flag === 'yellow' ? 'GELBE FLAGGE' : 'DOPPELT GELB'
    this.msg(`SEKTOR ${i + 1} - ${name}`, flag === 'green' ? 'ok' : 'warn')
    if (flag !== 'green' && this.state === 'GREEN' && !this.cars.some((c) => c.status === 'stopped' && sectorOf(mod(c.dist, this.L), this.L) === i)) {
      this.radioQueue.push({ at: this.t + rnd(4, 9), key: 'yellowNoReason' })
    }
  }
  allGreen(internal = false) {
    if (!internal && this.locked()) return
    for (let i = 0; i < 3; i++) this.setSector(i, 'green', true)
  }

  callVSC() {
    if (this.quali) return this.msg('KEIN SAFETY CAR IM QUALIFYING - MIT GELB SICHERN', 'info')
    if (this.state !== 'GREEN' || this.locked()) return
    this.logAction('VSC ausgelöst')
    this.state = 'VSC'
    this.vscEndAt = null
    if (!this.cars.some((c) => c.status === 'stopped') && this.wet < 0.6) this.flow = clamp(this.flow - 2, 0, 100)
    this.msg('VIRTUELLES SAFETY CAR (VSC) AKTIV', 'warn')
    this.reactRadio('vsc')
  }
  endVSC() {
    if (this.state !== 'VSC' || this.vscEndAt || this.locked()) return
    this.logAction('VSC beendet')
    this.vscEndAt = this.t + 8
    this.msg('VSC ENDET GLEICH', 'warn')
  }
  callSC() {
    if (this.quali) return this.msg('KEIN SAFETY CAR IM QUALIFYING - MIT GELB SICHERN', 'info')
    if ((this.state !== 'GREEN' && this.state !== 'VSC') || this.locked()) return
    this.logAction('Safety Car gerufen')
    const lead = this.standings().find((c) => c.status === 'run')
    this.state = 'SC'
    this.vscEndAt = null
    this.scEnding = false
    if (!this.cars.some((c) => c.status === 'stopped') && this.wet < 0.6) this.flow = clamp(this.flow - 4, 0, 100)
    // Das Safety Car fährt sofort vom Parkplatz los, egal wo das Feld gerade ist. Grüne Lichter heißen:
    // Es sammelt noch ein und winkt alle außer dem Führenden vorbei. Orange heißt: Überholverbot.
    this.sc = { dist: 0, speed: 0, lat: 0, lights: 'green', collected: false, leaving: false, pitU: this.parkU(), shift: 1 }
    this.unlapUsed = false
    this.msg('SAFETY CAR IM EINSATZ', 'warn')
    this.reactRadio('sc')
  }
  // Überrundete Autos im Feld hinter dem Safety Car: mindestens eine Runde hinter dem Führenden
  lappedCars() {
    const lead = this.order.find((c) => c.status === 'run')
    if (!lead) return []
    return this.order.filter((c) => c.status === 'run' && !c.pit && c !== lead && lead.dist - c.dist >= this.L * 0.99)
  }
  // Zurückrunden: Überrundete dürfen das Feld und das Safety Car überholen, fahren eine Runde herum
  // und reihen sich hinten ein. Danach stehen beim Neustart keine Überrundeten mehr zwischen den Führenden.
  letLappedPass() {
    if (this.state !== 'SC' || !this.sc || !this.sc.collected || this.sc.leaving || this.unlapUsed || this.locked()) return
    const cars = this.lappedCars()
    if (!cars.length) return
    this.unlapUsed = true
    for (const c of cars) c.unlap = true
    this.logAction(`Überrundete vorbeigelassen (${cars.length})`)
    this.msg(`ÜBERRUNDETE DÜRFEN VORBEI: ${cars.map((c) => c.code).join(', ')}`, 'warn')
    this.fairness = clamp(this.fairness + 2, 0, 100)
  }
  // Boxeneinfahrt sperren oder öffnen (rote Ampel an der Einfahrt)
  togglePit() {
    if (!['GREEN', 'VSC', 'SC', 'RED'].includes(this.state) || this.locked()) return
    this.pitClosed = !this.pitClosed
    this.logAction(this.pitClosed ? 'Boxengasse gesperrt' : 'Boxengasse geöffnet')
    this.msg(this.pitClosed ? 'BOXENGASSE GESPERRT' : 'BOXENGASSE WIEDER OFFEN', this.pitClosed ? 'warn' : 'ok')
  }
  // Das Safety Car bleibt doch draußen, weil es eine neue Gefahr gibt
  scStayOut() {
    if (this.state !== 'SC' || !this.scEnding || !this.sc || this.sc.leaving || this.locked()) return
    this.scEnding = false
    this.sc.lights = this.sc.collected ? 'orange' : 'green'
    this.logAction('Safety Car bleibt draußen')
    this.msg('SAFETY CAR BLEIBT DRAUSSEN - LICHTER AN', 'warn')
  }
  // Das Safety Car ist gerufen, aber noch nicht auf der Strecke
  scExiting() {
    return !!(this.sc && this.sc.pitU != null && !this.sc.leaving)
  }
  scInThisLap() {
    if (this.state !== 'SC' || this.scEnding || this.locked()) return
    this.logAction(this.scExiting() ? 'Safety Car zurückgerufen' : 'Safety Car reingeholt')
    // Ist das Safety Car noch in der Boxengasse, kehrt es um und das Rennen ist sofort wieder frei
    if (this.scExiting()) {
      this.sc = null
      this.scEnding = false
      this.state = 'GREEN'
      this.msg('SAFETY CAR ZURÜCKGERUFEN - GRÜNE FLAGGE', 'ok')
      if (this.cars.some((c) => c.status === 'stopped')) {
        this.safety = clamp(this.safety - 12, 0, 100)
        this.msg('ACHTUNG - ES STEHT NOCH EIN AUTO AUF DER STRECKE', 'bad')
      } else this.allGreen(true)
      return
    }
    this.scEnding = true
    if (this.sc) this.sc.lights = false
    this.msg('SAFETY CAR KOMMT DIESE RUNDE REIN - LICHTER AUS', 'warn')
    if (this.cars.some((c) => c.status === 'stopped')) {
      this.safety = clamp(this.safety - 12, 0, 100)
      this.msg('ACHTUNG - ES STEHT NOCH EIN AUTO AUF DER STRECKE', 'bad')
    }
  }
  callRed() {
    if (this.quali) return this.msg('KEINE ROTE FLAGGE IM QUALIFYING - GELB GENÜGT', 'info')
    if (!['GREEN', 'VSC', 'SC'].includes(this.state) || this.locked()) return
    this.logAction('Rote Flagge')
    this.state = 'RED'
    if (this.wet < 0.75) this.flow = clamp(this.flow - 6, 0, 100)
    this.sc = null
    this.scEnding = false
    this.vscEndAt = null
    this.msg('ROTE FLAGGE - RENNEN UNTERBROCHEN', 'bad')
    this.reactRadio('red')
  }
  restart() {
    if (this.state !== 'RED' || this.locked()) return
    const run = this.standings().filter((c) => c.status === 'run' || c.status === 'stopped')
    const alive = run.filter((c) => c.status === 'run')
    if (!alive.length) return
    const lead = alive[0]
    const base = Math.ceil(lead.dist / this.L) * this.L - 10
    alive.forEach((c, i) => {
      c.dist = base - i * 8
      c.speed = 0
      c.lat = i % 2 ? 0.9 : -0.9
      c.latTarget = c.lat
      c.passing = null
      c.pit = null
      // Unter Rot dürfen die Reifen frei gewechselt werden
      const want = this.wet > 0.8 ? 'W' : this.wet > 0.25 ? 'I' : isWetTyre(c.tyre) || c.wear > 0.4 ? this.chooseDry(c, (this.laps * this.L - c.dist) / this.raceDist) : null
      if (want && want !== c.tyre) this.fitTyre(c, want)
    })
    this.logAction('Neustart nach Rot')
    this.allGreen(true)
    this.state = 'RESTART'
    this.restartAt = this.t + 6
    this.msg('NEUSTART IN 6 SEKUNDEN', 'warn')
    this.sayRandom('restart', 1)
  }

  // Strafen
  applyPenalty(car, key, reason) {
    const o = OPTIONS[key]
    const tag = this.tag(car)
    if (key === 'nfa') {
      this.msg(`${tag} - KEINE STRAFE (${reason})`, 'ok')
      return
    }
    if (key === 'grid3') {
      car.gridDrop += 3
      this.msg(`${tag} - 3 STARTPLÄTZE ZURÜCK (${reason})`, 'bad')
      return
    }
    if (key === 'lap' || key === 'lap5') {
      if (this.quali) {
        // die betroffene (beste) Runde fällt weg; läuft noch keine gewertete, zählt die aktuelle nicht
        if (car.lapTimes.length) car.lapTimes.splice(car.lapTimes.indexOf(Math.min(...car.lapTimes)), 1)
        else car.lapDirty = true
        car.bestLap = car.lapTimes.length ? Math.min(...car.lapTimes) : null
      }
      if (key === 'lap5') car.penaltySec += 5
      this.msg(`${tag} - RUNDENZEIT GESTRICHEN${key === 'lap5' ? ' + 5 SEKUNDEN ZEITSTRAFE' : ''} (${reason})`, key === 'lap5' ? 'bad' : 'warn')
      return
    }
    if (key === 'warn') {
      car.warnings++
      this.msg(`${tag} - VERWARNUNG (${reason})`, 'warn')
      return
    }
    if (key === 't5' || key === 't10') {
      const s = key === 't5' ? 5 : 10
      car.penaltySec += s
      this.msg(`${tag} - ${s} SEKUNDEN STRAFE (${reason})`, 'bad')
      return
    }
    if (key === 'black') {
      car.status = 'dsq'
      car.speed = 0
      this.msg(`${tag} - SCHWARZE FLAGGE, DISQUALIFIZIERT (${reason})`, 'bad')
      return
    }
    // Durchfahrt / Stop&Go: nur sinnvoll für fahrende Autos
    if (car.status !== 'run') {
      const s = key === 'dt' ? 20 : 30
      car.penaltySec += s
      this.msg(`${tag} - ${s} SEKUNDEN STRAFE STATT ${key === 'dt' ? 'DURCHFAHRT' : 'STOP & GO'} (${reason})`, 'bad')
      return
    }
    car.pending = key === 'dt' ? { type: 'dt', rem: 20 } : { type: 'sg', rem: 10 }
    this.msg(`${tag} - ${key === 'dt' ? 'DURCHFAHRTSSTRAFE' : '10 SEKUNDEN STOP & GO'} (${reason})`, 'bad')
  }

  penalizeCar(carId, key) {
    const c = this.cars[carId]
    if (!c || c.status === 'dsq' || c.status === 'fin') return
    this.applyPenalty(c, key, 'OHNE FALL')
    const o = OPTIONS[key]
    const dl = key === 'black' ? 30 : o.sev * 4
    this.fairness = clamp(this.fairness - dl, 0, 100)
    if (dl) this.logEvent(`Strafe ohne Fall für ${c.last} (${o.label})`, -dl)
    if (['t10', 'dt', 'sg'].includes(key)) this.protestQueue.push({ at: this.t + rnd(15, 35), car: c.id, opt: key, correct: false, no: 0 })
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
      // Begründung in Worten, damit nachvollziehbar ist, wie die Experten auf Schuld und Strafmaß kommen
      const why = inc.axle === 'ahead'
        ? `${a.code} war am Einlenkpunkt mit der Vorderachse auf Höhe der Spiegel und hatte Anspruch auf Platz, ${b.code} hat trotzdem eingelenkt`
        : `${a.code} lag am Einlenkpunkt mit der Vorderachse hinter den Spiegeln und hatte keinen Anspruch auf Platz`
      verdict = who
        ? `Experten: Schuld bei ${who}. ${why}. ${inc.outcome === 'none' ? 'Kein Ausfall: 5 Sek.' : 'Mit Ausfall: 10 Sek.'}`
        : 'Experten: Rennunfall, keine Strafe. Die Vorderachse war nur knapp auf Höhe der Spiegel.'
    } else {
      target = a
      delta = sev === inc.ideal.sev ? 6 : -Math.abs(sev - inc.ideal.sev) * 3.5
      verdict = inc.expert || ''
    }
    if (delta < 0) delta *= this.diff.pen
    this.fairness = clamp(this.fairness + delta, 0, 100)
    const fb = {
      id: `${inc.id}-${this.t}`,
      delta: Math.round(delta),
      text: `Fall ${String(inc.no).padStart(2, '0')} (${TYPE_TITLE[inc.type]}) ${delta > 0 ? 'richtig' : 'anders als die Experten'}`,
      verdict,
    }
    this.feedback.push(fb)
    this.logEvent(fb.text, delta)
    const reason = { impeding: 'BEHINDERN', blueFlags: 'IGNORIEREN BLAUER FLAGGEN', forcingOff: 'ABDRÄNGEN', weaving: 'UNERLAUBTER SPURWECHSEL', cutChicane: 'ABKÜRZEN MIT VORTEIL', scGap: 'ABSTAND HINTER DEM SAFETY CAR', pitClosed: 'EINFAHRT BEI GESPERRTER BOXENGASSE', pitSpeed: 'ZU SCHNELL IN DER BOXENGASSE', jumpStart: 'FRÜHSTART', gridPosition: 'FALSCHE STARTPOSITION', collision: 'VERURSACHEN EINER KOLLISION', unsafeRelease: 'UNSICHERE FREIGABE', overtakeYellow: 'ÜBERHOLEN UNTER GELB' }[inc.type] || 'TRACK LIMITS'
    if (target) {
      this.applyPenalty(target, opt, reason)
      // Gegen harte Strafen legt das Team oft Protest ein
      if (['t10', 'dt', 'sg'].includes(opt) && Math.random() < 0.45) this.protestQueue.push({ at: this.t + rnd(15, 35), car: target.id, opt, correct: delta > 0, no: inc.no })
      if (opt !== 'nfa') this.reactRadio('penalty', target, opt)
    } else {
      this.msg(`${this.tag(a)} / ${this.tag(b)} - RENNUNFALL, KEINE STRAFE`, 'ok')
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

  // Protest eines Teams: Entscheidung bestätigen oder Strafe zurücknehmen.
  // Richtig ist, eine korrekte Entscheidung zu bestätigen und eine überzogene zurückzunehmen.
  resolveProtest(incId, choice) {
    const inc = this.incidents.find((i) => i.id === incId && i.kind === 'protest' && i.status === 'open')
    if (!inc) return
    const c = this.cars[inc.carIds[0]]
    let delta
    if (choice === 'confirm') {
      delta = inc.correct ? 4 : -6
      this.msg(`PROTEST ABGEWIESEN - STRAFE FÜR ${this.tag(c)} BLEIBT`, 'info')
    } else {
      delta = inc.correct ? -8 : 5
      // Strafe rückgängig machen, soweit sie noch nicht abgesessen ist
      if (inc.opt === 't10') c.penaltySec = Math.max(0, c.penaltySec - 10)
      else if (c.pending && c.pending.type === inc.opt) c.pending = null
      this.msg(`PROTEST STATTGEGEBEN - STRAFE FÜR ${this.tag(c)} AUFGEHOBEN`, 'ok')
      this.say('nfaRelief', c, {}, { force: true })
    }
    this.fairness = clamp(this.fairness + delta, 0, 100)
    const text = `Protest ${c.last} ${choice === 'confirm' ? 'abgewiesen' : 'stattgegeben'}: ${delta > 0 ? 'richtig' : inc.correct ? 'die Strafe war korrekt' : 'die Strafe war überzogen'}`
    this.logEvent(text, delta)
    this.feedback.push({ id: `p${inc.id}-${this.t}`, delta, text, verdict: '' })
    inc.status = 'done'
    this.incidents = this.incidents.filter((i) => i.status === 'open')
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
        this.msg('FELD STEHT - BEREIT ZUM START', 'ok')
        // Gelegentlich ist der Arztwagen noch nicht bereit: Dann darf der Start noch nicht freigegeben werden
        this.medReadyAt = Math.random() < 0.12 ? this.t + rnd(12, 25) : 0
        if (this.medReadyAt) this.msg('ARZTWAGEN NOCH NICHT BEREIT - MIT DEM START WARTEN', 'bad')
        if (Math.random() < 0.18) {
          const c = pick(run)
          c.stalled = true
          this.msg(`${this.tag(c)} - MOTOR IN DER AUFSTELLUNG ABGEWÜRGT`, 'bad')
          this.say('stall', c, {}, { force: true })
        }
      }
    }
    if (this.state === 'GRIDREADY' && this.medReadyAt && this.t >= this.medReadyAt) {
      this.medReadyAt = 0
      this.msg('ARZTWAGEN BEREIT - START FREI', 'ok')
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
      this.msg('VSC BEENDET - GRÜNE FLAGGE', 'ok')
    }
    if (this.state === 'RESTART' && this.t >= this.restartAt) {
      this.state = 'GREEN'
      this.msg('LICHTER AUS - RENNEN WIEDER FREI', 'flag')
    }
    if (this.sc) {
      const sc = this.sc
      const lead = order.find((c) => c.status === 'run')
      const P = this.track.pit
      if (sc.pitU != null && !sc.leaving) {
        // Ausfahrt: vom Parkplatz in die Boxengasse und über die Boxenausfahrt auf die Strecke
        sc.speed += clamp(30 - sc.speed, -30 * dt, 12 * dt)
        sc.shift = Math.max(0, sc.shift - 1.5 * dt)
        sc.pitU += sc.speed * dt
        if (sc.pitU >= P.len) {
          sc.pitU = null
          // Physisch an der Boxenausfahrt; in der Distanzzählung liegt es damit vor dem Führenden
          const ld = lead ? lead.dist : 0
          sc.dist = ld + mod(mod(P.inS + P.span, this.L) - ld, this.L)
          sc.lat = P.side * 0.9
        }
      } else if (sc.pitU != null) {
        // zurück durch die Boxengasse auf den Parkplatz
        const rem = this.parkU() - sc.pitU
        sc.speed += clamp(Math.min(22, Math.sqrt(2 * 8 * Math.max(0, rem)) + 0.5) - sc.speed, -34 * dt, 12 * dt)
        sc.pitU = Math.min(this.parkU(), sc.pitU + sc.speed * dt)
        if (rem < 0.5) {
          sc.shift = Math.min(1, (sc.shift || 0) + 1.5 * dt)
          if (sc.shift >= 1) this.sc = null
        }
      } else {
        // Einsammeln: langsam voraus, bis der Führende direkt dahinter ist. Dann orange Lichter und Überholverbot.
        if (!sc.collected && lead && !lead.pit && mod(sc.dist - lead.dist, this.L) < 20) {
          sc.collected = true
          if (sc.lights) sc.lights = 'orange'
          this.msg('FELD HINTER DEM SAFETY CAR - ÜBERHOLVERBOT', 'warn')
        }
        const idx = Math.floor(mod(sc.dist, this.L) / this.track.ds) % this.track.n
        sc.speed += clamp(this.track.v[idx] * (sc.collected ? 0.42 : 0.2) - sc.speed, -30 * dt, 12 * dt)
        const prev = sc.dist
        sc.dist += sc.speed * dt
        sc.lat += clamp(-sc.lat, -0.6 * dt, 0.6 * dt)
        // Vor dem Reinkommen biegt es an der Boxeneinfahrt ab
        if (this.scEnding && mod(prev, this.L) < P.inS && mod(sc.dist, this.L) >= P.inS) { sc.leaving = true; sc.pitU = 0 }
      }
    }

    // Hindernisse auf der Fahrbahn: stehende Autos und der Arztwagen im Einsatz. Wer auf die Ideallinie ragt, wird umfahren.
    this.obstacles = order.filter((c) => c.status === 'stopped' && c.speed < 5).map((c) => ({ dist: c.dist, lat: c.lat }))
    if (this.med && this.med.mode === 'mission' && this.med.pitU == null && this.med.speed < 15) this.obstacles.push({ dist: this.med.dist, lat: this.med.lat })
    const running = order.filter((c) => c.status === 'run')
    for (let i = 0; i < running.length; i++) this.stepCar(running[i], dt, running, i)
    for (const c of order) if (c.status === 'stopped') this.stepStopped(c, dt)
    this.stepMed(dt)

    this.weather(dt)
    this.hazards(dt)
    this.autoDirector()
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
      this.msg(`${this.tag(c)} - FÄHRT WEITER`, 'info')
      if (Math.random() < 0.3) { c.damage = true; this.radioQueue.push({ at: this.t + rnd(3, 6), car: c, dmg: true }) }
    }
  }

  stepCar(c, dt, running, idxInOrder) {
    const T = this.track, L = this.L
    const s = mod(c.dist, L)
    const idx = Math.floor(s / T.ds) % T.n
    const sec = sectorOf(s, L)
    const st = this.state
    if (c.pit) return this.stepPit(c, dt, idxInOrder)
    let v = T.v[idx] * c.pace * c.form * this.tyreFactor(c)
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
      // Alle schließen zügig zum Zug hinter dem Safety Car auf; gebremst wird über den Vordermann.
      // Wer sich zurückgerundet hat, fährt schnell herum, bis er hinten wieder anschließt.
      v *= c.unlapped ? 0.92 : 0.7
    } else {
      const f = this.sectors[sec]
      if (f === 'yellow') v *= 0.8
      else if (f === 'double') v *= 0.55
    }

    if (st !== 'GREEN' || this.sectors.some((f) => f !== 'green')) c.lapDirty = true
    // Vordermann / Überholen
    let blocker = null, bgap = 1e9
    // anyLat: Vordermann zählt unabhängig von der Spur (Einführungsrunde, Zug hinter dem Safety Car)
    const consider = (o, isSC, anyLat = false) => {
      let g = mod(o.dist - c.dist, L)
      if (st === 'FORMATION' && o.onGrid) return
      // Liegen zwei Autos exakt gleichauf, gilt das mit der kleineren Nummer als vorn, damit sie sich trennen
      if (g < 1e-6 && !isSC && o.id < c.id) g = 0.01
      if (g > 0 && g < 45 && (anyLat || Math.abs(o.lat - c.lat) < 0.75) && g < bgap) {
        bgap = g
        blocker = o
        blocker.isSC = isSC
      }
    }
    // Unter Safety Car wird hintereinander gefahren, niemand bleibt neben einem anderen
    const file = st === 'FORMATION' || st === 'SC'
    for (const o of running) if (o !== c && !o.pit && !!o.unlap === !!c.unlap) consider(o, false, file)
    // Safety Car: Solange es mit grünen Lichtern einsammelt, winkt es alle außer dem Führenden vorbei
    let scPass = false
    if (this.sc && this.sc.pitU == null) {
      const sc = this.sc
      if (c.unlap) {
        // am Feld und am Safety Car vorbei; ist das Safety Car passiert, geht es mit Tempo um die Runde
        const g = mod(c.dist - sc.dist, L)
        if (g > 15 && g < 250) { c.unlap = false; c.unlapped = true }
        else scPass = true
      } else if (sc.lights === 'green' && !sc.collected && idxInOrder !== 0) {
        const g = mod(sc.dist - c.dist, L)
        if (g < 60 || g > L - 12) scPass = true
        // Vorbei darf nur, wer schon seitlich versetzt ist; sonst bleibt er kurz dahinter
        consider(sc, true, false)
      } else consider(sc, true, true)
    }
    const free = st === 'GREEN'
    // hinten am Feld angekommen: wieder ganz normal einreihen
    if (c.unlapped && (blocker || st !== 'SC')) c.unlapped = false
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
    // Ausweichen: liegt voraus ein Hindernis nahe der Ideallinie, auf die freie Seite ziehen
    let dodge = null
    if (!pre) {
      for (const o of this.obstacles) {
        const g = mod(o.dist - c.dist, L)
        if ((g < 80 || g > L - 9) && Math.abs(o.lat) < 0.75) { dodge = o.lat >= 0 ? o.lat - 1.0 : o.lat + 1.0; break }
      }
    }
    if (dodge !== null) c.latTarget = dodge
    else if (scPass) c.latTarget = -T.pit.side * 0.85 // seitlich am Safety Car vorbei
    else if (!c.passing && !pre && Math.abs(c.latTarget) > 0.4 && this.state !== 'RESTART' && this.state !== 'RED') c.latTarget = 0

    const a = v > c.speed ? 14 : st === 'RED' ? 42 : 38
    c.speed += clamp(v - c.speed, -a * dt, a * dt)
    const prev = c.dist
    // Kein Durchfahren: höchstens bis auf eine Wagenlänge an den Vordermann in derselben Spur heran
    let adv = c.speed * dt
    if (blocker && st !== 'FORMATION') {
      // bgap ist der aktuelle Abstand: Autos weiter vorn wurden in diesem Schritt schon bewegt
      const room = Math.max(0, bgap - 6.2)
      if (adv > room) { adv = room; c.speed = Math.min(c.speed, blocker.speed) }
    }
    c.dist += adv
    // Nicht seitlich in ein Auto hineinziehen, das gerade daneben fährt
    const newLat = c.lat + clamp(c.latTarget - c.lat, -1.2 * dt, 1.2 * dt)
    let latFree = true
    if (newLat !== c.lat && !pre) {
      for (const o of running) {
        if (o === c || o.pit) continue
        let d = mod(o.dist - c.dist, L)
        if (d > L / 2) d -= L
        if (Math.abs(d) < 6.6 && Math.abs(newLat - o.lat) < 0.75 && Math.abs(newLat - o.lat) < Math.abs(c.lat - o.lat)) { latFree = false; break }
      }
    }
    if (latFree) c.lat = newLat
    if (c.dist > 0) c.wear += (c.dist - prev) / (TYRES[c.tyre].life * Math.max(this.raceDist, 8 * L)) * (isWetTyre(c.tyre) && this.wet < 0.12 ? 2.5 : 1)
    // Boxeneinfahrt
    const P = T.pit
    if (c.dist > 0 && mod(prev, L) < P.inS && mod(c.dist, L) >= P.inS) {
      const job = this.pitDecision(c)
      if (job) {
        const u = mod(c.dist, L) - P.inS
        const sp = Math.random() < 0.06 ? pick([rnd(78.8, 80), rnd(80.3, 89), rnd(80.3, 89), rnd(90.5, 97)]) : null
        c.pit = { u, entryAbs: c.dist - u, job, phase: 'lane', shift: 0, timer: 0, speeding: sp ? +sp.toFixed(1) : null, boxU: P.boxU(this.teams.indexOf(c.team), this.teams.length) }
        c.lat = 0
        c.latTarget = 0
        c.passing = null
        c.lapDirty = true
        if (job.tyre && Math.random() < 0.3) this.say('pitIn', c)
        return
      }
    }
    if (Math.floor(c.dist / L) > Math.floor(prev / L) && c.dist > 0) this.onLine(c, idxInOrder)
  }

  // Tempo je nach Reifenmischung, Nässe und Verschleiß
  tyreFactor(c) {
    const w = this.wet
    let f
    if (c.tyre === 'I') f = w < 0.12 ? 0.9 : 0.93 - 0.3 * Math.max(0, w - 0.7)
    else if (c.tyre === 'W') f = w < 0.4 ? 0.85 : 0.885
    else f = TYRES[c.tyre].base * (1 - 0.5 * w)
    return f * (1 - 0.025 * c.wear * c.wear - (c.wear > 1 ? 0.06 * (c.wear - 1) : 0)) * (c.damage ? 0.965 : 1)
  }
  fitTyre(c, k) {
    c.tyre = k
    c.wear = 0
    if (isWetTyre(k)) c.usedWet = true
    else if (!c.usedDry.includes(k)) c.usedDry.push(k)
  }
  chooseDry(c, frac) {
    const only = c.usedDry.length < 2 && !c.usedWet && !isWetTyre(c.tyre) ? c.tyre : null
    const ok = ['S', 'M', 'H'].filter((k) => k !== only)
    return ok.find((k) => TYRES[k].life * 0.92 >= frac) || ok[ok.length - 1]
  }
  // Entscheidet an der Boxeneinfahrt, ob und wofür das Auto reinkommt
  // Bei gesperrter Boxengasse bleiben fast alle draußen. Beschädigte Autos kommen oft trotzdem (erlaubt),
  // andere nur selten (Regelverstoß, wird ein Fall).
  pitDecision(c) {
    if (this.quali) return null
    if (this.pitClosed && Math.random() > (c.damage ? 0.6 : 0.07)) return null
    const dmg = !!c.damage
    const job = this.pitJob(c)
    if (job && this.pitClosed) this.spawn('pitClosed', { car: c, dmg })
    return job
  }
  pitJob(c) {
    if (!['GREEN', 'SC', 'VSC'].includes(this.state) || this.chequered) return null
    if (c.pending) {
      const pen = c.pending.type
      c.pending = null
      this.msg(`${this.tag(c)} - SITZT ${pen === 'dt' ? 'DURCHFAHRTSSTRAFE' : 'STOP & GO'} AB`, 'info')
      return pen === 'dt' ? { stop: 0, pen } : { stop: 10, pen }
    }
    const remaining = this.laps * this.L - c.dist
    if (remaining < this.L * 0.5) return null
    const frac = remaining / Math.max(this.raceDist, 8 * this.L)
    // Kurzrennen (bis 3 Runden): keine Pflichtstopps, nur Schaden, Strafe oder Wetter
    const sprint = this.laps <= 3
    const wetT = isWetTyre(c.tyre)
    let next = null, must = false
    const lead = this.order.find((o) => o.status === 'run')
    const leadLeft = lead ? this.laps * this.L - lead.dist : remaining
    if (!wetT && this.wet > c.wetThr) next = this.wet > 0.8 ? 'W' : 'I'
    else if (c.tyre === 'I' && this.wet > 0.88) next = 'W'
    else if (c.tyre === 'W' && this.wet < 0.55 && this.wet > c.dryThr) next = 'I'
    else if (wetT && this.wet < c.dryThr && this.rain < 0.05) next = this.chooseDry(c, frac)
    else if (!wetT) {
      must = !sprint && c.usedDry.length < 2 && !c.usedWet && Math.min(remaining, leadLeft) < this.L * c.mustAt
      const cheap = !sprint && (this.state === 'SC' || this.state === 'VSC') && c.wear > 0.45 && Math.random() < 0.7
      if ((!sprint && c.wear >= c.pitAt) || must || cheap) next = this.chooseDry(c, frac)
    }
    // Beschädigtes Auto: Reparaturstopp mit frischen Reifen
    if (c.damage) {
      const tyre = next || (isWetTyre(c.tyre) ? c.tyre : sprint ? c.tyre : this.chooseDry(c, frac))
      this.msg(`${this.tag(c)} - ZUR REPARATUR AN DER BOX`, 'info')
      return { stop: rnd(7, 12) + c.penaltySec, tyre, repair: true, served: c.penaltySec }
    }
    if (!next) return null
    // Kein Doppelstopp: der Teamkollege steht noch an der Box
    if (!must && this.cars.some((o) => o !== c && o.team === c.team && o.pit && o.pit.phase !== 'out')) return null
    const stop = Math.random() < 0.08 ? rnd(5, 9) : rnd(2.0, 3.2)
    return { stop: stop + c.penaltySec, tyre: next, slow: stop > 4.5, served: c.penaltySec }
  }

  stepPit(c, dt, idxInOrder) {
    const P = this.track.pit, pit = c.pit, L = this.L, st = this.state
    const lim = pit.speeding ? pit.speeding / 3.6 : 22.2
    let v
    if (st === 'RED' || st === 'RESTART') v = 0
    else if (pit.u < P.uA) v = Math.sqrt(lim * lim + 2 * 34 * (P.uA - pit.u))
    else if (pit.u < P.uB) v = lim
    else v = 75
    if (pit.job.stop && pit.phase === 'lane') {
      const rem = pit.boxU - pit.u
      v = Math.min(v, Math.sqrt(2 * 9 * Math.max(0, rem)) + 0.4)
      if (rem < 0.4) { pit.phase = 'stop'; pit.timer = pit.job.stop; c.speed = 0 }
    }
    if (!pit.job.stop && pit.phase === 'lane' && pit.u > P.uB) pit.phase = 'out'
    if (pit.phase === 'stop') {
      v = 0
      pit.shift = Math.min(1, pit.shift + dt * 4)
      pit.timer -= dt
      if (pit.timer <= 0 && this.releaseOk(c)) {
        const j = pit.job
        if (j.tyre) { this.fitTyre(c, j.tyre); c.stops++ }
        if (j.repair) c.damage = false
        if (j.served) { c.penaltySec = Math.max(0, c.penaltySec - j.served); this.msg(`${this.tag(c)} - ${j.served} SEKUNDEN STRAFE ABGESESSEN`, 'info') }
        if (j.pen) this.msg(`${this.tag(c)} - STOP & GO ABGESESSEN`, 'info')
        if (j.slow) this.say('slowStop', c, {}, { force: true })
        pit.phase = 'out'
      }
    } else pit.shift = Math.max(0, pit.shift - dt * 4)
    // Vordermann in der Boxengasse
    for (const o of this.cars) {
      if (o === c || !o.pit || o.pit.phase === 'stop' || o.status !== 'run') continue
      const g = o.pit.u - pit.u
      if (g > 0 && g < 14) v = Math.min(v, o.speed * 0.98 + Math.max(0, g - 8))
    }
    c.speed += clamp(v - c.speed, -40 * dt, 12 * dt)
    const prev = c.dist
    pit.u += c.speed * dt
    c.dist = Math.max(prev, pit.entryAbs + (Math.min(pit.u, P.len) / P.len) * P.span)
    if (pit.speeding && !pit.caught && pit.u >= P.uA + 30) {
      pit.caught = true
      this.spawn('pitSpeed', { car: c, kmh: pit.speeding })
    }
    if (pit.u >= P.len) {
      if (pit.job.pen === 'dt') this.msg(`${this.tag(c)} - DURCHFAHRTSSTRAFE ABGESESSEN`, 'info')
      c.pit = null
      c.lat = P.side * 0.9
      c.latTarget = 0
    }
    if (Math.floor(c.dist / L) > Math.floor(prev / L) && c.dist > 0) this.onLine(c, idxInOrder)
  }

  // Freigabe an der Box: normalerweise wartet die Crew, bis die Fahrspur frei ist
  releaseOk(c) {
    const pit = c.pit
    // Autos, die gerade an der Box vorbeifahren oder bis 30 m dahinter herankommen
    const close = this.cars.filter((x) => x !== c && x.pit && x.status === 'run' && x.pit.phase !== 'stop' && pit.u - x.pit.u > -6 && pit.u - x.pit.u < 30)
    if (!close.length) return true
    // Fährt eines direkt neben der Box, wartet die Crew immer. Eine unsichere Freigabe gibt es nur
    // vor ein Auto, das 8 bis 30 m dahinter kommt: Der Freigegebene zieht ihm dann vor die Nase.
    if (close.some((x) => pit.u - x.pit.u < 8)) return false
    const o = close.reduce((m, x) => (x.pit.u > m.pit.u ? x : m))
    if (pit.rolled === undefined) pit.rolled = Math.random() < 0.22
    if (!pit.rolled) return false
    const react = Math.round(clamp((32 - (pit.u - o.pit.u)) * 2.4, 6, 58))
    o.speed *= 1 - react / 120
    this.spawn('unsafeRelease', { a: c, b: o, react, gap: pit.u - o.pit.u })
    return true
  }

  // Parkplätze neben der Boxengasse, auf dem geraden Stück zwischen der letzten Teambox und dem Ende des
  // Tempolimits: erst der Arztwagen, dann das Safety Car direkt vor der Ausfahrt
  parkU(which = 'sc') {
    return this.track.pit.uB - (which === 'med' ? 30 : 17)
  }
  parkPose(shift = 1, which = 'sc') {
    const P = this.track.pit
    const q = P.at(this.parkU(which))
    const o = 8.5 * shift * P.side
    return { x: q.x - Math.sin(q.h) * o, y: q.y + Math.cos(q.h) * o, h: q.h }
  }
  // Das Safety Car ist immer sichtbar: geparkt, in der Boxengasse oder auf der Strecke
  scPose(latM = 3.6) {
    const sc = this.sc
    if (!sc) return this.parkPose()
    if (sc.pitU != null) {
      const P = this.track.pit
      const q = P.at(sc.pitU)
      const o = 8.5 * (sc.shift || 0) * P.side
      return { x: q.x - Math.sin(q.h) * o, y: q.y + Math.cos(q.h) * o, h: q.h }
    }
    return this.pose({ dist: sc.dist, lat: sc.lat || 0 }, latM)
  }
  // Arztwagen: hinter dem Feld, in der Boxengasse oder geparkt
  medPose(latM = 3.6) {
    const m = this.med
    if (!m) return this.parkPose(1, 'med')
    if (m.pitU != null) {
      const P = this.track.pit
      const q = P.at(m.pitU)
      const o = 8.5 * m.shift * P.side
      return { x: q.x - Math.sin(q.h) * o, y: q.y + Math.cos(q.h) * o, h: q.h }
    }
    return this.pose({ dist: m.dist, lat: m.lat }, latM)
  }
  medOnTrack() {
    return !!(this.med && this.med.mode === 'mission')
  }
  // Schickt den Arztwagen zu einem verunfallten Auto. Er fährt sofort aus der Boxengasse los.
  sendMedical(carId) {
    if (this.locked()) return
    const c = this.cars[carId]
    if (!c || c.status !== 'stopped' || !c.haz || !c.haz.medical || c.haz.medical.state !== 'needed') return
    c.haz.medical.state = 'enroute'
    this.logAction(`Arztwagen geschickt (${c.code})`)
    this.msg(`ARZTWAGEN UNTERWEGS ZU ${this.tag(c)}`, 'warn')
    let m = this.med
    if (m && m.mode === 'mission') return // schon im Einsatz: fährt danach direkt weiter
    if (!m) m = this.med = { dist: 0, speed: 0, lat: 0, gap: 22, pitU: this.parkU('med'), shift: 1 }
    m.mode = 'mission'
    m.target = carId
    if (m.pitU != null) m.phase = 'out'
    else { m.phase = 'drive'; this.medGoal(m) }
  }
  // Zielpunkt: 9 m vor dem verunfallten Auto, in Fahrtrichtung gerechnet
  medGoal(m) {
    const tc = this.cars[m.target]
    m.goal = m.dist + mod(mod(tc.dist, this.L) - 9 - mod(m.dist, this.L), this.L)
  }
  stepMission(m, dt) {
    const P = this.track.pit, L = this.L, T = this.track
    const tc = this.cars[m.target]
    if (m.phase === 'out') {
      // vom Parkplatz durch die Boxengasse und über die Ausfahrt auf die Strecke
      m.speed += clamp(30 - m.speed, -30 * dt, 12 * dt)
      m.shift = Math.max(0, m.shift - 1.5 * dt)
      m.pitU += m.speed * dt
      if (m.pitU >= P.len) {
        m.pitU = null
        m.dist = mod(P.inS + P.span, L)
        m.lat = 0
        m.phase = 'drive'
        this.medGoal(m)
      }
      return
    }
    const idx = Math.floor(mod(m.dist, L) / T.ds) % T.n
    // Das Auto wurde inzwischen anders erledigt (z. B. Rennende): Einsatz abbrechen
    if (m.phase !== 'return' && tc.status !== 'stopped') m.phase = 'return'
    if (m.phase === 'drive') {
      const rem = m.goal - m.dist
      const v = Math.min(T.v[idx] * 0.55, Math.sqrt(2 * 6 * Math.max(0, rem)) + 0.5)
      m.speed += clamp(v - m.speed, -30 * dt, 9 * dt)
      m.dist = Math.min(m.goal, m.dist + m.speed * dt)
      // fährt abseits der Ideallinie und stellt sich am Ende hinter das Unfallauto
      const side = tc.lat >= 0 ? 1 : -1
      m.lat += clamp((rem < 60 ? tc.lat : side * 0.9) - m.lat, -0.8 * dt, 0.8 * dt)
      if (rem < 0.6) {
        m.phase = 'scene'
        m.speed = 0
        m.timer = rnd(14, 24)
        tc.haz.medical.state = 'onscene'
        this.msg(`ARZTWAGEN BEI ${this.tag(tc)} EINGETROFFEN`, 'warn')
      }
    } else if (m.phase === 'scene') {
      m.timer -= dt
      tc.haz.medical.left = Math.max(0, m.timer)
      if (m.timer <= 0) {
        tc.haz.medical.state = 'done'
        if (Math.random() < 0.88) {
          this.msg(`${this.tag(tc)} - FAHRER IST OKAY`, 'ok')
          this.radio(tc, pick(LINES.crashOk))
          this.radioQueue.push({ at: this.t + rnd(3, 6), key: 'medOk' })
        } else this.msg(`${this.tag(tc)} - FAHRER KOMMT ZUR UNTERSUCHUNG INS STRECKENKLINIKUM`, 'warn')
        // wartet noch jemand auf den Arzt, fährt der Wagen direkt weiter
        const next = this.cars.find((x) => x.status === 'stopped' && x.haz && x.haz.medical && x.haz.medical.state === 'enroute')
        if (next) { m.target = next.id; m.phase = 'drive'; this.medGoal(m) }
        else m.phase = 'return'
      }
    } else {
      // zurück: die Runde zu Ende fahren und an der Boxeneinfahrt abbiegen
      m.speed += clamp(T.v[idx] * 0.55 - m.speed, -30 * dt, 9 * dt)
      const prev = m.dist
      m.dist += m.speed * dt
      if (mod(prev, L) < P.inS && mod(m.dist, L) >= P.inS) { m.pitU = 0; m.shift = 0; m.mode = null; m.target = null }
    }
  }
  stepMed(dt) {
    const m = this.med
    if (!m) return
    if (m.mode === 'mission') return this.stepMission(m, dt)
    const P = this.track.pit, L = this.L, T = this.track
    if (m.pitU != null) {
      // durch die Boxengasse auf den Parkplatz
      const bay = this.parkU('med')
      const rem = bay - m.pitU
      m.speed += clamp(Math.min(22, Math.sqrt(2 * 8 * Math.max(0, rem)) + 0.5) - m.speed, -34 * dt, 12 * dt)
      m.pitU = Math.min(bay, m.pitU + m.speed * dt)
      if (rem < 0.5) {
        m.shift = Math.min(1, m.shift + 1.5 * dt)
        if (m.shift >= 1) this.med = null
      }
      return
    }
    // hält Abstand zum letzten Auto des Feldes
    const field = this.cars.filter((c) => c.status === 'run' && !c.pit)
    const idx = Math.floor(mod(m.dist, L) / T.ds) % T.n
    let v = T.v[idx] * 0.6
    if (field.length) {
      const tail = field.reduce((a, c) => (c.dist < a.dist ? c : a))
      const room = tail.dist - m.gap - m.dist
      v = room > 0 ? Math.min(v, tail.speed + room * 0.8) : 0
    }
    m.speed += clamp(v - m.speed, -30 * dt, 9 * dt)
    const prev = m.dist
    m.dist += m.speed * dt
    // nach der ersten Rennrunde an der Boxeneinfahrt abbiegen
    if (this.raceStart !== null && mod(prev, L) < P.inS && mod(m.dist, L) >= P.inS) { m.pitU = 0; m.shift = 0 }
  }

  // Position eines Autos in Metern (Strecke oder Boxengasse); latM = Meter pro Einheit Querversatz
  pose(c, latM) {
    const T = this.track
    if (c.pit) {
      const q = T.pit.at(c.pit.u)
      const o = c.pit.shift * 5.5 * T.pit.side
      return { x: q.x - Math.sin(q.h) * o, y: q.y + Math.cos(q.h) * o, h: q.h, pit: true }
    }
    const s = mod(c.dist, this.L)
    const f = s / T.ds
    const i = Math.floor(f) % T.n, j = (i + 1) % T.n, u = f - Math.floor(f)
    let dh = T.h[j] - T.h[i]
    if (dh > Math.PI) dh -= 2 * Math.PI
    if (dh < -Math.PI) dh += 2 * Math.PI
    const h = T.h[i] + dh * u
    const o = c.lat * latM
    return { x: T.xs[i] + (T.xs[j] - T.xs[i]) * u - Math.sin(h) * o, y: T.ys[i] + (T.ys[j] - T.ys[i]) * u + Math.cos(h) * o, h, pit: false }
  }

  onLine(c, idxInOrder) {
    c.form = rnd(0.985, 1.003)
    // Zeitpunkt der Linienüberfahrt zwischen zwei Rechenschritten bestimmen, sonst wären alle Zeiten auf 0,05 s gerastert
    const now = this.t - (c.speed > 1 ? Math.min(0.05, mod(c.dist, this.L) / c.speed) : 0)
    const lt = now - c.lapStart
    if (!c.lapDirty && c.dist > this.L * 0.5) {
      c.lapTimes.push(lt)
      if (c.bestLap === null || lt < c.bestLap) c.bestLap = lt
    }
    c.lapStart = now
    c.lapDirty = false
    if (c.dist >= this.laps * this.L - 1 || this.chequered) {
      this.finish(c)
      return
    }
    if (idxInOrder === 0 && this.state === 'SC' && this.scEnding && (!this.sc || this.sc.leaving)) {
      this.state = 'GREEN'
      this.sc = null
      this.scEnding = false
      for (const o of this.cars) { o.unlap = false; o.unlapped = false }
      this.allGreen(true)
      this.msg('SAFETY CAR IN DER BOX - GRÜNE FLAGGE', 'ok')
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
      this.msg('ZIELFLAGGE', 'flag')
      for (const o of this.cars) if (o.status === 'stopped') o.status = 'out'
    }
    if (this.quali) this.msg(`${this.tag(c)} - QUALIFYING BEENDET, BESTZEIT ${c.bestLap ? lapFmt(c.bestLap) : 'KEINE'}`, 'info')
    else this.msg(`${this.tag(c)} - IM ZIEL AUF P${this.finishCount}`, 'info')
    if (this.quali) { /* kein Siegerfunk */ } else if (this.finishCount === 1) this.say('win', c, {}, { force: true, replyChance: 1 })
    else if (Math.random() < 0.3) this.say(this.finishCount >= this.cars.length - 4 ? 'finishLast' : 'finishMid', c, { pos: this.finishCount }, { force: true })
    if (!this.cars.some((o) => o.status === 'run' || o.status === 'stopped')) {
      this.state = 'FINISHED'
      this.msg(this.quali ? 'QUALIFYING BEENDET' : 'RENNEN BEENDET', 'flag')
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
      if (phase === 'rain' && this.rainPhase !== 'heavy') { this.msg('REGEN - DIE STRECKE WIRD RUTSCHIG', 'warn'); this.sayRandom('rainStart', 2) }
      if (phase === 'heavy') { this.msg('STARKREGEN - GEFAHR VON AQUAPLANING', 'bad'); this.sayRandom('rainHeavy', 2) }
      if (phase === 'drying') { this.msg('REGEN VORBEI - STRECKE TROCKNET AB', 'ok'); this.sayRandom('rainEnd', 1) }
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
      if (e.dmg) { if (e.car.status === 'run') this.say('damage', e.car, {}, { force: true, replyChance: 0.8 }) }
      else if (e.key) this.sayRandom(e.key, 1, e.vars || {})
      else this.radio(e.car, e.text, true)
    }
    if (this.state === 'GREEN' && !this.chequered && this.t > this.nextAmbient) {
      this.nextAmbient = this.t + rnd(22, 45)
      this.sayRandom('ambient', 1)
    }
  }

  hazards(dt) {
    let danger = 0, uncovered = 0
    for (const c of this.cars) {
      if (c.status !== 'stopped') continue
      const sec = sectorOf(mod(c.dist, this.L), this.L)
      // Wie gut ist die Stelle abgesichert? 0 = gar nicht, 1 = Gelb, 2 = VSC, 3 = Safety Car oder Rot
      // Stufe 4 = Rot. Solange der Arzt gebraucht wird, braucht die Stelle Safety Car, bei schwerem Einschlag Rot.
      const lvl = Math.max(this.state === 'GREEN' ? 0 : this.state === 'VSC' ? 2 : this.state === 'RED' ? 4 : 3, this.sectors[sec] !== 'green' ? 1 : 0)
      const med = c.haz.medical && c.haz.medical.state !== 'done' ? c.haz.medical : null
      const need = med ? (med.heavy ? 4 : 3) : { rand: 1, teil: 2, linie: 3 }[c.haz.pos]
      if (lvl === 0) { danger++; uncovered++ }
      else if (lvl < need) danger += 0.3 * (need - lvl)
      // Fahrer wartet auf den Arzt, der noch nicht losgeschickt wurde
      if (med && med.state === 'needed' && this.t - med.at > 10) danger += 0.7
      // Steht das Auto im Bereich der Boxeneinfahrt, gehört die Boxengasse gesperrt
      c.haz.nearPit = mod(mod(c.dist, this.L) - (this.track.pit.inS - 200), this.L) < 330
      if (c.haz.nearPit && !this.pitClosed && (this.state === 'GREEN' || this.state === 'VSC' || this.state === 'SC')) danger += 0.3
      // active: Bergung läuft sichtbar (Stelle ist abgesichert und der Fahrer versorgt)
      c.haz.active = false
      if (c.recov != null && !med) {
        const rate = this.state === 'RED' ? 1.5 : this.state === 'SC' ? 1 : this.state === 'VSC' ? 0.7 : this.sectors[sec] !== 'green' ? (c.haz.pos === 'rand' ? 0.6 : 0.3) : 0.1
        c.haz.active = rate >= 0.3
        c.recov -= dt * rate
        if (c.recov <= 0) {
          c.status = 'out'
          c.speed = 0
          this.msg(`${this.tag(c)} - GEBORGEN, STELLE FREI`, 'ok')
        }
      }
    }
    // Arztwagen im Einsatz auf freier Strecke
    if (this.medOnTrack() && this.state === 'GREEN') danger += 0.6
    const flood = this.wet > 0.78 && (this.state === 'GREEN' || this.state === 'VSC')
    this.safety = clamp(this.safety + (danger ? -0.7 * danger * dt : flood ? -0.45 * dt : 0.04 * dt), 0, 100)
    this.dangerT = uncovered ? this.dangerT + dt : 0
    if (this.dangerT > 7) { this.dangerT = -18; this.sayRandom('danger', 1) }
    const stoppedSecs = new Set(this.cars.filter((c) => c.status === 'stopped').map((c) => sectorOf(mod(c.dist, this.L), this.L)))
    const idle = (this.state === 'SC' || this.state === 'VSC') && !stoppedSecs.size && this.wet < 0.6 && !this.scEnding && !this.vscEndAt && !this.medOnTrack()
    // Schonfrist: das Safety Car braucht nach der Bergung noch gut eine Runde, erst danach kostet es Ablauf
    this.idleT = idle ? (this.idleT || 0) + dt : 0
    const grace = 45 // Sekunden, um nach der Bergung das Ende einzuleiten; die Einfahrrunde selbst kostet nichts
    if (idle && this.idleT > grace) this.flow = clamp(this.flow - 0.25 * dt, 0, 100)
    if (this.state === 'GREEN' && !stoppedSecs.size && this.sectors.every((f) => f === 'green')) this.flow = clamp(this.flow + 0.03 * dt, 0, 100)
    this.scIdleT = idle && this.idleT > grace * 0.6 && !this.scEnding && !this.vscEndAt ? this.scIdleT + dt : 0
    if (this.scIdleT > 30) { this.scIdleT = 0; this.sayRandom('scTooLong', 1) }
    for (let k = 0; k < 3; k++) if (this.sectors[k] !== 'green' && !stoppedSecs.has(k) && this.state === 'GREEN') this.flow = clamp(this.flow - 0.05 * dt, 0, 100)
    for (const inc of this.incidents) {
      if (inc.kind === 'hazard' && inc.status === 'open' && this.cars[inc.carIds[0]].status !== 'stopped') inc.status = 'done'
    }
    this.incidents = this.incidents.filter((i) => i.status === 'open')
  }

  expireIncidents() {
    // fällige Proteste auf den Tisch der Rennleitung legen
    for (let i = this.protestQueue.length - 1; i >= 0; i--) {
      const q = this.protestQueue[i]
      if (this.t < q.at) continue
      this.protestQueue.splice(i, 1)
      const c = this.cars[q.car]
      if (c.status === 'dsq' || this.chequered) continue
      const inc = this.makeBase('protest', 'protest', [c.id], { sector: 0, turn: 0, label: 'Rennleitung' })
      Object.assign(inc, { opt: q.opt, correct: q.correct, caseNo: q.no, deadline: this.t + 90 })
      this.incidents.push(inc)
      this.msg(`PROTEST - ${c.team.toUpperCase()} GEGEN DIE STRAFE FÜR ${this.tag(c)}`, 'warn')
    }
    for (const inc of this.incidents) {
      if (inc.kind === 'protest' && inc.status === 'open' && this.t > inc.deadline) {
        // nicht bearbeitet: die Strafe bleibt, kostet aber etwas Ablauf
        inc.status = 'done'
        this.flow = clamp(this.flow - 3, 0, 100)
        this.msg(`PROTEST NICHT BEARBEITET - STRAFE FÜR ${this.tag(this.cars[inc.carIds[0]])} BLEIBT`, 'warn')
      }
    }
    for (const inc of this.incidents) {
      if (inc.kind === 'decision' && inc.status === 'open' && this.t > inc.deadline) {
        inc.status = 'done'
        const miss = inc.ideal.sev >= 2 ? 10 : 3
        this.fairness = clamp(this.fairness - miss, 0, 100)
        this.logEvent(`Fall ${String(inc.no).padStart(2, '0')} (${TYPE_TITLE[inc.type]}): nicht entschieden`, -miss)
        this.msg(`FALL ${String(inc.no).padStart(2, '0')} - FRIST ABGELAUFEN, NICHT ENTSCHIEDEN`, 'warn')
      }
    }
    this.incidents = this.incidents.filter((i) => i.status === 'open')
  }

  // ---------- Zufallsereignisse ----------
  randomEvents(dt) {
    if (!['GREEN', 'SC', 'VSC'].includes(this.state) || this.chequered) return
    const open = this.incidents.filter((i) => i.kind === 'decision').length
    if (open >= this.diff.open) return
    const mult = this.state === 'GREEN' ? 1 : 0.25
    if (Math.random() > (dt * mult * this.diff.rate * (1 + 2.2 * this.wet)) / 45) return
    if (this.quali) return this.spawn(pick(['trackLimits', 'trackLimits', 'trackLimits', 'impeding', 'impeding', 'impeding', 'breakdown', 'offTrack']))
    const types = ['trackLimits', 'trackLimits', 'collision', 'collision', 'breakdown', 'offTrack']
    if (this.state === 'GREEN') types.push('forcingOff', 'weaving', 'cutChicane', 'blueFlags')
    if (this.state === 'SC' && this.sc && this.sc.collected) types.push('scGap', 'scGap', 'scGap')
    if (this.state !== 'GREEN' || this.sectors.some((f) => f !== 'green')) types.push('overtakeYellow', 'overtakeYellow', 'overtakeYellow')
    if (this.wet > 0.3) types.push('offTrack', 'offTrack', 'offTrack', 'collision')
    const type = pick(types)
    this.spawn(type)
  }

  runningCars() {
    return this.order.filter((c) => c.status === 'run' && !c.pit)
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
      inc.deadline = this.t + this.diff.deadline
    }
    return inc
  }

  stopCar(c, why) {
    c.status = 'stopped'
    // Meldung der Streckenposten: Lage des Autos, Trümmer, geschätzte Bergungszeit
    const self = why === 'DREHER'
    let pos = self ? pick(['rand', 'teil']) : why === 'UNFALL' ? pick(['rand', 'teil', 'teil', 'linie', 'linie']) : why === 'MOTOR ABGEWÜRGT' ? 'linie' : pick(['rand', 'rand', 'rand', 'teil', 'teil', 'linie'])
    if (this.quali) pos = 'rand' // im Qualifying rollen defekte Autos neben die Strecke
    const debris = why === 'UNFALL' && Math.random() < 0.6
    c.verge = (c.lat >= 0 ? 1 : -1) * { rand: 1.55, teil: 0.95, linie: 0.25 }[pos]
    c.recov = rnd(35, 60) + (debris ? 12 : 0) + (pos === 'linie' ? 8 : 0)
    c.haz = { cause: why, pos, debris, self, total: c.recov }
    // Schwerer Einschlag: Der Fahrer braucht den Arzt. Die Bergung beginnt erst, wenn er versorgt ist.
    // heavy: Die Rettung braucht die ganze Strecke, also Rote Flagge.
    if (why === 'UNFALL' && Math.random() < 0.25) {
      c.haz.medical = { state: 'needed', at: this.t, heavy: Math.random() < 0.3, left: 0 }
      this.radioQueue.push({ at: this.t + rnd(5, 9), key: 'medWorry' })
      this.msg(`${this.tag(c)} - SCHWERER EINSCHLAG, ARZT ANGEFORDERT`, 'bad')
    }
    c.passing = null
    c.latTarget = c.verge
    const w = this.where(c)
    this.msg(`${this.tag(c)} - STEHT IN KURVE ${w.turn} ${w.name.toUpperCase()} (${why})`, 'bad')
    this.incidents.push({ ...this.makeBase('hazard', 'hazard', [c.id], w), why })
  }

  spawn(type, opts = {}) {
    const run = this.runningCars()
    if (type === 'pitClosed') {
      const c = opts.car
      const inc = this.makeBase('decision', 'pitClosed', [c.id], { sector: 0, turn: 0, label: 'Boxeneinfahrt' })
      inc.ideal = { culprit: null, sev: opts.dmg ? 0 : 5 }
      inc.options = ['nfa', 'warn', 't5', 't10', 'dt', 'sg']
      inc.facts = [
        ['Fahrer', `${c.num} ${c.name} - ${c.team}`],
        ['Boxenampel', 'rot, Boxengasse gesperrt'],
        ['Zustand des Autos', opts.dmg ? 'beschädigt, kommt zur Reparatur' : 'ohne Schaden, normaler Reifenwechsel'],
        ['Ort', 'Boxeneinfahrt'],
      ]
      inc.statements = [{ code: c.code, text: opts.dmg ? 'Das Auto war kaputt, ich musste rein!' : pick(['Die Ampel war rot? Die habe ich nicht gesehen.', 'Das Team hat mich reingerufen. Ich mache nur, was die sagen.']) }]
      inc.replay = { kind: 'pitspeed', kmh: 79.5, closed: true }
      inc.expert = opts.dmg ? 'Experten: Beschädigtes Auto, Einfahrt zur Reparatur erlaubt. Keine Strafe.' : 'Experten: Einfahrt trotz roter Ampel ohne Schaden. 10 Sekunden Stop & Go.'
      this.incidents.push(inc)
      this.msg(`${this.tag(c)} - EINFAHRT TROTZ GESPERRTER BOXENGASSE - WIRD UNTERSUCHT`, 'warn')
      return
    }
    if (type === 'pitSpeed') {
      const c = opts.car, kmh = opts.kmh
      const inc = this.makeBase('decision', 'pitSpeed', [c.id], { sector: 0, turn: 0, label: 'Boxengasse' })
      inc.ideal = { culprit: null, sev: kmh <= 80 ? 0 : kmh <= 90 ? 2 : 3 }
      inc.options = ['nfa', 'warn', 't5', 't10', 'dt']
      inc.facts = [
        ['Fahrer', `${c.num} ${c.name} - ${c.team}`],
        ['Messung', `${kmh.toFixed(1)} km/h`],
        ['Limit', '80,0 km/h'],
        ['Ort', 'Boxengasse, Messschleife nach der Einfahrt'],
      ]
      inc.statements = [{ code: c.code, text: pick(['Der Begrenzer war drin! Hundertprozentig!', 'Ich habe den Knopf einen Hauch zu spät gedrückt.', 'Das Limit ist ein Witz, da läuft man ja schneller.']) }]
      inc.replay = { kind: 'pitspeed', kmh }
      inc.expert = kmh <= 80 ? `Experten: ${kmh.toFixed(1)} km/h, innerhalb des Limits. Keine Strafe.` : kmh <= 90 ? `Experten: ${(kmh - 80).toFixed(1)} km/h zu schnell. 5 Sekunden.` : `Experten: ${(kmh - 80).toFixed(1)} km/h zu schnell. 10 Sekunden.`
      this.incidents.push(inc)
      this.msg(`${this.tag(c)} - ZU SCHNELL IN DER BOXENGASSE - WIRD UNTERSUCHT`, 'warn')
      return
    }
    if (type !== 'unsafeRelease' && run.length < 4) return
    if (type === 'breakdown') {
      const c = pick(run.slice(1))
      this.stopCar(c, 'DEFEKT')
      this.say('breakdown', c, {}, { force: true })
      return
    }
    if (type === 'offTrack') {
      const slicks = run.filter((x) => !isWetTyre(x.tyre))
      const c = this.wet > 0.3 && slicks.length ? pick(slicks) : pick(run.slice(1))
      c.rejoinAt = this.t + rnd(15, 25)
      this.stopCar(c, 'DREHER')
      c.recov = null
      c.haz.total = c.rejoinAt - this.t
      this.say('spin', c, {}, { force: true })
      return
    }
    if (type === 'trackLimits') {
      const c = pick(run)
      const w = this.where(c)
      const prior = this.quali ? 0 : Math.floor(rnd(0, 3))
      // Maßgeblich ist der letzte Reifen auf der Streckenseite: over = Meter, die er jenseits der Linie liegt.
      // Positiv heißt, alle vier Räder sind draußen. Negativ heißt, er berührt Linie oder Strecke noch.
      let over = +rnd(-0.5, 0.9).toFixed(2)
      if (Math.abs(over) < 0.12) over = over < 0 ? -0.12 : 0.12 // nichts, was im Bild nicht zu entscheiden wäre
      const gain = Math.max(0, +(over * 0.35 + rnd(0, 0.1)).toFixed(2))
      const inc = this.makeBase('decision', 'trackLimits', [c.id], w)
      const violation = over > 0.05
      inc.ideal = { culprit: null, sev: !violation ? 0 : !this.quali && (prior >= 1 || gain > 0.2) ? 2 : 1 }
      inc.options = this.quali ? ['nfa', 'lap'] : ['nfa', 'lap', 'lap5']
      if (this.quali) inc.rule = RULES.trackLimitsQuali
      inc.optionSev = { nfa: 0, lap: 1, lap5: 2 }
      inc.facts = [
        ['Fahrer', `${c.num} ${c.name} - ${c.team}`],
        ['Ort', `Ausgang ${w.label}`],
        ['Runde', `Runde ${inc.lap} von ${this.laps}`],
        ['Rundenzeit', gain ? `-${gain.toFixed(2)} s Vorteil` : 'kein Zeitgewinn'],
        ['Bisherige Verstöße', String(prior)],
        ['Sender', 'Track-Limit-Schleife ausgelöst'],
      ]
      inc.tip = 'Tipp: Spule zu dem Moment, in dem das Auto am weitesten draußen ist, und zoome hinein. Berührt der innere Reifen die weiße Linie noch?'
      inc.statements = [{ code: c.code, text: pick(['Ich hatte noch einen halben Reifen auf der Linie.', 'Da war eine Rutscherei, kein Vorteil.', 'Die Linie ist dort unmöglich zu sehen.']) }]
      inc.replay = { kind: 'limits', over, gain }
      inc.expert = violation
        ? `Experten: Verstoß. Alle vier Räder waren draußen, der letzte Reifen lag ${over.toFixed(2)} m jenseits der Linie. ${inc.ideal.sev === 2 ? 'Wiederholung oder klarer Vorteil: Streichen + 5 Sek.' : 'Rundenzeit streichen genügt.'}`
        : `Experten: Kein Vergehen. Der Reifen auf der Streckenseite war noch ${Math.abs(over).toFixed(2)} m diesseits der Linienkante.`
      inc.consequence = 'Kein Einfluss auf andere Fahrer.'
      this.incidents.push(inc)
      this.msg(`${this.tag(c)} - TRACK LIMITS IN KURVE ${w.turn} - WIRD UNTERSUCHT`, 'warn')
      if (Math.random() < 0.6) this.say('trackLimits', c)
      return
    }
    if (type === 'impeding') {
      if (run.length < 2) return
      const A = pick(run)
      const B = pick(run.filter((c) => c !== A))
      const v = pick(['clear', 'clear', 'late', 'minor'])
      const lost = v === 'clear' ? rnd(0.35, 0.9) : v === 'late' ? rnd(0.12, 0.28) : rnd(0, 0.06)
      const inc = this.makeBase('decision', 'impeding', [A.id, B.id], this.where(A))
      inc.options = ['nfa', 'warn', 'grid3']
      inc.ideal = { culprit: null, sev: v === 'clear' ? 2 : v === 'late' ? 1 : 0 }
      inc.facts = [
        ['Langsames Auto', `${A.num} ${A.name} - ${A.team}`],
        ['Auf schneller Runde', `${B.num} ${B.name} - ${B.team}`],
        ['Ideallinie', v === 'clear' ? 'nicht freigemacht' : v === 'late' ? 'spät freigemacht' : 'rechtzeitig freigemacht'],
        ['Zeitverlust ' + B.code, `${lost.toFixed(2).replace('.', ',')} s`],
        ['Funk an ' + A.code, v === 'minor' ? 'Team hat rechtzeitig gewarnt' : 'Team hat nicht oder zu spät gewarnt'],
      ]
      inc.statements = [
        { code: B.code, text: pick(['Der steht mitten auf der Linie! Meine Runde ist im Eimer!', 'Was macht der da? Der parkt in der Kurve!']) },
        { code: A.code, text: pick(['Mir hat niemand gesagt, dass einer kommt.', 'Ich bin doch sofort zur Seite.']) },
      ]
      inc.replay = { kind: 'impede', v, lost }
      inc.expert = v === 'clear' ? `Experten: Klare Behinderung, ${lost.toFixed(2).replace('.', ',')} s verloren. 3 Startplätze zurück.` : v === 'late' ? 'Experten: Zu spät Platz gemacht, geringer Zeitverlust. Verwarnung.' : 'Experten: Rechtzeitig Platz gemacht, kein messbarer Zeitverlust. Keine Strafe.'
      this.incidents.push(inc)
      this.msg(`${this.tag(A)} - BEHINDERN VON ${this.tag(B)} - WIRD UNTERSUCHT`, 'warn')
      return
    }
    if (type === 'blueFlags') {
      // B ist überrundet und hält den schnelleren A auf
      let pair = null
      for (const B of run) for (const A of run) if (!pair && A !== B && A.dist - B.dist > this.L * 0.8) pair = [B, A]
      if (!pair) return this.spawn(pick(['forcingOff', 'weaving']))
      const [B, A] = pair
      const flags = pick([2, 3, 3, 4, 5, 5, 6, 7, 8, 9])
      const lost = +(flags * rnd(0.35, 0.6)).toFixed(1)
      const inc = this.makeBase('decision', 'blueFlags', [B.id, A.id], this.where(B))
      inc.ideal = { culprit: null, sev: flags <= 3 ? 0 : flags <= 5 ? 1 : 2 }
      inc.options = ['nfa', 'warn', 't5', 't10', 'dt']
      inc.facts = [
        ['Überrundeter', `${B.num} ${B.name} - ${B.team}`],
        ['Schnelleres Auto', `${A.num} ${A.name} - ${A.team}`],
        ['Blaue Flaggen passiert', `${flags} Posten`],
        ['Zeitverlust ' + A.code, `${lost.toFixed(1).replace('.', ',')} s`],
      ]
      inc.statements = [
        { code: B.code, text: pick(['Ich fahre mein eigenes Rennen, wo soll ich denn hin?', 'Ich habe ihn bei der ersten Gelegenheit vorbeigelassen!', 'Blaue Flaggen? Ich habe keine gesehen.']) },
        { code: A.code, text: pick(['Der hat mich eine halbe Runde aufgehalten!', 'Blaue Flaggen! Blaue Flaggen! Ist der blind?']) },
      ]
      inc.replay = { kind: 'blue', flags }
      inc.expert = flags <= 3 ? `Experten: ${flags} Posten, bei der ersten Gelegenheit Platz gemacht. Keine Strafe.` : flags <= 5 ? `Experten: ${flags} Posten sind zu viel. Verwarnung.` : `Experten: ${flags} blaue Flaggen ignoriert. 5 Sekunden.`
      this.incidents.push(inc)
      this.msg(`${this.tag(B)} - BLAUE FLAGGEN IGNORIERT - WIRD UNTERSUCHT`, 'warn')
      this.say('blue', A, { other: B })
      return
    }
    if (type === 'forcingOff' || type === 'weaving') {
      if (run.length < 2) return
      const i = Math.floor(rnd(1, run.length))
      const A = run[i - 1], B = run[i] // A verteidigt vor B
      const inc = this.makeBase('decision', type, [A.id, B.id], this.where(A))
      inc.options = ['nfa', 'warn', 't5', 't10', 'dt']
      if (type === 'forcingOff') {
        const v = pick(['pushed', 'pushed', 'behind', 'room'])
        const room = v === 'pushed' ? rnd(0.4, 1.4) : v === 'room' ? rnd(2.1, 2.8) : rnd(0.4, 1.4)
        inc.ideal = { culprit: null, sev: v === 'pushed' ? 2 : 0 }
        inc.facts = [
          ['Verteidiger (innen)', `${A.num} ${A.name} - ${A.team}`],
          ['Angreifer (außen)', `${B.num} ${B.name} - ${B.team}`],
          ['Am Scheitelpunkt', v === 'behind' ? `Vorderachse ${B.code} nur auf Höhe des Hinterrads` : `Vorderachse ${B.code} auf Höhe der Vorderachse`],
          ['Platz am Kurvenausgang', `${room.toFixed(1).replace('.', ',')} m (Wagenbreite 2,0 m)`],
          ['Folge', `${B.code} mit allen vier Rädern neben der Strecke`],
        ]
        inc.statements = [
          { code: B.code, text: pick(['Er hat mich einfach von der Strecke geschoben!', 'Ich war daneben! Wo soll ich denn hin, in die Wiese?']) },
          { code: A.code, text: pick(['Das war meine Kurve, ich war vorn.', 'Ich bin nur meine Linie gefahren.']) },
        ]
        inc.replay = { kind: 'force', v, room }
        inc.expert = v === 'pushed' ? `Experten: ${B.code} war am Scheitelpunkt daneben und bekam keine Wagenbreite Platz. 5 Sekunden für ${A.code}.` : v === 'behind' ? `Experten: ${B.code} war am Scheitelpunkt nicht weit genug vorn. ${A.code} darf die volle Strecke nutzen. Keine Strafe.` : `Experten: ${A.code} hat mehr als eine Wagenbreite gelassen, ${B.code} ist selbst zu weit gefahren. Keine Strafe.`
        this.msg(`${this.tag(A)} - ABDRÄNGEN VON ${this.tag(B)} - WIRD UNTERSUCHT`, 'warn')
      } else {
        const v = pick(['one', 'two', 'two', 'brake', 'brake'])
        inc.ideal = { culprit: null, sev: v === 'one' ? 0 : v === 'two' ? 1 : 2 }
        inc.facts = [
          ['Verteidiger', `${A.num} ${A.name} - ${A.team}`],
          ['Angreifer', `${B.num} ${B.name} - ${B.team}`],
          ['Richtungswechsel', v === 'two' ? '2' : '1'],
          ['In der Bremszone', v === 'brake' ? `ja, ${B.code} muss ausweichen` : 'nein, vor dem Bremspunkt'],
        ]
        inc.statements = [
          { code: B.code, text: v === 'brake' ? 'Der zieht beim Bremsen rüber! Das ist lebensgefährlich!' : pick(['Der fährt Schlangenlinien vor mir!', 'Wie oft will er denn noch die Spur wechseln?']) },
          { code: A.code, text: pick(['Ich habe einmal verteidigt, das ist erlaubt.', 'Ich habe ihn gar nicht gesehen.']) },
        ]
        inc.replay = { kind: 'weave', v }
        inc.expert = v === 'one' ? 'Experten: Ein Richtungswechsel vor dem Bremspunkt ist erlaubt. Keine Strafe.' : v === 'two' ? 'Experten: Zweiter Richtungswechsel beim Verteidigen. Verwarnung.' : 'Experten: Spurwechsel in der Bremszone, der Hintermann musste ausweichen. 5 Sekunden.'
        this.msg(`${this.tag(A)} - ${v === 'brake' ? 'SPURWECHSEL BEIM BREMSEN' : 'MEHRFACHER SPURWECHSEL'} - WIRD UNTERSUCHT`, 'warn')
      }
      this.incidents.push(inc)
      return
    }
    if (type === 'cutChicane') {
      if (run.length < 2) return
      const i = Math.floor(rnd(1, run.length))
      const A = run[i], B = run[i - 1] // A liegt hinter B und kürzt ab
      const ch = this.track.corners.filter((c) => /schikane|chicane|bus stop|rettifilo|roggia|ascari|combes|variante|piscine|vale|casio|triangle/i.test(c.name))
      const k = ch.length ? pick(ch) : this.track.cornerAt(mod(A.dist, this.L))
      const loc = { sector: sectorOf(k.idx * this.track.ds, this.L), turn: k.n, label: `Kurve ${k.n} (${k.name})` }
      const v = pick(['kept', 'kept', 'back', 'time', 'lost'])
      const gain = v === 'lost' ? -rnd(0.3, 0.9) : rnd(0.3, 0.8)
      const inc = this.makeBase('decision', 'cutChicane', v === 'kept' || v === 'back' ? [A.id, B.id] : [A.id], loc)
      inc.options = ['nfa', 'warn', 't5', 't10', 'dt']
      inc.ideal = { culprit: null, sev: v === 'kept' ? 2 : v === 'time' ? 1 : 0 }
      inc.facts = [
        ['Fahrer', `${A.num} ${A.name} - ${A.team}`],
        ['Position gewonnen', v === 'kept' || v === 'back' ? `ja, gegen ${B.code}` : 'nein'],
        ['Position zurückgegeben', v === 'kept' ? 'nein' : v === 'back' ? 'ja, noch in derselben Runde' : 'entfällt'],
        ['Zeit durch Abkürzen', `${gain > 0 ? '+' : '-'}${Math.abs(gain).toFixed(1).replace('.', ',')} s ${gain > 0 ? 'gewonnen' : 'verloren'}`],
      ]
      inc.statements = [{ code: A.code, text: pick(['Ich hatte keine Chance, die Kurve noch zu kriegen.', 'Ich musste ausweichen, sonst hätte es gekracht.', 'Ich habe doch nichts gewonnen dadurch!']) }]
      inc.replay = { kind: 'chicane', v }
      inc.expert = v === 'kept' ? 'Experten: Position durch Abkürzen gewonnen und behalten. 5 Sekunden.' : v === 'back' ? 'Experten: Position zurückgegeben, kein dauerhafter Vorteil. Keine Strafe.' : v === 'time' ? 'Experten: Zeit gewonnen, aber keine Position. Verwarnung.' : 'Experten: Zeit verloren, kein Vorteil. Keine Strafe.'
      this.incidents.push(inc)
      this.msg(`${this.tag(A)} - ABKÜRZEN IN ${loc.label.toUpperCase()} - WIRD UNTERSUCHT`, 'warn')
      return
    }
    if (type === 'scGap') {
      if (run.length < 3 || !this.sc) return
      const lead = Math.random() < 0.25
      const A = lead ? run[0] : run[Math.floor(rnd(1, run.length))]
      const B = lead ? null : run[run.indexOf(A) - 1]
      const lens = lead ? Math.round(rnd(13, 24)) : pick([6, 8, 9, 12, 14, 17, 19, 22, 26, 30])
      const inc = this.makeBase('decision', 'scGap', B ? [A.id, B.id] : [A.id], this.where(A))
      inc.options = ['nfa', 'warn', 't5', 't10', 'dt']
      inc.ideal = { culprit: null, sev: lead || lens <= 10 ? 0 : lens <= 20 ? 1 : 2 }
      inc.facts = [
        ['Fahrer', `${A.num} ${A.name} - ${A.team}`],
        ['Vor ihm', lead ? 'Safety Car' : `${B.num} ${B.name}`],
        ['Abstand', `${lens} Wagenlängen (${Math.round(lens * 5.6)} m)`],
        ['Safety Car', lead ? 'Lichter aus, kommt diese Runde rein' : 'Lichter an'],
      ]
      inc.statements = [{ code: A.code, text: lead ? 'Die Lichter waren aus, ich bestimme jetzt das Tempo!' : pick(['Ich habe nur die Reifen aufgewärmt.', 'Die Bremsen waren kalt, ich brauchte Platz.', 'Das waren doch keine zehn Wagenlängen!']) }]
      inc.replay = { kind: 'scgap', lens, lead }
      inc.expert = lead ? 'Experten: Sind die Lichter aus, bestimmt der Führende das Tempo und darf abreißen lassen. Keine Strafe.' : lens <= 10 ? `Experten: ${lens} Wagenlängen sind erlaubt. Keine Strafe.` : lens <= 20 ? `Experten: ${lens} Wagenlängen sind zu viel. Verwarnung.` : `Experten: ${lens} Wagenlängen, deutlich über dem Limit. 5 Sekunden.`
      this.incidents.push(inc)
      this.msg(`${this.tag(A)} - ABSTAND HINTER DEM SAFETY CAR - WIRD UNTERSUCHT`, 'warn')
      return
    }
    if (type === 'overtakeYellow') {
      const i = Math.floor(rnd(1, run.length))
      const A = run[i - 1], B = run[i] // A hat B überholt
      const w = this.where(A)
      const dbl = this.state === 'SC' || this.sectors[w.sector] === 'double'
      const status = this.state === 'VSC' ? (this.sectors[w.sector] === 'double' ? 'VSC mit Doppelgelb' : 'Virtual Safety Car') : this.state === 'SC' ? 'Safety Car' : this.sectors[w.sector] === 'double' ? 'Doppelgelb' : 'Gelb'
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
      this.msg(`${this.tag(A)} - ÜBERHOLEN UNTER ${status.toUpperCase()} - WIRD UNTERSUCHT`, 'warn')
      this.say('overtakeYellow', A, { other: B })
      return
    }
    if (type === 'unsafeRelease') {
      const { a, b, react, gap } = opts // a: aus der Box entlassen, b: Betroffener
      const inc = this.makeBase('decision', 'unsafeRelease', [a.id, b.id], { sector: 0, turn: 1 })
      inc.ideal = { culprit: null, sev: react > 30 ? 2 : react >= 10 ? 1 : 0 }
      inc.facts = [
        ['Freigegeben', `${a.num} ${a.name} - ${a.team}`],
        ['Betroffen', `${b.num} ${b.name} - ${b.team}`],
        ['Abstand bei Freigabe', `${b.code} war ${gap.toFixed(0)} m hinter der Box`],
        ['Reaktion von ' + b.code, `Bremsung -${react} km/h`],
        ['Ort', 'Boxengasse'],
      ]
      inc.statements = [
        {
          code: b.code,
          text: react > 30
            ? pick(['Der kam direkt vor mir raus, ich musste voll auf die Bremse!', 'Ich stand fast! Das war richtig gefährlich.'])
            : react >= 10
              ? pick(['Ich musste lupfen, das war eng.', 'Kurz vom Gas, sonst hätte es gekracht. Aber es ging.'])
              : pick(['Er kam vor mir raus, hat mich aber nicht gestört.', 'Ich habe ihn gesehen. Kein Problem von meiner Seite.']),
        },
        { code: a.code, text: react > 30 ? 'Ich fahre los, wenn das Licht grün wird. Das müsst ihr mit der Crew klären.' : 'Die Ampel war grün und da war Platz genug.' },
      ]
      inc.replay = { kind: 'release', react, gap }
      inc.expert = react > 30
        ? `Experten: ${b.code} musste um ${react} km/h abbremsen, um einen Unfall zu vermeiden. Deutliches Bremsen: 5 Sekunden.`
        : react >= 10
          ? `Experten: ${b.code} musste nur lupfen (${react} km/h langsamer), es bestand keine Gefahr. Verwarnung.`
          : `Experten: ${b.code} wurde praktisch nicht behindert (${react} km/h langsamer). Keine Strafe.`
      inc.consequence = `${b.code} bremst um ${react} km/h.`
      this.incidents.push(inc)
      this.msg(`${this.tag(a)} / ${this.tag(b)} - UNSICHERE FREIGABE - WIRD UNTERSUCHT`, 'warn')
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
      // Erwartete Strafe genau nach Regeltext: 5 Sek., bei Ausfall eines oder beider Autos 10 Sek.
      inc.ideal = { culprit, sev: culprit ? (outcome === 'none' ? 2 : 3) : 0 }
      inc.axle = axle
      inc.outcome = outcome
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
      this.msg(`${this.tag(A)} / ${this.tag(B)} - KOLLISION IN KURVE ${w.turn} - WIRD UNTERSUCHT`, 'warn')
      for (const c of stopped) this.stopCar(c, 'UNFALL')
      // Wer weiterfährt, hat oft einen Schaden und muss zur Reparatur an die Box
      for (const c of [A, B]) if (!stopped.includes(c) && Math.random() < 0.55) { c.damage = true; this.radioQueue.push({ at: this.t + rnd(5, 9), car: c, dmg: true }) }
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
    const allCases = this.feedbackLog.filter((e) => e.text.startsWith('Fall'))
    const cases = allCases.filter((e) => !e.text.endsWith('nicht entschieden'))
    const open = this.incidents.filter((i) => i.kind === 'decision').length
    return {
      grade,
      summary,
      safety: Math.round(this.safety),
      fairness: Math.round(this.fairness),
      flow: Math.round(this.flow),
      decided: cases.length,
      good: cases.filter((e) => e.delta > 0).length,
      missed: allCases.length - cases.length,
      open,
      // Eingriffe der Streckensicherung, getrennt nach Spieler und Automatik
      actsYou: this.feedbackLog.filter((e) => e.safety && e.by === 'du').length,
      actsAuto: this.feedbackLog.filter((e) => e.safety && e.by === 'auto').length,
      log: [...this.feedbackLog].reverse().slice(0, 80),
    }
  }

  // ---------- Ansicht ----------
  snapshot() {
    let st = this.standings()
    const avg = this.L / this.track.lapRef
    const leader = st[0]
    const qBest = this.quali ? Math.min(...this.cars.map((c) => c.bestLap ?? Infinity)) : 0
    if (this.quali) st = [...this.cars].sort((a, b) => (a.bestLap ?? 1e9) - (b.bestLap ?? 1e9) || a.id - b.id)
    const rows = st.map((c, i) => {
      let gap = ''
      if (this.quali) gap = c.status === 'out' ? 'OUT' : c.bestLap ? (c.bestLap === qBest ? lapFmt(c.bestLap) : `+${(c.bestLap - qBest).toFixed(3)}`) : '-'
      else if (c.status === 'fin') gap = 'ZIEL'
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
        serving: !!c.pending,
        tyre: c.tyre,
        wear: Math.round(c.wear * 100),
        stops: c.stops,
        inPit: !!c.pit,
        damage: !!c.damage,
        gap,
      }
    })
    let results = null
    let gridOut = null
    if (this.state === 'FINISHED' && this.quali) {
      // Startaufstellung: nach Bestzeit, danach die Rückversetzungen anwenden
      const q = [...this.cars].sort((a, b) => (a.bestLap ?? 1e9) - (b.bestLap ?? 1e9) || a.id - b.id)
      const fin = q.map((c, i) => ({ c, key: i + (c.gridDrop ? c.gridDrop + 0.5 : 0) })).sort((a, b) => a.key - b.key).map((x) => x.c)
      gridOut = fin.map((c) => c.id)
      results = fin.map((c, i) => ({
        pos: i + 1, code: c.code, name: c.name, team: c.team, color: c.color, num: c.num,
        penaltySec: 0, note: c.gridDrop ? `-${c.gridDrop} Plätze` : '',
        time: c.bestLap ? lapFmt(c.bestLap) : 'keine Zeit',
        best: c.bestLap && c.bestLap !== qBest ? `+${(c.bestLap - qBest).toFixed(3)}` : '',
      }))
    } else if (this.state === 'FINISHED') {
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
      quali: this.quali,
      grid: gridOut,
      diff: this.diffKey,
      medNotReady: this.state === 'GRIDREADY' && this.medReadyAt > this.t,
      pitClosed: this.pitClosed,
      state: this.state,
      lap: leader ? this.lapNo(leader) : 1,
      laps: this.laps,
      sectors: [...this.sectors],
      rows,
      incidents: this.incidents.map((i) => {
        if (i.kind !== 'hazard') return { ...i }
        const c = this.cars[i.carIds[0]]
        return { ...i, haz: { ...c.haz, left: Math.max(0, c.recov != null ? c.recov : (c.rejoinAt || this.t) - this.t) } }
      }),
      messages: this.messages.slice(-60),
      radio: this.radioLog.slice(-40),
      safety: this.safety,
      fairness: this.fairness,
      auto: this.auto,
      autoNote: this.ad.note,
      scEnding: this.scEnding,
      scWaiting: this.scExiting(),
      scCollected: !!(this.sc && this.sc.collected && !this.sc.leaving),
      lapped: this.state === 'SC' && !this.unlapUsed ? this.lappedCars().length : 0,
      unlapping: this.cars.filter((c) => c.unlap || c.unlapped).length,
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

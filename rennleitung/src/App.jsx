import { useEffect, useRef, useState } from 'react'
import { Race, raceTimeStr } from './sim/race.js'
import { SetupDialog, SeasonDialog, HelpDialog } from './components/Menus.jsx'
import { CALENDAR, loadSetup, saveSetup, loadSeason, saveSeason, newSeason, helpSeen, markHelpSeen, gradeOf } from './season.js'
import TrackMap from './components/TrackMap.jsx'
import CamView from './components/CamView.jsx'
import { TimingTower, ControlPanel, IncidentPanel, MessageLog, RadioLog } from './components/Panels.jsx'
import { CaseDialog, ReportDialog } from './components/Dialogs.jsx'
import { sound } from './sound.js'

const STATE_LABEL = {
  GRID: ['STARTAUFSTELLUNG', 'grid'],
  FORMATION: ['EINFÜHRUNGSRUNDE', 'vsc'],
  GRIDREADY: ['STARTAUFSTELLUNG', 'grid'],
  LIGHTS: ['STARTAMPEL', 'red'],
  GREEN: ['GRÜN', 'green'],
  VSC: ['VIRTUAL SAFETY CAR', 'vsc'],
  SC: ['SAFETY CAR', 'sc'],
  RED: ['ROTE FLAGGE', 'red'],
  RESTART: ['NEUSTART', 'red'],
  FINISHED: ['ZIELFLAGGE', 'fin'],
}

// Streckenkamera (zweite Kamera): vorerst ausgeblendet, bis klar ist, wie sie sich verhalten soll
const SHOW_TRACK_CAM = false

const WEATHER = { dry: 'TROCKEN', rain: 'REGEN', heavy: 'STARKREGEN', drying: 'TROCKNET AB' }

const Meter = ({ label, value, title }) => (
  <div className="meter" title={title}>
    <span>{label} <b>{Math.round(value)}</b></span>
    <div className="mbar"><i style={{ width: `${value}%`, background: value > 66 ? '#2fe08a' : value > 33 ? '#ffc94a' : '#ff4a4a' }} /></div>
  </div>
)

export default function App() {
  // Einstellungen für das nächste Rennen und der Stand der Saison (beides im Browser gespeichert)
  const [setup, setSetup] = useState(loadSetup)
  const [season, setSeason] = useState(loadSeason)
  const [menu, setMenu] = useState(() => (helpSeen() ? null : 'help')) // null | 'setup' | 'season' | 'help'
  const inSeason = useRef(false) // läuft gerade ein Saisonrennen?
  const recorded = useRef(null)
  // Streckensicherung manuell oder automatisch; die Wahl bleibt für das nächste Rennen erhalten
  const [auto, setAutoState] = useState(() => {
    try { return localStorage.getItem('rennleitung-auto') === '1' } catch { return false }
  })
  const [race, setRace] = useState(() => {
    const r = new Race(setup.track, setup.laps, { diff: setup.diff, session: setup.mode === 'weekend' ? 'quali' : 'race' })
    r.setAuto(auto)
    return r
  })
  const [snap, setSnap] = useState(() => race.snapshot())
  const [speed, setSpeed] = useState(2)
  const [paused, setPaused] = useState(false)
  const [selected, setSelected] = useState(null)
  const [caseId, setCaseId] = useState(null)
  const [report, setReport] = useState(false)
  const [toast, setToast] = useState(null)
  // Freie Streckenkamera: Mittelpunkt in Metern, wird von Karte und Kamera gemeinsam genutzt
  const freeCam = useRef({ manual: false, x: 0, y: 0, vw: 100, vh: 80, hidden: !SHOW_TRACK_CAM })
  const startSeen = useRef({ lights: 0, state: 'GRID' })
  useEffect(() => {
    const s = startSeen.current
    if (snap.lights > s.lights) sound.light()
    if (s.state === 'LIGHTS' && snap.state === 'GREEN') sound.go()
    s.lights = snap.lights
    s.state = snap.state
  }, [snap.lights, snap.state])
  const [vol, setVol] = useState(sound.volume)
  const [muted, setMuted] = useState(sound.muted)
  const heard = useRef({ msg: 0, radio: 0, inc: 0 })

  // Töne für neue Funksprüche, Meldungen und Vorfälle (höchstens einer je Art pro Aktualisierung)
  useEffect(() => {
    const h = heard.current
    const lastMsg = snap.messages[snap.messages.length - 1]
    const lastRadio = snap.radio[snap.radio.length - 1]
    const maxInc = snap.incidents.reduce((m, i) => Math.max(m, i.id), 0)
    if (lastMsg && lastMsg.id !== h.msg) {
      const fresh = snap.messages.filter((m) => m.id > h.msg)
      const rank = { bad: 4, flag: 3, warn: 2, ok: 1, info: 0 }
      if (h.msg && fresh.length) sound.message(fresh.sort((a, b) => rank[b.level] - rank[a.level])[0].level)
      h.msg = lastMsg.id
    }
    if (lastRadio && lastRadio.id !== h.radio) {
      if (h.radio) lastRadio.box ? sound.box() : sound.radio()
      h.radio = lastRadio.id
    }
    if (maxInc > h.inc) {
      sound.incident(snap.incidents.some((i) => i.id > h.inc && i.kind === 'hazard'))
      h.inc = maxInc
    }
  }, [snap])

  const raceRef = useRef(race)
  raceRef.current = race
  const flags = useRef({})
  flags.current = { speed, paused, dialog: caseId !== null || report || menu !== null }

  useEffect(() => {
    let raf, last = performance.now()
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.25)
      last = now
      const f = flags.current
      if (!f.paused && !f.dialog) {
        let rem = dt * (raceRef.current.state === 'LIGHTS' ? 1 : f.speed)
        while (rem > 0) {
          const h = Math.min(0.05, rem)
          raceRef.current.step(h)
          rem -= h
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const iv = setInterval(() => setSnap(raceRef.current.snapshot()), 120)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(iv)
    }
  }, [])

  // Toasts bei neuen Entscheidungs-Rückmeldungen
  const lastFb = useRef(null)
  useEffect(() => {
    const fb = snap.feedback[snap.feedback.length - 1]
    if (fb && fb.id !== lastFb.current) {
      lastFb.current = fb.id
      setToast(fb)
    }
  }, [snap])
  // Hinweis nach 5 Sekunden ausblenden (eigener Timer, der nicht bei jeder Aktualisierung neu startet)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(id)
  }, [toast])

  // Rennbericht automatisch am Ende
  useEffect(() => {
    if (snap.state === 'FINISHED') setReport(true)
  }, [snap.state])

  // Tasten
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if (['1', '2', '3'].includes(e.key)) raceRef.current.cycleSector(+e.key - 1)
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const toggleAuto = (on) => {
    setAutoState(on)
    raceRef.current.setAuto(on)
    try { localStorage.setItem('rennleitung-auto', on ? '1' : '0') } catch { /* ohne Speicher gilt die Wahl nur für diese Sitzung */ }
  }

  // cfg: Strecke, Runden, Ablauf, Schwierigkeit. grid: Startaufstellung aus dem Qualifying.
  const newRace = (cfg = setup, { grid = null, seasonRace = inSeason.current } = {}) => {
    inSeason.current = seasonRace
    const r = new Race(cfg.track, cfg.laps, { diff: cfg.diff, session: cfg.mode === 'weekend' && !grid ? 'quali' : 'race', grid })
    r.setAuto(auto)
    setRace(r)
    setSnap(r.snapshot())
    setSelected(null)
    setCaseId(null)
    setReport(false)
    setMenu(null)
    setToast(null)
    lastFb.current = null
    heard.current = { msg: 0, radio: 0, inc: 0 }
    freeCam.current.manual = false
  }

  const startSetup = (cfg) => {
    setSetup(cfg)
    saveSetup(cfg)
    newRace(cfg, { seasonRace: false })
  }
  const seasonCfg = (se) => ({ track: CALENDAR[se.races.length], laps: se.laps, mode: se.mode, diff: se.diff })
  const beginSeason = () => {
    const se = newSeason(setup)
    setSeason(se)
    saveSeason(se)
  }
  const nextSeasonRace = () => newRace(seasonCfg(season), { seasonRace: true })
  const resetSeason = () => {
    setSeason(null)
    saveSeason(null)
    inSeason.current = false
  }
  const closeHelp = () => { markHelpSeen(); setMenu(null) }
  const practice = () => { markHelpSeen(); newRace({ track: 'spielberg', laps: 3, mode: 'race', diff: 'easy' }, { seasonRace: false }) }

  // Saisonrennen nach der Zielflagge einmal in die Wertung schreiben
  useEffect(() => {
    if (snap.state !== 'FINISHED' || snap.quali || !inSeason.current || !season || recorded.current === race) return
    recorded.current = race
    const score = snap.report.safety * 0.4 + snap.report.fairness * 0.4 + snap.report.flow * 0.2
    const top = (snap.results || []).filter((x) => x.time !== 'DNF' && x.time !== 'DSQ').slice(0, 10).map((x) => ({ code: x.code, name: x.name, team: x.team, color: x.color }))
    const se = { ...season, races: [...season.races, { track: race.track.key, score, grade: gradeOf(score), top }] }
    setSeason(se)
    saveSeason(se)
  }, [snap.state])

  const [stLabel, stClass] = snap.quali && ['GREEN', 'GRID'].includes(snap.state) ? ['QUALIFYING', 'quali'] : STATE_LABEL[snap.state]
  const row = selected !== null ? snap.rows.find((r) => r.id === selected) : null
  const selCar = selected !== null ? race.cars[selected] : null
  const started = snap.state !== 'GRID'

  return (
    <div className="app">
      <header className="top">
        <div className="logo">327<small>CONTROL</small></div>
        <div className="gp">
          <b>{snap.track.gp.toUpperCase()}</b>
          <span className="dim">{snap.track.name}</span>
        </div>
        <div className={`state ${stClass}`}>
          {stLabel}
          {snap.state === 'RESTART' && ` · ${snap.restartIn}`}
        </div>
        <div className="stat"><span className="dim">RUNDE</span><b>{snap.lap}/{snap.laps}</b></div>
        <div className="stat"><span className="dim">RENNZEIT</span><b>{raceTimeStr(snap.raceTime)}</b></div>
        <div className={`weather ${snap.weather.phase}`}>
          <span className="dim">WETTER</span>
          <b>{WEATHER[snap.weather.phase]}{snap.weather.forecast !== null && snap.weather.forecast < 240 && snap.weather.phase === 'dry' ? ` · Regen in ${Math.ceil(snap.weather.forecast / 60)} min` : ''}</b>
        </div>
        <div className="speeds">
          {[1, 2, 4, 8].map((s) => (
            <button key={s} className={`btn sm ${speed === s ? 'on' : ''}`} onClick={() => setSpeed(s)}>{s}×</button>
          ))}
          <button className={`btn sm ${paused ? 'on' : ''}`} onClick={() => setPaused(!paused)}>{paused ? '▶' : '❚❚'}</button>
        </div>
        <div className="setup">
          <button className="btn sm" onClick={() => setMenu('setup')}>NEUES RENNEN</button>
          <button className={`btn sm ${inSeason.current ? 'on' : ''}`} onClick={() => setMenu('season')}>SAISON</button>
          <button className="btn sm" title="Einführung" onClick={() => setMenu('help')}>HILFE</button>
          <button className="btn sm" onClick={() => setReport(true)}>BERICHT</button>
          <button className={`btn sm ${muted ? '' : 'on'}`} title="Ton an/aus" onClick={() => { sound.setMuted(!muted); setMuted(!muted) }}>{muted ? 'TON AUS' : 'TON'}</button>
          <input id="volume" className="vol" type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} aria-label="Lautstärke" onChange={(e) => { const v = +e.target.value; sound.setVolume(v); setVol(v); setMuted(false) }} />
        </div>
      </header>

      <main className="main">
        <div className="left">
          <TimingTower rows={snap.rows} selected={selected} onSelect={setSelected} state={snap.state} quali={snap.quali} />
          <RadioLog radio={snap.radio} />
        </div>
        <section className="center">
          <div className="stage">
          <div className="panel mapbox">
            <div className="ptitle">STRECKENÜBERSICHT · {snap.track.name.toUpperCase()}</div>
            <TrackMap race={race} selected={selected} onSelect={setSelected} freeCam={freeCam} />
            {snap.state === 'GRID' && (
              <div className="startover">
                {snap.quali
                  ? <button className="btn big ok" onClick={() => race.startQuali()}>QUALIFYING STARTEN</button>
                  : <button className="btn big ok" onClick={() => race.startFormation()}>EINFÜHRUNGSRUNDE FREIGEBEN</button>}
                <div className="hint">{snap.quali ? 'Drei gezeitete Runden, die beste zählt. Du sicherst mit Gelb und entscheidest über Track Limits und Behindern.' : `${snap.laps} Runden. Du sicherst die Strecke und entscheidest über Strafen.`}</div>
              </div>
            )}
            {snap.state === 'GRIDREADY' && (
              <div className="startbox">
                {snap.medNotReady && <div className="stallwarn">⚠ Arztwagen noch nicht bereit. Warte mit dem Start, bis er sich meldet.</div>}
                {snap.stalled.length > 0 && <div className="stallwarn">⚠ {snap.stalled.join(', ')}: Motor abgewürgt. Start abbrechen!</div>}
                <div className="startbtns">
                  <button className="btn big ok" onClick={() => race.startLights()}>STARTAMPEL STARTEN</button>
                  <button className="btn red" onClick={() => race.abortStart()}>START ABBRECHEN</button>
                </div>
                <div className="hint">Ein Abbruch kostet eine Rennrunde: Das Feld fährt eine weitere Einführungsrunde.</div>
              </div>
            )}
            {snap.state === 'LIGHTS' && (
              <div className="lights">
                {[1, 2, 3, 4, 5].map((n) => <i key={n} className={snap.lights >= n ? 'on' : ''} />)}
              </div>
            )}
            {paused && <div className="pausetag">PAUSE</div>}
            {toast && (
              <div className={`toast ${toast.delta > 0 ? 'good' : 'bad'}`}>
                {toast.delta > 0 ? '+' : ''}{toast.delta} Fairness: {toast.text}
              </div>
            )}
          </div>
          <div className={`cams ${SHOW_TRACK_CAM ? '' : 'one'}`}>
            <CamView race={race} mode="follow" selected={selected} />
            {SHOW_TRACK_CAM && <CamView race={race} mode="cctv" selected={selected} freeCam={freeCam} />}
          </div>
          </div>
          <ControlPanel snap={snap} race={race} selectedRow={row} selectedCar={selCar} onAuto={toggleAuto} />
        </section>
        <aside className="right">
          <div className="panel score">
            <div className={`grade sm g${snap.report.grade}`} title="Deine Note, wenn das Rennen jetzt enden würde">{snap.report.grade}</div>
            <Meter label="SICHERHEIT" value={snap.safety} title="Sinkt, wenn Autos an einer ungesicherten Gefahrenstelle vorbeifahren. Zählt 40 %." />
            <Meter label="FAIRNESS" value={snap.fairness} title="Steigt mit richtigen Urteilen, sinkt mit falschen und verpassten. Zählt 40 %." />
            <Meter label="ABLAUF" value={snap.flow} title="Sinkt, wenn das Rennen länger als nötig gebremst wird. Zählt 20 %." />
          </div>
          <IncidentPanel incidents={snap.incidents} t={snap.t} onOpen={setCaseId} race={race} />
          <MessageLog messages={snap.messages} />
        </aside>
      </main>

      {caseId !== null && <CaseDialog race={race} incId={caseId} onClose={() => setCaseId(null)} />}
      {report && menu === null && (
        <ReportDialog
          snap={snap}
          finished={snap.state === 'FINISHED'}
          onClose={() => setReport(false)}
          onNew={() => { setReport(false); setMenu('setup') }}
          onRace={() => newRace(inSeason.current && season ? seasonCfg(season) : setup, { grid: snap.grid })}
          onSeason={inSeason.current ? () => { setReport(false); setMenu('season') } : null}
        />
      )}
      {menu === 'setup' && <SetupDialog setup={setup} onStart={startSetup} onClose={() => setMenu(null)} />}
      {menu === 'season' && <SeasonDialog season={season} setup={setup} onBegin={beginSeason} onNext={nextSeasonRace} onReset={resetSeason} onClose={() => setMenu(null)} />}
      {menu === 'help' && <HelpDialog onClose={closeHelp} onPractice={practice} />}
    </div>
  )
}

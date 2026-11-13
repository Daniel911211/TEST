import { useEffect, useRef, useState } from 'react'
import { Race, clockStr, raceTimeStr } from './sim/race.js'
import { TRACK_LIST } from './sim/tracks.js'
import TrackMap from './components/TrackMap.jsx'
import CamView from './components/CamView.jsx'
import { TimingTower, ControlPanel, IncidentPanel, MessageLog } from './components/Panels.jsx'
import { CaseDialog, ReportDialog } from './components/Dialogs.jsx'
import { sound } from './sound.js'

const STATE_LABEL = {
  GRID: ['STARTAUFSTELLUNG', 'grid'],
  GREEN: ['GRÜN', 'green'],
  VSC: ['VIRTUAL SAFETY CAR', 'vsc'],
  SC: ['SAFETY CAR', 'sc'],
  RED: ['ROTE FLAGGE', 'red'],
  RESTART: ['NEUSTART', 'red'],
  FINISHED: ['ZIELFLAGGE', 'fin'],
}

const WEATHER = { dry: 'TROCKEN', rain: 'REGEN', heavy: 'STARKREGEN', drying: 'TROCKNET AB' }

const Meter = ({ label, value }) => (
  <div className="meter">
    <span>{label} <b>{Math.round(value)}</b></span>
    <div className="mbar"><i style={{ width: `${value}%`, background: value > 66 ? '#2fe08a' : value > 33 ? '#ffc94a' : '#ff4a4a' }} /></div>
  </div>
)

export default function App() {
  const [trackKey, setTrackKey] = useState('spa')
  const [laps, setLaps] = useState(10)
  const [race, setRace] = useState(() => new Race('spa', 10))
  const [snap, setSnap] = useState(() => race.snapshot())
  const [speed, setSpeed] = useState(2)
  const [paused, setPaused] = useState(false)
  const [selected, setSelected] = useState(null)
  const [caseId, setCaseId] = useState(null)
  const [report, setReport] = useState(false)
  const [toast, setToast] = useState(null)
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
  flags.current = { speed, paused, dialog: caseId !== null || report }

  useEffect(() => {
    let raf, last = performance.now()
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.25)
      last = now
      const f = flags.current
      if (!f.paused && !f.dialog) {
        let rem = dt * f.speed
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
      const id = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(id)
    }
  }, [snap])

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

  const newRace = (key = trackKey, n = laps) => {
    const r = new Race(key, n)
    setRace(r)
    setSnap(r.snapshot())
    setSelected(null)
    setCaseId(null)
    setReport(false)
    setToast(null)
    lastFb.current = null
    heard.current = { msg: 0, radio: 0, inc: 0 }
  }

  const [stLabel, stClass] = STATE_LABEL[snap.state]
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
        <div className="stat"><span className="dim">RENNZEIT</span><b>{raceTimeStr(snap.t)}</b></div>
        <div className="stat"><span className="dim">UHRZEIT</span><b>{clockStr(snap.t)}</b></div>
        <div className={`weather ${snap.weather.phase}`}>
          <span className="dim" style={{ fontSize: 9, letterSpacing: 1 }}>WETTER</span>
          <b>{WEATHER[snap.weather.phase]}{snap.weather.forecast !== null && snap.weather.forecast < 240 && snap.weather.phase === 'dry' ? ` · Regen in ${Math.ceil(snap.weather.forecast / 60)} min` : ''}</b>
        </div>
        <div className="speeds">
          {[1, 2, 4, 8].map((s) => (
            <button key={s} className={`btn sm ${speed === s ? 'on' : ''}`} onClick={() => setSpeed(s)}>{s}×</button>
          ))}
          <button className={`btn sm ${paused ? 'on' : ''}`} onClick={() => setPaused(!paused)}>{paused ? '▶' : '❚❚'}</button>
        </div>
        <div className="meters">
          <Meter label="SICHERHEIT" value={snap.safety} />
          <Meter label="FAIRNESS" value={snap.fairness} />
          <Meter label="ABLAUF" value={snap.flow} />
        </div>
        <div className="setup">
          <select value={trackKey} onChange={(e) => { setTrackKey(e.target.value); newRace(e.target.value, laps) }}>
            {TRACK_LIST.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
          <select value={laps} onChange={(e) => { setLaps(+e.target.value); newRace(trackKey, +e.target.value) }}>
            {[3, 5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} Runden</option>)}
          </select>
          <button className="btn sm" onClick={() => setReport(true)}>BERICHT</button>
          <button className={`btn sm ${muted ? '' : 'on'}`} title="Ton an/aus" onClick={() => { sound.setMuted(!muted); setMuted(!muted) }}>{muted ? 'TON AUS' : 'TON AN'}</button>
          <input id="volume" className="vol" type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} aria-label="Lautstärke" onChange={(e) => { const v = +e.target.value; sound.setVolume(v); setVol(v); setMuted(false) }} />
        </div>
      </header>

      <main className="main">
        <TimingTower rows={snap.rows} selected={selected} onSelect={setSelected} state={snap.state} />
        <section className="center">
          <div className="panel mapbox">
            <div className="ptitle">STRECKENÜBERSICHT · {snap.track.name.toUpperCase()}</div>
            <TrackMap race={race} selected={selected} onSelect={setSelected} />
            {snap.state === 'GRID' && (
              <div className="startover">
                <button className="btn big ok" onClick={() => race.start()}>RENNEN STARTEN</button>
                <div className="hint">{snap.laps} Runden · Du bist die Rennleitung: Flaggen, Neutralisierung, Strafen.</div>
              </div>
            )}
            {paused && <div className="pausetag">PAUSE</div>}
            {toast && (
              <div className={`toast ${toast.delta > 0 ? 'good' : 'bad'}`}>
                {toast.delta > 0 ? '+' : ''}{toast.delta} Fairness: {toast.text}
              </div>
            )}
          </div>
          <div className="cams">
            <CamView race={race} mode="follow" selected={selected} />
            <CamView race={race} mode="cctv" selected={selected} />
          </div>
          <ControlPanel snap={snap} race={race} selectedRow={row} selectedCar={selCar} />
        </section>
        <aside className="right">
          <IncidentPanel incidents={snap.incidents} t={snap.t} onOpen={setCaseId} race={race} />
          <MessageLog messages={snap.messages} radio={snap.radio} />
        </aside>
      </main>

      {caseId !== null && <CaseDialog race={race} incId={caseId} onClose={() => setCaseId(null)} />}
      {report && <ReportDialog snap={snap} finished={snap.state === 'FINISHED'} onClose={() => setReport(false)} onNew={() => newRace()} />}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import MapView from './MapView.jsx'
import EinsatzPanel from './ui/EinsatzPanel.jsx'
import WachenPanel from './ui/WachenPanel.jsx'
import SprechwunschPanel from './ui/SprechwunschPanel.jsx'
import FunkPanel from './ui/FunkPanel.jsx'
import OSM_SITES from './data/feuerwehren.json'
import EXTRA_SITES from './data/zusatz-standorte.json'
import {
  GAME_SEC_PER_REAL_SEC, STATION_TYPES,
  newGame, loadGame, saveGame, clearSave, tick, buildStation, fmtClock, fmtMoney, rankOf, nextRank,
} from './game.js'

const SITES = [...OSM_SITES, ...EXTRA_SITES]

// Layout-Rahmen: Kopfzeile, oben Karte + Einsatzbereich, unten Wachen + Sprechwünsche + Funk
export default function App() {
  const gameRef = useRef(null)
  if (!gameRef.current) gameRef.current = loadGame() || newGame()
  const g = gameRef.current
  const [, force] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [build, setBuild] = useState(null) // 'FW' | 'RW' | null
  const [incidentId, setIncidentId] = useState(null)
  const [wsel, setWsel] = useState({ stationId: null, vehicleId: null })
  const [msg, setMsg] = useState('')
  const speedRef = useRef(1)
  speedRef.current = speed

  useEffect(() => {
    let last = performance.now()
    let saveAt = 0
    const id = setInterval(() => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.5)
      last = now
      if (speedRef.current > 0) tick(gameRef.current, dt * speedRef.current * GAME_SEC_PER_REAL_SEC)
      if (now - saveAt > 3000) { saveGame(gameRef.current); saveAt = now }
      force((n) => n + 1)
    }, 200)
    return () => clearInterval(id)
  }, [])

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }
  const siteMode = (k) => SITES.some((s) => (s.kind || 'FW') === k)
  const built = (r) => { if (!r.ok) flash(r.msg); else { setBuild(null); setWsel({ stationId: r.station.id, vehicleId: null }) } }
  const onSiteClick = (site) => {
    const k = site.kind || 'FW'
    if (build !== k) { flash(`Wähle zuerst „${STATION_TYPES[k].name} bauen“.`); return }
    built(buildStation(g, k, site.pos, site.name, site.id))
  }
  const onMapClick = (pos) => {
    if (!build) return
    if (siteMode(build)) { flash(`${STATION_TYPES[build].name}n können nur an den markierten Standorten gebaut werden.`); return }
    built(buildStation(g, build, pos))
  }
  const selectStation = (id) => { if (!build) setWsel({ stationId: id, vehicleId: null }) }
  const next = nextRank(g.points)
  const requests = g.vehicles.filter((v) => v.status === 5).length

  return (
    <div className="app">
      <header>
        <b className="logo">Leitstelle</b>
        <span>🕒 {fmtClock(g.t)}</span>
        <span>💶 {fmtMoney(g.money)}</span>
        <span>⭐ {g.points} · {rankOf(g.points)}{next ? ` (nächster Rang ab ${next[0]})` : ''}</span>
        <span>✔ {g.done} ✖ {g.failed}</span>
        {requests > 0 && <span className="alert">📻 {requests} Sprechwunsch{requests > 1 ? 'e' : ''}</span>}
        <span className="spacer" />
        {[0, 1, 2, 5].map((s) => (
          <button key={s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>{s === 0 ? '⏸' : `${s}x`}</button>
        ))}
        <button onClick={() => { if (confirm('Spielstand wirklich löschen?')) { clearSave(); gameRef.current = newGame(); setIncidentId(null); setWsel({ stationId: null, vehicleId: null }) } }}>Neu</button>
      </header>
      <div className="top">
        <div className="map-wrap">
          <MapView game={g} sites={SITES} selected={{ incidentId, stationId: wsel.stationId }} buildMode={build} onSiteClick={onSiteClick} onMapClick={onMapClick} onSelectIncident={setIncidentId} onSelectStation={selectStation} />
          {build && <div className="banner">{siteMode(build) ? 'Klicke auf einen markierten Standort' : 'Klicke auf die Karte'}, um eine {STATION_TYPES[build].name} zu bauen ({fmtMoney(STATION_TYPES[build].cost)}) <button onClick={() => setBuild(null)}>Abbrechen</button></div>}
          {msg && <div className="toast">{msg}</div>}
        </div>
        <EinsatzPanel g={g} selectedId={incidentId} onSelect={setIncidentId} flash={flash} />
      </div>
      <div className="bottom">
        <WachenPanel g={g} build={build} setBuild={setBuild} sel={wsel} setSel={setWsel} flash={flash} />
        <SprechwunschPanel g={g} flash={flash} />
        <FunkPanel g={g} />
      </div>
    </div>
  )
}

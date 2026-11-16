import { useEffect, useRef, useState } from 'react'
import MapView from './MapView.jsx'
import EinsatzPanel from './ui/EinsatzPanel.jsx'
import WachenPanel from './ui/WachenPanel.jsx'
import SprechwunschPanel from './ui/SprechwunschPanel.jsx'
import FunkPanel from './ui/FunkPanel.jsx'
import WachenOverlay from './ui/WachenOverlay.jsx'
import FahrzeugOverlay from './ui/FahrzeugOverlay.jsx'
import BauFormular from './ui/BauFormular.jsx'
import KlinikOverlay from './ui/KlinikOverlay.jsx'
import SprechwunschOverlay from './ui/SprechwunschOverlay.jsx'
import OSM_SITES from './data/feuerwehren.json'
import EXTRA_SITES from './data/zusatz-standorte.json'
import {
  GAME_SEC_PER_REAL_SEC, STATION_TYPES,
  newGame, loadGame, saveGame, clearSave, tick, buildStation, toggleSpawn, sprechwunschList, fmtClock, fmtMoney, rankOf, nextRank,
} from './game.js'

const SITES = [...OSM_SITES, ...EXTRA_SITES]

// Layout-Rahmen: Kopfzeile, oben Karte + Einsatzbereich, unten Wachen + Sprechwünsche + Funk.
// Overlays (Wache, Fahrzeug) liegen über der Karte.
export default function App() {
  const gameRef = useRef(null)
  if (!gameRef.current) gameRef.current = loadGame() || newGame()
  const g = gameRef.current
  const [, force] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [build, setBuild] = useState(null) // Bauformular: { kind:'FW'|'RW', pos, site, name } | null
  const [incidentId, setIncidentId] = useState(null)
  const [wsel, setWsel] = useState({ stationId: null, vehicleId: null })
  const [focus, setFocus] = useState(null) // { pos, vehicleId, n } für 📍
  const [overlay, setOverlay] = useState(null) // { kind:'station', id, tab } | { kind:'vehicle', id } | null
  const [msg, setMsg] = useState('')
  const speedRef = useRef(1)
  speedRef.current = speed
  // Solange ein Sprechwunsch bearbeitet wird, steht das Spiel (sonst ist der Einsatz beim Tippen schon vorbei)
  const holdRef = useRef(false)
  holdRef.current = overlay?.kind === 'sprech'

  // Spiellogik läuft 20x je Sekunde (auch wenn der Tab im Hintergrund ist; requestAnimationFrame stünde dann still),
  // die Oberfläche wird ca. 10x je Sekunde neu gezeichnet, die Fahrzeugmarker führt MapView jeden Frame nach.
  useEffect(() => {
    let last = performance.now()
    let saveAt = 0
    let drawAt = 0
    const id = setInterval(() => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.5)
      last = now
      if (speedRef.current > 0 && !holdRef.current) tick(gameRef.current, dt * speedRef.current * GAME_SEC_PER_REAL_SEC)
      if (now - saveAt > 3000) { saveGame(gameRef.current); saveAt = now }
      if (now - drawAt > 100) { drawAt = now; force((n) => n + 1) }
    }, 50)
    return () => clearInterval(id)
  }, [])

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }
  const siteMode = (k) => SITES.some((s) => (s.kind || 'FW') === k)
  const openStation = (id, tab) => { setWsel({ stationId: id, vehicleId: null }); setOverlay((o) => ({ kind: 'station', id, tab: tab || (o?.kind === 'station' ? o.tab : 'fahrzeuge') })) }
  const openVehicle = (id) => { const v = g.vehicles.find((x) => x.id === id); setWsel({ stationId: v?.stationId ?? null, vehicleId: id }); setOverlay({ kind: 'vehicle', id }) }
  const openHospital = (id) => setOverlay({ kind: 'hospital', id })
  const openSprech = (vehicleId) => setOverlay({ kind: 'sprech', id: vehicleId })
  // 📍 Fahrzeug auf der Karte zeigen: Overlay schließen, Karte zentrieren, Marker einige Sekunden hervorheben
  const locateVehicle = (id) => {
    const v = g.vehicles.find((x) => x.id === id)
    if (!v) return
    setOverlay(null)
    setFocus({ pos: [...v.pos], vehicleId: id, n: Date.now() })
    setTimeout(() => setFocus((f) => (f?.vehicleId === id ? null : f)), 4000)
  }
  const closeOverlay = () => { setOverlay(null); setWsel((s) => ({ ...s, vehicleId: null })) }
  const startBuild = () => setBuild(build ? null : { kind: 'FW', pos: null, site: null, name: '' })
  // Standort wählen: markierter Standort (Feuerwachen) oder freier Kartenpunkt; gebaut wird erst mit „Bauen“ im Formular
  const onSiteClick = (site) => {
    if (!build) { flash('Klicke zuerst auf „Neues Gebäude bauen“.'); return }
    const k = site.kind || 'FW'
    if (build.kind !== k) { flash(`Dieser Standort ist für eine ${STATION_TYPES[k].name} vorgesehen.`); return }
    setBuild({ ...build, pos: site.pos, site })
  }
  const onMapClick = (pos) => {
    if (!build) return
    if (siteMode(build.kind)) { flash(`${STATION_TYPES[build.kind].name}n können nur an den markierten Standorten gebaut werden.`); return }
    setBuild({ ...build, pos, site: null })
  }
  const doBuild = () => {
    if (!build?.pos) return
    const r = buildStation(g, build.kind, build.pos, build.name.trim() || build.site?.name, build.site?.id)
    if (!r.ok) flash(r.msg); else { setBuild(null); openStation(r.station.id, 'markt') }
  }
  const selectStation = (id) => { if (!build) openStation(id) }
  const selectVehicle = (id) => { if (!build) openVehicle(id) }
  const next = nextRank(g.points)
  const requests = sprechwunschList(g).length
  const reset = () => {
    if (!confirm('Spielstand wirklich löschen?')) return
    clearSave(); gameRef.current = newGame(); setIncidentId(null); setWsel({ stationId: null, vehicleId: null }); setOverlay(null)
  }

  return (
    <div className="app">
      <header>
        <b className="logo">Leitstelle</b>
        <span>🕒 {fmtClock(g.t)}</span>
        <span>💶 {fmtMoney(g.money)}</span>
        <span>⭐ {g.points} · {rankOf(g.points)}{next ? ` (nächster Rang ab ${next[0]})` : ''}</span>
        <span>✔ {g.done} ✖ {g.failed}</span>
        {requests > 0 && <span className="alert click" onClick={() => openSprech(sprechwunschList(g)[0].id)}>📻 {requests} Sprechwunsch{requests > 1 ? 'e' : ''}</span>}
        <span className="spacer" />
        {holdRef.current && <span className="alert" title="Das Spiel steht, bis der Sprechwunsch beantwortet oder geschlossen ist.">⏸ Sprechwunsch</span>}
        {[0, 1, 2, 5, 10].map((s) => (
          <button key={s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>{s === 0 ? '⏸' : `${s}x`}</button>
        ))}
        <button className={g.spawnPaused ? 'spawn-off' : 'on'} title={g.spawnPaused ? 'Es kommen keine neuen Einsätze. Klicken zum Einschalten.' : 'Neue Einsätze werden erzeugt. Klicken zum Anhalten.'} onClick={() => toggleSpawn(g)}>
          {g.spawnPaused ? '🚫 Neue Einsätze aus' : '🚨 Neue Einsätze an'}
        </button>
        <button onClick={reset}>Neu</button>
      </header>
      <div className="top">
        <div className="map-wrap">
          <MapView game={g} sites={SITES} selected={{ incidentId, stationId: wsel.stationId }} focus={focus} buildMode={build?.kind || null} buildPos={build?.pos || null} onSiteClick={onSiteClick} onMapClick={onMapClick} onSelectIncident={setIncidentId} onSelectStation={selectStation} onSelectVehicle={selectVehicle} onSelectHospital={(id) => { if (!build) openHospital(id) }} />
          {build && <BauFormular g={g} build={build} setBuild={setBuild} siteMode={siteMode} onBuild={doBuild} />}
          {overlay?.kind === 'station' && (
            <WachenOverlay g={g} stationId={overlay.id} tab={overlay.tab} setTab={(tab) => setOverlay({ ...overlay, tab })} onClose={closeOverlay} onOpenStation={openStation} onOpenVehicle={openVehicle} flash={flash} />
          )}
          {overlay?.kind === 'hospital' && (
            <KlinikOverlay g={g} hospitalId={overlay.id} onClose={closeOverlay} onOpenHospital={openHospital} flash={flash} />
          )}
          {overlay?.kind === 'sprech' && (
            <SprechwunschOverlay g={g} vehicleId={overlay.id} onClose={closeOverlay} onOpenSprech={openSprech} onSelectIncident={setIncidentId} flash={flash} />
          )}
          {overlay?.kind === 'vehicle' && (
            <FahrzeugOverlay g={g} vehicleId={overlay.id} onClose={closeOverlay} onOpenVehicle={openVehicle} onOpenStation={openStation} onLocate={locateVehicle} flash={flash} />
          )}
          {msg && <div className="toast">{msg}</div>}
        </div>
        <EinsatzPanel g={g} selectedId={incidentId} onSelect={setIncidentId} onLocate={locateVehicle} flash={flash} />
      </div>
      <div className="bottom">
        <WachenPanel g={g} building={!!build} onStartBuild={startBuild} sel={wsel} setSel={setWsel} onOpenStation={openStation} onOpenVehicle={openVehicle} onLocate={locateVehicle} />
        <SprechwunschPanel g={g} onOpenHospital={openHospital} />
        <FunkPanel g={g} onOpenSprech={openSprech} />
      </div>
    </div>
  )
}

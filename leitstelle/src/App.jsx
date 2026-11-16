import { useEffect, useRef, useState } from 'react'
import MapView from './MapView.jsx'
import OSM_SITES from './data/feuerwehren.json'
import EXTRA_SITES from './data/zusatz-standorte.json'

const SITES = [...OSM_SITES, ...EXTRA_SITES]
import {
  GAME_SEC_PER_REAL_SEC, STATION_TYPES, VEHICLE_TYPES, STATUS_TEXT, MAX_VEHICLES_PER_STATION, ROLES,
  newGame, loadGame, saveGame, clearSave, tick, buildStation, buyVehicle, dispatch, recommend,
  isAvailable, etaSec, SEVERITY_TEXT, HOSPITALS, hospitalFree, transportOptions, confirmTransport, repairQuote, sendToWorkshop, buildWorkshop, WORKSHOP_COST, fmtClock, fmtMin, fmtMoney, rankOf, nextRank,
} from './game.js'

export default function App() {
  const gameRef = useRef(null)
  if (!gameRef.current) gameRef.current = loadGame() || newGame()
  const g = gameRef.current
  const [, force] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [tab, setTab] = useState('einsaetze')
  const [build, setBuild] = useState(null) // 'FW' | 'RW' | null
  const [sel, setSel] = useState({ incidentId: null, stationId: null })
  const [picked, setPicked] = useState([])
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
  const inc = g.incidents.find((i) => i.id === sel.incidentId)
  const station = g.stations.find((s) => s.id === sel.stationId)

  const siteMode = (k) => SITES.some((s) => (s.kind || 'FW') === k)
  const onSiteClick = (site) => {
    const k = site.kind || 'FW'
    if (build !== k) { flash(`Wähle zuerst „${STATION_TYPES[k].name} bauen“.`); return }
    const r = buildStation(g, k, site.pos, site.name, site.id)
    if (!r.ok) flash(r.msg)
    else { setBuild(null); setSel({ incidentId: null, stationId: r.station.id }); setTab('wachen') }
  }
  const onMapClick = (pos) => {
    if (!build) return
    if (siteMode(build)) { flash(`${STATION_TYPES[build].name}n können nur an den markierten Standorten gebaut werden.`); return }
    const r = buildStation(g, build, pos)
    if (!r.ok) flash(r.msg)
    else { setBuild(null); setSel({ incidentId: null, stationId: r.station.id }); setTab('wachen') }
  }
  const selectIncident = (id) => { setSel({ incidentId: id, stationId: null }); setPicked([]); setTab('einsaetze') }
  const selectStation = (id) => { if (!build) { setSel({ incidentId: null, stationId: id }); setTab('wachen') } }

  const need = inc ? Object.entries(inc.need) : []
  const onScene = inc ? g.vehicles.filter((v) => v.incidentId === inc.id) : []
  const sum = (key) => onScene.reduce((a, v) => a + (VEHICLE_TYPES[v.type][key] || 0), 0)
  const assigned = inc ? g.vehicles.filter((v) => v.incidentId === inc.id) : []
  const free = inc ? g.vehicles.filter(isAvailable).sort((a, b) => etaSec(a, inc.pos) - etaSec(b, inc.pos)) : []
  const send = () => { dispatch(g, inc.id, picked); setPicked([]) }
  const next = nextRank(g.points)
  const requests = g.vehicles.filter((v) => v.status === 5)
  const doConfirm = (vid, hid) => { const r = confirmTransport(g, vid, hid); if (!r.ok) flash(r.msg) }

  return (
    <div className="app">
      <header>
        <b className="logo">Leitstelle</b>
        <span>🕒 {fmtClock(g.t)}</span>
        <span>💶 {fmtMoney(g.money)}</span>
        <span>⭐ {g.points} · {rankOf(g.points)}{next ? ` (nächster Rang ab ${next[0]})` : ''}</span>
        <span>✔ {g.done} ✖ {g.failed}</span>
        <span className="spacer" />
        {[0, 1, 2, 5].map((s) => (
          <button key={s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>{s === 0 ? '⏸' : `${s}x`}</button>
        ))}
        <button onClick={() => { if (confirm('Spielstand wirklich löschen?')) { clearSave(); gameRef.current = newGame(); setSel({}); } }}>Neu</button>
      </header>
      <div className="main">
        <MapView game={g} sites={SITES} selected={sel} buildMode={build} onSiteClick={onSiteClick} onMapClick={onMapClick} onSelectIncident={selectIncident} onSelectStation={selectStation} />
        {build && <div className="banner">{siteMode(build) ? 'Klicke auf einen markierten Standort' : 'Klicke auf die Karte'}, um eine {STATION_TYPES[build].name} zu bauen ({fmtMoney(STATION_TYPES[build].cost)}) <button onClick={() => setBuild(null)}>Abbrechen</button></div>}
        {msg && <div className="toast">{msg}</div>}
        <aside>
          <nav>
            {[['einsaetze', `Einsätze (${g.incidents.length})`], ['wachen', 'Wachen'], ['fahrzeuge', 'Fahrzeuge'], ['log', `Funk${requests.length ? ` (${requests.length}❗)` : ''}`]].map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
            ))}
          </nav>

          {tab === 'einsaetze' && (
            <div className="pane">
              {!g.incidents.length && <p className="muted">{g.stations.length ? 'Keine offenen Einsätze. Warte auf den nächsten Alarm …' : 'Baue zuerst Wachen (Tab „Wachen“).'}</p>}
              <ul className="list">
                {g.incidents.map((i) => (
                  <li key={i.id} className={sel.incidentId === i.id ? 'sel' : ''} onClick={() => selectIncident(i.id)}>
                    <b>{i.type.name}</b>
                    <small>{i.status === 'working' ? `in Bearbeitung – ${fmtMin(i.workLeft)}` : `wartet seit ${fmtMin(g.t - i.created)} (Limit ${fmtMin(i.type.deadline)})`}</small>
                  </li>
                ))}
              </ul>
              {inc && (
                <div className="card">
                  <h3>{inc.type.name}</h3>
                  <p><small className="muted">{inc.type.bild}</small></p>
                  <p>Benötigt: {need.map(([k, n]) => `${n}× ${ROLES[k].name}`).join(', ')}
                    {inc.revealed && Object.keys(inc.extra).length > 0 && <><br /><b style={{ color: '#f4a300' }}>Nachforderung erhalten</b></>}
                    {inc.type.water > 0 && <><br />Wasser: {sum('water')} / {inc.type.water} l · Atemschutztrupps: {sum('as')} / {inc.type.as}</>}
                    <br />Belohnung: {fmtMoney(inc.type.reward)}</p>
                  {assigned.length > 0 && (
                    <><h4>Alarmiert</h4><ul className="mini">{assigned.map((v) => <li key={v.id}>{v.callsign} – S{v.status}</li>)}</ul></>
                  )}
                  {inc.status === 'open' && (
                    <>
                      <h4>Freie Fahrzeuge</h4>
                      <button onClick={() => setPicked(recommend(g, inc))}>Empfehlung wählen</button>
                      <ul className="mini">
                        {free.map((v) => (
                          <li key={v.id}>
                            <label>
                              <input type="checkbox" checked={picked.includes(v.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, v.id] : picked.filter((x) => x !== v.id))} />
                              {v.callsign} · S{v.status} · {Math.round(v.condition)} % · {fmtMin(etaSec(v, inc.pos))}
                            </label>
                          </li>
                        ))}
                        {!free.length && <li className="muted">Keine freien Fahrzeuge.</li>}
                      </ul>
                      <button className="primary" disabled={!picked.length} onClick={send}>Alarmieren ({picked.length})</button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'wachen' && (
            <div className="pane">
              <div className="row">
                {Object.entries(STATION_TYPES).map(([k, d]) => (
                  <button key={k} disabled={g.money < d.cost} className={build === k ? 'on' : ''} onClick={() => setBuild(build === k ? null : k)}>
                    {d.name} bauen<br /><small>{fmtMoney(d.cost)}</small>
                  </button>
                ))}
              </div>
              <ul className="list">
                {g.stations.map((s) => (
                  <li key={s.id} className={sel.stationId === s.id ? 'sel' : ''} onClick={() => setSel({ incidentId: null, stationId: s.id })}>
                    <b>{s.name}</b> <small>{STATION_TYPES[s.kind].name} · {g.vehicles.filter((v) => v.stationId === s.id).length}/{MAX_VEHICLES_PER_STATION} Fahrzeuge</small>
                  </li>
                ))}
              </ul>
              {station && (
                <div className="card">
                  <h3>{station.name}</h3>
                  <h4>Werkstatt</h4>
                  {station.workshop ? <p className="muted">Eigene Werkstatt vorhanden: Reparatur 40 % günstiger und doppelt so schnell.</p> : (
                    <button disabled={g.money < WORKSHOP_COST} onClick={() => { const r = buildWorkshop(g, station.id); if (!r.ok) flash(r.msg) }}>Werkstatt bauen – {fmtMoney(WORKSHOP_COST)}</button>
                  )}
                  <h4>Fahrzeug kaufen</h4>
                  {Object.entries(VEHICLE_TYPES).filter(([, d]) => d.kind === station.kind).map(([k, d]) => (
                    <button key={k} disabled={g.money < d.cost} onClick={() => { const r = buyVehicle(g, station.id, k); if (!r.ok) flash(r.msg) }}>
                      {d.name} – {fmtMoney(d.cost)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'fahrzeuge' && (
            <div className="pane">
              <ul className="list">
                {g.vehicles.map((v) => (
                  <li key={v.id}>
                    <span><span className={`st s${v.status}`}>{v.status}</span> <b>{v.callsign}</b></span>
                    <small>{STATUS_TEXT[v.status]}{v.status === 6 ? ` – noch ${fmtMin(v.timer)}` : ''}</small>
                    <div className="cond"><i style={{ width: `${Math.round(v.condition)}%`, background: v.condition < 30 ? '#d62828' : v.condition < 60 ? '#f4a300' : '#4caf50' }} /></div>
                    <small>Zustand {Math.round(v.condition)} %{v.condition < 30 ? ' – Pannengefahr!' : ''}</small>
                    {v.status === 2 && v.condition < 100 && (() => { const q = repairQuote(g, v); return (
                      <button onClick={(e) => { e.stopPropagation(); const r = sendToWorkshop(g, v.id); if (!r.ok) flash(r.msg) }}>
                        In Werkstatt ({fmtMin(q.duration)}, {fmtMoney(q.cost)})
                      </button>) })()}
                  </li>
                ))}
                {!g.vehicles.length && <p className="muted">Noch keine Fahrzeuge.</p>}
              </ul>
            </div>
          )}

          {tab === 'log' && (
            <div className="pane">
              {requests.map((v) => {
                const opts = transportOptions(g, v)
                const wish = opts.find((h) => h.id === v.request.wishId)
                return (
                  <div className="card req" key={v.id}>
                    <h3>📻 {v.callsign} – Status 5</h3>
                    {wish ? (
                      <p>„Patient möchte nach <b>{wish.name}</b>.“<br />Kapazität: {wish.free > 0 ? <b style={{ color: '#4caf50' }}>{wish.free} Betten frei</b> : <b style={{ color: '#d62828' }}>keine Kapazität</b>}</p>
                    ) : <p>„Erbitte Zielklinik für den Patienten.“<br /><small className="muted">Patient {SEVERITY_TEXT[v.request.severity || 1]} – die Leitstelle entscheidet.</small></p>}
                    {wish && wish.free > 0 && <button className="primary" onClick={() => doConfirm(v.id, wish.id)}>Wunschklinik bestätigen</button>}
                    <h4>{wish && wish.free <= 0 ? 'Gegenvorschlag der Leitstelle' : 'Andere Klinik'}</h4>
                    {opts.filter((h) => h.id !== wish?.id || wish.free <= 0).map((h) => (
                      <button key={h.id} disabled={h.free <= 0 || h.id === wish?.id} onClick={() => doConfirm(v.id, h.id)}>
                        {h.name} · {h.dist.toFixed(1)} km · {h.free > 0 ? `${h.free} frei` : 'voll'}
                      </button>
                    ))}
                  </div>
                )
              })}
              <h4 className="muted">Kliniken (freie Betten)</h4>
              <ul className="mini">{HOSPITALS.map((h) => <li key={h.id}>{h.name}: <b>{hospitalFree(g, h.id)}</b>/{h.capacity}</li>)}</ul>
              <h4 className="muted">Funkverkehr</h4>
              <ul className="mini">{g.log.map((l, i) => <li key={i}><small>{fmtClock(l.t)}</small> {l.text}</li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

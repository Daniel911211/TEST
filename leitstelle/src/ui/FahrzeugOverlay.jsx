import { useState } from 'react'
import { VEHICLE_TYPES, STATUS_TEXT, HOSPITALS, WERKSTATT_BY_ID, incidentTitle, sondersignal, repairQuote, hasOwnWorkshop, workshopOptions, sendToWorkshop, recallVehicle, sellPrice, fmtMin, fmtMoney } from '../game.js'
import { vehiclesOf, stationOf } from './helpers.js'
import Overlay from './Overlay.jsx'
import { CondBar, incidentOf, sell } from './WachenOverlay.jsx'

// Overlay eines Fahrzeugs: Wache, Typ, Status, Zustand, Einsatz; Rückalarmieren, Werkstatt, Verkaufen
export default function FahrzeugOverlay({ g, vehicleId, onClose, onOpenVehicle, onOpenStation, onLocate, flash }) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  if (!v) return null
  const d = VEHICLE_TYPES[v.type]
  const st = stationOf(g, v)
  const inc = incidentOf(g, v)
  // v.hospital ist das Klinik-Objekt (so speichert es confirmTransport); zur Sicherheit auch Kennungen auflösen
  const hosp = v.hospital && (v.status === 7 || v.status === 8) ? (typeof v.hospital === 'object' ? v.hospital : HOSPITALS.find((h) => h.id === v.hospital)) : null
  const siblings = st ? vehiclesOf(g, st.id) : [v]
  const idx = siblings.indexOf(v)
  const go = (k) => onOpenVehicle(siblings[(idx + k + siblings.length) % siblings.length].id)
  const q = v.status === 2 && v.condition < 100 ? repairQuote(g, v) : null
  const own = q && hasOwnWorkshop(g, v)
  const [wahl, setWahl] = useState(false) // Liste der Lkw-Werkstätten aufgeklappt
  const werk = v.status === 6 && v.werkstatt ? WERKSTATT_BY_ID[v.werkstatt] : null
  const wsText = werk ? (v.wsPhase === 'fahrt' ? 'auf Anfahrt' : v.wsPhase === 'warten' ? 'wartet auf einen freien Platz' : `in Reparatur, noch ${fmtMin(v.timer)}`) : ''

  return (
    <Overlay
      title={v.callsign} sub={`${d.name} · ${d.kind === 'RW' ? 'Rettungsdienst' : d.water > 0 ? 'Löschfahrzeug' : 'Sonderfahrzeug'}`}
      head={<>
        <button className="small" title="Auf der Karte zeigen" onClick={() => onLocate(v.id)}>📍 Auf Karte</button>
        {st && <button className="small" onClick={() => onOpenStation(st.id)}>Zur Wache</button>}
      </>}
      onClose={onClose} onPrev={siblings.length > 1 ? () => go(-1) : null} onNext={siblings.length > 1 ? () => go(1) : null}
    >
      <div className="pad fz-facts">
        <div><span className="muted">Wache</span> <b>{st?.name || '–'}</b></div>
        <div><span className="muted">Status</span> <span className={`st s${v.status}`}>{v.status}</span> {STATUS_TEXT[v.status]}{v.status === 6 && !werk ? ` – noch ${fmtMin(v.timer)}` : ''}</div>
        {werk && <div><span className="muted">Werkstatt</span> <b>{werk.name}</b> ({werk.ort}) – {wsText}</div>}
        <div><span className="muted">Einsatz</span> {inc ? <b>{incidentTitle(inc)}</b> : '–'}</div>
        {(v.status === 1 || v.status === 3 || v.status === 7 || (werk && v.wsPhase === 'fahrt')) && <div><span className="muted">Fahrt</span> {sondersignal(g, v) ? <b className="amber">mit Sondersignal</b> : 'ohne Sondersignal (langsamer)'}</div>}
        {hosp && <div><span className="muted">Zielklinik</span> <b>{hosp.name}</b></div>}
        {d.water > 0 && <div><span className="muted">Ausstattung</span> {d.water} l Wasser · {d.as} Atemschutztrupp{d.as !== 1 ? 's' : ''}</div>}
        <div><span className="muted">Höchstgeschwindigkeit</span> {d.speed} km/h</div>
        <div><span className="muted">Zustand</span> {Math.round(v.condition)} %{v.condition < 30 ? <b className="red"> – Pannengefahr!</b> : ''}<CondBar c={v.condition} /></div>
        <div className="ef-actions">
          {(v.status === 3 || v.status === 4) && <button onClick={() => { const atScene = v.status === 4; const r = recallVehicle(g, v.id); flash(r.ok ? `${v.callsign} ${atScene ? 'vom Einsatz abgezogen' : 'rückalarmiert'}.` : r.msg) }}>{v.status === 4 ? 'Vom Einsatz abziehen' : 'Rückalarmieren'}</button>}
          {q && own && <button onClick={() => { const r = sendToWorkshop(g, v.id); flash(r.ok ? 'In die eigene Werkstatt geschickt.' : r.msg) }}>Eigene Werkstatt ({fmtMin(q.duration)}, {fmtMoney(q.cost)})</button>}
          {q && <button onClick={() => setWahl(!wahl)}>{wahl ? 'Werkstattwahl schließen' : 'Lkw-Werkstatt wählen …'}</button>}
          {v.status === 2 && <button onClick={() => { if (sell(g, v, flash)) onClose() }}>Verkaufen (+{fmtMoney(sellPrice(v))})</button>}
        </div>
        {q && wahl && (
          <div className="klinik-wahl werkstatt-wahl">
            <small className="muted">Lkw-Werkstätten nach Fahrzeit (Anfahrt ohne Sondersignal). Ist kein Platz frei, wartet das Fahrzeug dort.</small>
            {workshopOptions(g, v).map((w) => (
              <button key={w.id} disabled={g.money < w.cost} onClick={() => { const r = sendToWorkshop(g, v.id, w.id); flash(r.ok ? `Fahrt zur Werkstatt ${w.name}.` : r.msg); if (r.ok) setWahl(false) }}>
                <b>{w.name}</b> <span className="muted">({w.ort})</span> · Anfahrt {fmtMin(w.eta)} · Reparatur {fmtMin(w.duration)} · {fmtMoney(w.cost)} · <span className={w.free > 0 ? 'green' : 'red'}>{w.free > 0 ? `${w.free} ${w.free > 1 ? 'Plätze' : 'Platz'} frei` : `belegt, ${w.waiting} wartend`}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Overlay>
  )
}

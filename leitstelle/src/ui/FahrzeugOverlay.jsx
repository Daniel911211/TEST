import { VEHICLE_TYPES, STATUS_TEXT, HOSPITALS, repairQuote, sendToWorkshop, recallVehicle, sellPrice, fmtMin, fmtMoney } from '../game.js'
import { vehiclesOf, stationOf } from './helpers.js'
import Overlay from './Overlay.jsx'
import { CondBar, incidentOf, sell } from './WachenOverlay.jsx'

// Overlay eines Fahrzeugs: Wache, Typ, Status, Zustand, Einsatz; Rückalarmieren, Werkstatt, Verkaufen
export default function FahrzeugOverlay({ g, vehicleId, onClose, onOpenVehicle, onOpenStation, flash }) {
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

  return (
    <Overlay
      title={v.callsign} sub={`${d.name} · ${d.kind === 'RW' ? 'Rettungsdienst' : d.water > 0 ? 'Löschfahrzeug' : 'Sonderfahrzeug'}`}
      head={st && <button className="small" onClick={() => onOpenStation(st.id)}>Zur Wache</button>}
      onClose={onClose} onPrev={siblings.length > 1 ? () => go(-1) : null} onNext={siblings.length > 1 ? () => go(1) : null}
    >
      <div className="pad fz-facts">
        <div><span className="muted">Wache</span> <b>{st?.name || '–'}</b></div>
        <div><span className="muted">Status</span> <span className={`st s${v.status}`}>{v.status}</span> {STATUS_TEXT[v.status]}{v.status === 6 ? ` – noch ${fmtMin(v.timer)}` : ''}</div>
        <div><span className="muted">Einsatz</span> {inc ? <b>{inc.type.name}</b> : '–'}</div>
        {hosp && <div><span className="muted">Zielklinik</span> <b>{hosp.name}</b></div>}
        {d.water > 0 && <div><span className="muted">Ausstattung</span> {d.water} l Wasser · {d.as} Atemschutztrupp{d.as !== 1 ? 's' : ''}</div>}
        <div><span className="muted">Höchstgeschwindigkeit</span> {d.speed} km/h</div>
        <div><span className="muted">Zustand</span> {Math.round(v.condition)} %{v.condition < 30 ? <b className="red"> – Pannengefahr!</b> : ''}<CondBar c={v.condition} /></div>
        <div className="ef-actions">
          {(v.status === 3 || v.status === 4) && <button onClick={() => { const atScene = v.status === 4; const r = recallVehicle(g, v.id); flash(r.ok ? `${v.callsign} ${atScene ? 'vom Einsatz abgezogen' : 'rückalarmiert'}.` : r.msg) }}>{v.status === 4 ? 'Vom Einsatz abziehen' : 'Rückalarmieren'}</button>}
          {q && <button onClick={() => { const r = sendToWorkshop(g, v.id); flash(r.ok ? 'In die Werkstatt geschickt.' : r.msg) }}>In Werkstatt ({fmtMin(q.duration)}, {fmtMoney(q.cost)})</button>}
          {v.status === 2 && <button onClick={() => { if (sell(g, v, flash)) onClose() }}>Verkaufen (+{fmtMoney(sellPrice(v))})</button>}
        </div>
      </div>
    </Overlay>
  )
}

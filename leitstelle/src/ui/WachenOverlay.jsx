import { VEHICLE_TYPES, STATUS_TEXT, incidentTitle, buyVehicle, sellVehicle, sellPrice, repairQuote, sendToWorkshop, buildWorkshop, WORKSHOP_COST, fmtMin, fmtMoney, vehicleUnlocked, unlockText } from '../game.js'
import { VEHICLE_GROUPS, groupOf, vehiclesOf, stationTypeName, shortName } from './helpers.js'
import Overlay from './Overlay.jsx'

// Reiter je Wachentyp – hier später Erweiterungen, Lager usw. ergänzen
const TABS = {
  FW: [['fahrzeuge', 'Fahrzeuge'], ['markt', 'Fahrzeugmarkt'], ['ausbau', 'Ausbau']],
  RW: [['fahrzeuge', 'Fahrzeuge'], ['markt', 'Fahrzeugmarkt'], ['ausbau', 'Ausbau']],
}

export const incidentOf = (g, v) => g.incidents.find((i) => i.id === v.incidentId)

// Overlay einer Wache: Kopf mit Kennzahlen, Reiter Fahrzeuge / Fahrzeugmarkt / Ausbau
export default function WachenOverlay({ g, stationId, tab, setTab, onClose, onOpenStation, onOpenVehicle, flash }) {
  const station = g.stations.find((s) => s.id === stationId)
  if (!station) return null
  const idx = g.stations.indexOf(station)
  const vehicles = vehiclesOf(g, station.id)
  const tabs = TABS[station.kind] || TABS.FW
  const cur = tabs.some(([k]) => k === tab) ? tab : tabs[0][0]
  const go = (d) => onOpenStation(g.stations[(idx + d + g.stations.length) % g.stations.length].id)

  return (
    <Overlay
      title={<><span className={`wk wk-${station.kind}`}>{station.kind}</span> {station.name}</>}
      sub={`${stationTypeName(station)} · ${vehicles.length} Fahrzeug${vehicles.length !== 1 ? 'e' : ''} · Werkstatt: ${station.workshop ? 'ja' : 'nein'}`}
      head={<button className="small" onClick={() => setTab('markt')}>Fahrzeugmarkt</button>}
      tabs={tabs} tab={cur} setTab={setTab} onClose={onClose}
      onPrev={g.stations.length > 1 ? () => go(-1) : null} onNext={g.stations.length > 1 ? () => go(1) : null}
    >
      {cur === 'fahrzeuge' && <FahrzeugeTab g={g} station={station} vehicles={vehicles} onOpenVehicle={onOpenVehicle} flash={flash} setTab={setTab} />}
      {cur === 'markt' && <MarktTab g={g} station={station} flash={flash} />}
      {cur === 'ausbau' && <AusbauTab g={g} station={station} flash={flash} />}
    </Overlay>
  )
}

function FahrzeugeTab({ g, station, vehicles, onOpenVehicle, flash, setTab }) {
  if (!vehicles.length) return <p className="muted pad">Noch kein Fahrzeug. <button className="small" onClick={() => setTab('markt')}>Zum Fahrzeugmarkt</button></p>
  return (
    <table className="tbl">
      <thead><tr><th>Status</th><th>Funkrufname</th><th>Typ</th><th>Einsatz</th><th>Zustand</th><th></th></tr></thead>
      <tbody>
        {vehicles.map((v) => {
          const inc = incidentOf(g, v)
          const q = v.status === 2 && v.condition < 100 ? repairQuote(g, v) : null
          return (
            <tr key={v.id} className="click" onClick={() => onOpenVehicle(v.id)}>
              <td><span className={`st s${v.status}`} title={STATUS_TEXT[v.status]}>{v.status}</span></td>
              <td title={v.callsign}><b>{shortName(v, station)}</b></td>
              <td>{VEHICLE_TYPES[v.type].name}</td>
              <td className="muted">{inc ? incidentTitle(inc) : v.status === 6 ? `Werkstatt – noch ${fmtMin(v.timer)}` : '–'}</td>
              <td style={{ minWidth: 70 }}><CondBar c={v.condition} /></td>
              <td className="nowrap" onClick={(e) => e.stopPropagation()}>
                {q && <button className="small" title={`${fmtMin(q.duration)}, ${fmtMoney(q.cost)}`} onClick={() => { const r = sendToWorkshop(g, v.id); if (!r.ok) flash(r.msg) }}>Werkstatt</button>}
                {v.status === 2 && <button className="small" onClick={() => sell(g, v, flash)}>Verkaufen</button>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function MarktTab({ g, station, flash }) {
  const types = Object.entries(VEHICLE_TYPES).filter(([, d]) => d.kind === station.kind || d.kind === 'ANY')
  const groups = VEHICLE_GROUPS.map(([k, name]) => [name, types.filter(([t]) => groupOf(t) === k)]).filter(([, l]) => l.length)
  return (
    <div className="pad">
      {groups.map(([name, list]) => (
        <div key={name} className="markt-gruppe">
          <h4>{name}</h4>
          <div className="buy-grid">
            {list.map(([k, d]) => {
              const owned = g.vehicles.filter((v) => v.stationId === station.id && v.type === k).length
              const locked = !vehicleUnlocked(g, k)
              return (
                <button key={k} className={`buy${locked ? ' locked' : ''}`} disabled={locked || g.money < d.cost} title={locked ? unlockText(k) : undefined} onClick={() => { if (confirm(`${d.name} für ${fmtMoney(d.cost)} kaufen?`)) { const r = buyVehicle(g, station.id, k); flash(r.ok ? `${d.name} gekauft (−${fmtMoney(d.cost)})` : r.msg) } }}>
                  <b>{d.name}</b>
                  {d.water > 0 ? <small className="muted">{d.water} l Wasser · {d.as} AS-Trupp{d.as !== 1 ? 's' : ''}</small> : <small className="muted">{d.kind === 'RW' ? 'Rettungsdienst' : 'Sonderfahrzeug'}</small>}
                  <small>{locked ? `🔒 ${unlockText(k)}` : `${fmtMoney(d.cost)}${owned ? ` · ${owned} in Besitz` : ''}`}</small>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function AusbauTab({ g, station, flash }) {
  return (
    <div className="pad">
      <div className="card">
        <h4>Werkstatt</h4>
        {station.workshop
          ? <p className="green">Vorhanden – Reparaturen 40 % günstiger und doppelt so schnell.</p>
          : <>
            <p className="muted">Eigene Werkstatt: Reparaturen 40 % günstiger und doppelt so schnell.</p>
            <button disabled={g.money < WORKSHOP_COST} onClick={() => { const r = buildWorkshop(g, station.id); flash(r.ok ? 'Werkstatt gebaut.' : r.msg) }}>Werkstatt bauen – {fmtMoney(WORKSHOP_COST)}</button>
          </>}
      </div>
      <p className="muted">Weitere Erweiterungen (Stellplätze, Fahrzeugtypen) kommen in einer späteren Runde.</p>
    </div>
  )
}

export function CondBar({ c }) {
  return (
    <div className="cond" title={`Zustand ${Math.round(c)} %`}>
      <i style={{ width: `${Math.round(c)}%`, background: c < 30 ? '#d62828' : c < 60 ? '#f4a300' : '#4caf50' }} />
    </div>
  )
}

export function sell(g, v, flash) {
  if (!confirm(`${v.callsign} für ${fmtMoney(sellPrice(v))} verkaufen?`)) return false
  const r = sellVehicle(g, v.id)
  flash(r.ok ? `Verkauft (+${fmtMoney(r.price)})` : r.msg)
  return r.ok
}

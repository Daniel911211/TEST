import { useState } from 'react'
import { STATION_TYPES, VEHICLE_TYPES, STATUS_TEXT, buyVehicle, sellVehicle, sellPrice, repairQuote, sendToWorkshop, buildWorkshop, WORKSHOP_COST, fmtMin, fmtMoney } from '../game.js'
import { vehiclesOf, stationTypeName } from './helpers.js'

// Unten links: Wachenliste mit Fahrzeugen, Bauknöpfe, Details einer Wache und eines Fahrzeugs
export default function WachenPanel({ g, build, setBuild, sel, setSel, flash }) {
  const [typ, setTyp] = useState('alle')
  const [q, setQ] = useState('')
  const station = g.stations.find((s) => s.id === sel.stationId)
  const vehicle = g.vehicles.find((v) => v.id === sel.vehicleId)
  const list = g.stations
    .filter((s) => typ === 'alle' || s.kind === typ)
    .filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <section className="panel wachen">
      <div className="panel-head">
        Wachen <span className="count">{g.stations.length}</span>
        <span className="spacer" />
        {Object.entries(STATION_TYPES).map(([k, d]) => (
          <button key={k} disabled={g.money < d.cost && build !== k} className={build === k ? 'on' : ''} title={fmtMoney(d.cost)} onClick={() => setBuild(build === k ? null : k)}>
            {build === k ? 'Abbrechen' : `${d.name} bauen`}
          </button>
        ))}
      </div>
      <div className="chips">
        <button className={typ === 'alle' ? 'on' : ''} onClick={() => setTyp('alle')}>Alle</button>
        {Object.entries(STATION_TYPES).map(([k, d]) => <button key={k} className={typ === k ? 'on' : ''} onClick={() => setTyp(k)}>{d.name}</button>)}
        <input className="search" placeholder="Wache suchen" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="scroll">
        {!g.stations.length && <p className="muted pad">Noch keine Wache. Klicke oben auf „Feuerwache bauen“ und dann auf einen Bauplatz auf der Karte.</p>}
        {list.map((s) => (
          <div key={s.id} className={`wache ${sel.stationId === s.id ? 'sel' : ''}`}>
            <div className="wache-head" onClick={() => setSel({ stationId: sel.stationId === s.id ? null : s.id, vehicleId: null })}>
              <span className={`wk wk-${s.kind}`}>{s.kind}</span>
              <b>{s.name}</b>
              <small className="muted">{stationTypeName(s)}{s.workshop ? ' · Werkstatt' : ''}</small>
              <span className="spacer" />
              <button className="small" onClick={(e) => { e.stopPropagation(); setSel({ stationId: s.id, vehicleId: null }) }}>Details</button>
            </div>
            <div className="wache-fz">
              {vehiclesOf(g, s.id).map((v) => (
                <div key={v.id} className={`fz ${sel.vehicleId === v.id ? 'sel' : ''}`} title={STATUS_TEXT[v.status]} onClick={() => setSel({ stationId: s.id, vehicleId: v.id })}>
                  <span className={`st s${v.status}`}>{v.status}</span>
                  <span className="fz-name">{v.callsign}</span>
                </div>
              ))}
            </div>
            {sel.stationId === s.id && !vehicle && <WacheDetails g={g} station={s} flash={flash} />}
            {sel.stationId === s.id && vehicle && vehicle.stationId === s.id && <FahrzeugDetails g={g} v={vehicle} flash={flash} onClose={() => setSel({ stationId: s.id, vehicleId: null })} />}
          </div>
        ))}
      </div>
    </section>
  )
}

function WacheDetails({ g, station, flash }) {
  const [group, setGroup] = useState(null)
  const types = Object.entries(VEHICLE_TYPES).filter(([, d]) => d.kind === station.kind || d.kind === 'ANY')
  return (
    <div className="card">
      <h4>Ausbau</h4>
      {station.workshop ? <p className="muted">Eigene Werkstatt: Reparatur 40 % günstiger und doppelt so schnell.</p> : (
        <button disabled={g.money < WORKSHOP_COST} onClick={() => { const r = buildWorkshop(g, station.id); if (!r.ok) flash(r.msg) }}>Werkstatt bauen – {fmtMoney(WORKSHOP_COST)}</button>
      )}
      <h4>Fahrzeug kaufen</h4>
      <div className="buy-grid">
        {types.map(([k, d]) => {
          const owned = g.vehicles.filter((v) => v.stationId === station.id && v.type === k).length
          return (
            <button key={k} className="buy" disabled={g.money < d.cost} onClick={() => { if (confirm(`${d.name} für ${fmtMoney(d.cost)} kaufen?`)) { const r = buyVehicle(g, station.id, k); flash(r.ok ? `${d.name} gekauft (−${fmtMoney(d.cost)})` : r.msg) } }}>
              <b>{d.name}</b>
              <small>{fmtMoney(d.cost)}{owned ? ` · ${owned} vorhanden` : ''}</small>
              {d.water > 0 && <small className="muted">{d.water} l · {d.as} AS-Trupp{d.as !== 1 ? 's' : ''}</small>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FahrzeugDetails({ g, v, flash, onClose }) {
  const q = v.status === 2 && v.condition < 100 ? repairQuote(g, v) : null
  return (
    <div className="card">
      <div className="ef-row">
        <h4>{v.callsign}</h4>
        <button className="small" onClick={onClose}>✕</button>
      </div>
      <p>
        {VEHICLE_TYPES[v.type].name} · <span className={`st s${v.status}`}>{v.status}</span> {STATUS_TEXT[v.status]}{v.status === 6 ? ` – noch ${fmtMin(v.timer)}` : ''}
      </p>
      <div className="cond"><i style={{ width: `${Math.round(v.condition)}%`, background: v.condition < 30 ? '#d62828' : v.condition < 60 ? '#f4a300' : '#4caf50' }} /></div>
      <small className="muted">Zustand {Math.round(v.condition)} %{v.condition < 30 ? ' – Pannengefahr!' : ''}</small>
      <div className="ef-actions">
        {q && <button onClick={() => { const r = sendToWorkshop(g, v.id); if (!r.ok) flash(r.msg) }}>In Werkstatt ({fmtMin(q.duration)}, {fmtMoney(q.cost)})</button>}
        {v.status === 2 && <button onClick={() => { if (confirm(`${v.callsign} für ${fmtMoney(sellPrice(v))} verkaufen?`)) { const r = sellVehicle(g, v.id); if (r.ok) { flash(`Verkauft (+${fmtMoney(r.price)})`); onClose() } else flash(r.msg) } }}>Verkaufen (+{fmtMoney(sellPrice(v))})</button>}
      </div>
    </div>
  )
}

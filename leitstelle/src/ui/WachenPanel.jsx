import { useState } from 'react'
import { STATION_TYPES, STATUS_TEXT, fmtMoney } from '../game.js'
import { vehiclesOf, stationTypeName } from './helpers.js'

// Unten links: Wachenliste mit Fahrzeugen und Bauknöpfe. Details öffnen das Wachen- bzw. Fahrzeug-Overlay über der Karte.
export default function WachenPanel({ g, build, setBuild, sel, setSel, onOpenStation, onOpenVehicle }) {
  const [typ, setTyp] = useState('alle')
  const [q, setQ] = useState('')
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
              <button className="small" onClick={(e) => { e.stopPropagation(); onOpenStation(s.id) }}>Details</button>
            </div>
            <div className="wache-fz">
              {vehiclesOf(g, s.id).map((v) => (
                <div key={v.id} className={`fz ${sel.vehicleId === v.id ? 'sel' : ''}`} title={STATUS_TEXT[v.status]} onClick={() => onOpenVehicle(v.id)}>
                  <span className={`st s${v.status}`}>{v.status}</span>
                  <span className="fz-name">{v.callsign}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

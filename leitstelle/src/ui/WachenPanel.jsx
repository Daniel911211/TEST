import { useState } from 'react'
import Suchfeld from './Suchfeld.jsx'
import { STATION_TYPES, STATUS_TEXT } from '../game.js'
import { vehiclesOf, stationTypeName, shortName } from './helpers.js'

// Unten links: Wachenliste mit Fahrzeugen und Bauknöpfe. Details öffnen das Wachen- bzw. Fahrzeug-Overlay über der Karte.
export default function WachenPanel({ g, building, onStartBuild, sel, setSel, onOpenStation, onOpenVehicle, onLocate }) {
  const [typ, setTyp] = useState('alle')
  const [q, setQ] = useState('')
  const list = g.stations
    .filter((s) => typ === 'alle' || s.kind === typ)
    .filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <section className="panel wachen">
      <div className="panel-head">
        Wachen <span className="count">{g.stations.length}</span>
        <button className={building ? 'on' : ''} onClick={onStartBuild}>{building ? 'Bauen abbrechen' : 'Neues Gebäude bauen'}</button>
        <span className="spacer" />
      </div>
      <div className="chips">
        <button className={typ === 'alle' ? 'on' : ''} onClick={() => setTyp('alle')}>Alle</button>
        {Object.entries(STATION_TYPES).map(([k, d]) => <button key={k} className={typ === k ? 'on' : ''} onClick={() => setTyp(k)}>{d.name}</button>)}
        <Suchfeld placeholder="Wache suchen" value={q} onChange={setQ} />
      </div>
      <div className="scroll">
        {!g.stations.length && <p className="muted pad">Noch keine Wache. Klicke oben auf „Neues Gebäude bauen“, wähle den Typ und dann einen Standort auf der Karte.</p>}
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
                <div key={v.id} className={`fz ${sel.vehicleId === v.id ? 'sel' : ''}`} title={`${v.callsign} – ${STATUS_TEXT[v.status]}`} onClick={() => onOpenVehicle(v.id)}>
                  <span className={`st s${v.status}`}>{v.status}</span>
                  <span className="fz-name">{shortName(v, s)}</span>
                  <span className="pin" title="Auf der Karte zeigen" onClick={(e) => { e.stopPropagation(); onLocate(v.id) }}>📍</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

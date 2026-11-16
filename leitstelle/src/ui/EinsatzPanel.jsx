import { useState } from 'react'
import { ROLES, VEHICLE_TYPES, matchSlots, isAvailable, etaSec, dispatch, recommend, askElw2, requestLagemeldung, fmtMin, fmtMoney } from '../game.js'
import { VEHICLE_GROUPS, groupOf, stationOf } from './helpers.js'

const needText = (need) => Object.entries(need).map(([k, n]) => `${n}× ${ROLES[k].short}`).join(', ')

// Rechte Spalte: Einsatzliste oben, darunter das Einsatzfenster des gewählten Einsatzes
export default function EinsatzPanel({ g, selectedId, onSelect, flash }) {
  const [picked, setPicked] = useState([])
  const [filter, setFilter] = useState('alle')
  const inc = g.incidents.find((i) => i.id === selectedId)

  const select = (id) => { setPicked([]); onSelect(id) }

  return (
    <section className="panel einsatz">
      <div className="panel-head">Einsätze <span className="count">{g.incidents.length}</span>{g.spawnPaused && <small className="red">· keine neuen Einsätze</small>}</div>
      <div className="einsatz-liste">
        {!g.incidents.length && <p className="muted pad">{g.stations.length ? 'Keine offenen Einsätze. Warte auf den nächsten Alarm …' : 'Baue zuerst eine Wache (unten links).'}</p>}
        {g.incidents.map((i) => {
          const assigned = g.vehicles.filter((v) => v.incidentId === i.id)
          const missing = matchSlots(i.need, assigned)
          const miss = Object.keys(missing).length > 0
          const cls = i.status === 'working' ? 'working' : i.dispatched ? 'dispatched' : 'open'
          return (
            <div key={i.id} className={`inc ${cls} ${selectedId === i.id ? 'sel' : ''}`} onClick={() => select(i.id)}>
              <div className="inc-title">
                <span className={`inc-dot ${cls}`} />
                <b>{i.type.name}</b>
                <small className="muted">{i.status === 'working' ? `noch ${fmtMin(i.workLeft)}` : `seit ${fmtMin(g.t - i.created)}`}</small>
              </div>
              {i.status === 'working' && <div className="bar"><i style={{ width: `${Math.round(100 - (100 * i.workLeft) / i.type.work)}%` }} /></div>}
              {miss && <div className="inc-miss">Fehlt noch: {needText(missing)}</div>}
              {i.nachDone && !miss && <div className="inc-note">Nachforderung erfüllt</div>}
              {i.escalated && <div className="inc-note red">Stichwort hochgestuft</div>}
            </div>
          )
        })}
      </div>
      {inc && <EinsatzFenster g={g} inc={inc} picked={picked} setPicked={setPicked} filter={filter} setFilter={setFilter} flash={flash} />}
    </section>
  )
}

function EinsatzFenster({ g, inc, picked, setPicked, filter, setFilter, flash }) {
  const assigned = g.vehicles.filter((v) => v.incidentId === inc.id)
  const onScene = assigned.filter((v) => v.status === 4)
  const sum = (key) => onScene.reduce((a, v) => a + (VEHICLE_TYPES[v.type][key] || 0), 0)
  const missing = matchSlots(inc.need, assigned)
  const elVeh = g.vehicles.find((v) => v.id === inc.el && v.incidentId === inc.id && v.status === 4)
  const elwAtScene = onScene.some((v) => v.type === 'ELW1')
  const free = g.vehicles
    .filter(isAvailable)
    .filter((v) => filter === 'alle' || groupOf(v.type) === filter)
    .sort((a, b) => etaSec(a, inc.pos) - etaSec(b, inc.pos))
  const toggle = (id, on) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id))
  const send = () => { dispatch(g, inc.id, picked); setPicked([]) }

  return (
    <div className="einsatz-fenster">
      <div className="ef-head">
        <h3>{inc.type.name}</h3>
        <small className="muted">{inc.type.bild}</small>
        <div className="ef-facts">
          <span>Benötigt: {needText(inc.need)}</span>
          <span>Belohnung: {fmtMoney(inc.type.reward)}</span>
          {inc.type.water > 0 && <span>Wasser {sum('water')} / {inc.type.water} l · Atemschutztrupps {sum('as')} / {inc.type.as}</span>}
          {elVeh && <span>Einsatzleitung: <b>{elVeh.callsign}</b></span>}
          {inc.revealed && <span className="muted">Lagemeldung liegt vor.</span>}
        </div>
        {Object.keys(missing).length > 0 && <div className="ef-miss">Fehlende Fahrzeuge: {needText(missing)}</div>}
        <div className="ef-actions">
          {elVeh && !inc.revealed && <button onClick={() => { const r = requestLagemeldung(g, inc.id); if (!r.ok) flash(r.msg) }}>📻 Lagemeldung anfordern</button>}
          {inc.type.elw2Ask && !inc.elw2Asked && elwAtScene && <button onClick={() => { const r = askElw2(g, inc.id); if (!r.ok) flash(r.msg) }}>📻 ELW 1 anfunken: ELW 2 nötig?</button>}
        </div>
      </div>

      {assigned.length > 0 && (
        <div className="ef-block">
          <h4>Alarmiert</h4>
          <table className="tbl">
            <tbody>
              {assigned.map((v) => (
                <tr key={v.id}>
                  <td><span className={`st s${v.status}`}>{v.status}</span></td>
                  <td><b>{v.callsign}</b></td>
                  <td className="muted">{stationOf(g, v)?.name}</td>
                  <td className="muted">{v.status === 3 ? fmtMin(etaSec(v, inc.pos)) : v.status === 4 ? 'vor Ort' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inc.status === 'open' && (
        <div className="ef-block grow">
          <div className="ef-row">
            <h4>Freie Fahrzeuge</h4>
            <button onClick={() => setPicked(recommend(g, inc))}>Empfehlung</button>
          </div>
          <div className="chips">
            {VEHICLE_GROUPS.map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}
          </div>
          <table className="tbl">
            <thead><tr><th /><th /><th>Fahrzeug</th><th>Typ</th><th>Fahrzeit</th><th>Wache</th></tr></thead>
            <tbody>
              {free.map((v) => (
                <tr key={v.id} className={picked.includes(v.id) ? 'sel' : ''} onClick={() => toggle(v.id, !picked.includes(v.id))}>
                  <td><input type="checkbox" checked={picked.includes(v.id)} onChange={(e) => toggle(v.id, e.target.checked)} onClick={(e) => e.stopPropagation()} /></td>
                  <td><span className={`st s${v.status}`}>{v.status}</span></td>
                  <td><b>{v.callsign}</b>{v.condition < 30 ? <small className="red"> Panne?</small> : null}</td>
                  <td className="muted">{VEHICLE_TYPES[v.type].name}</td>
                  <td>{fmtMin(etaSec(v, inc.pos))}</td>
                  <td className="muted">{stationOf(g, v)?.name}</td>
                </tr>
              ))}
              {!free.length && <tr><td colSpan={6} className="muted">Keine freien Fahrzeuge.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {inc.status === 'open' && (
        <div className="ef-foot">
          <button className="primary" disabled={!picked.length} onClick={send}>Alarmieren ({picked.length})</button>
        </div>
      )}
    </div>
  )
}

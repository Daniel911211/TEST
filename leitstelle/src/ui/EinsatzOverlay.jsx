import { useState } from 'react'
import { ROLES, VEHICLE_TYPES, SLOW, LOG_KINDS, matchSlots, isAvailable, etaSec, dispatch, recommend, recallVehicle, askElw2, requestLagemeldung, addVermerk, incidentTitle, fmtClock, fmtMin, fmtMoney } from '../game.js'
import { VEHICLE_GROUPS, groupOf, stationOf } from './helpers.js'
import Overlay from './Overlay.jsx'
import { playAlarm } from '../sound.js'

const needText = (need) => Object.entries(need).map(([k, n]) => `${n}× ${ROLES[k].short}`).join(', ')

// Einsatz-Overlay (geöffnet über „Alarm“ in der Einsatzliste oder den Marker): Fakten, Tagebuch, alarmierte und freie Fahrzeuge.
// Vor/Zurück blättert durch alle Einsätze. Auswahl und Filter werden je Einsatz neu begonnen (key = Einsatz-ID).
export default function EinsatzOverlay({ g, incidentId, onClose, onOpenIncident, onLocate, flash }) {
  const inc = g.incidents.find((i) => i.id === incidentId)
  if (!inc) return null
  const idx = g.incidents.indexOf(inc)
  const go = (d) => onOpenIncident(g.incidents[(idx + d + g.incidents.length) % g.incidents.length].id)
  return <Fenster key={inc.id} g={g} inc={inc} onClose={onClose} onLocate={onLocate} flash={flash} onPrev={g.incidents.length > 1 ? () => go(-1) : null} onNext={g.incidents.length > 1 ? () => go(1) : null} />
}

function Fenster({ g, inc, onClose, onLocate, flash, onPrev, onNext }) {
  const [picked, setPicked] = useState([])
  const [filter, setFilter] = useState(inc.type.id[0] === 'R' ? 'rd' : 'fw') // Rettungsdienst-Einsätze starten beim Rettungsdienst
  const assigned = g.vehicles.filter((v) => v.incidentId === inc.id)
  const tf = inc.type.ohneSS ? SLOW : 1 // Fahrzeit ohne Sondersignal
  const onScene = assigned.filter((v) => v.status === 4)
  const sum = (key) => onScene.reduce((a, v) => a + (VEHICLE_TYPES[v.type][key] || 0), 0)
  const missing = matchSlots(inc.need, assigned)
  const elVeh = g.vehicles.find((v) => v.id === inc.el && v.incidentId === inc.id && v.status === 4)
  const elwAtScene = onScene.some((v) => v.type === 'ELW1')
  const free = g.vehicles
    .filter(isAvailable)
    .filter((v) => groupOf(v.type) === filter)
    .sort((a, b) => etaSec(a, inc.pos, tf) - etaSec(b, inc.pos, tf))
  const toggle = (id, on) => setPicked(on ? [...picked, id] : picked.filter((x) => x !== id))
  const send = () => { const r = dispatch(g, inc.id, picked); if (r?.ok !== false && picked.length) playAlarm(); setPicked([]) }
  const state = inc.status === 'working' ? `in Bearbeitung · noch ${fmtMin(inc.workLeft)}` : inc.dispatched ? 'Kräfte alarmiert' : 'offen'

  return (
    <Overlay
      title={<><span className={`inc-dot ${inc.status === 'working' ? 'working' : inc.dispatched ? 'dispatched' : 'open'}`} /> {incidentTitle(inc)}</>}
      sub={`${inc.type.name}${inc.type.ohneSS ? ' · ohne Sondersignal' : ''} · ${state} · seit ${fmtMin(g.t - inc.created)}`}
      onClose={onClose} onPrev={onPrev} onNext={onNext}
      foot={inc.status === 'open' && <button className="primary" style={{ width: 'auto' }} disabled={!picked.length} onClick={send}>Alarmieren ({picked.length})</button>}
    >
      <div className="einsatz-fenster">
        <div className="ef-head">
          <div className="ef-facts">
            <span>Benötigt: {needText(inc.need)}</span>
            <span>Belohnung: {fmtMoney(inc.type.reward)}</span>
            {inc.type.water > 0 && <span>Wasser {sum('water')} / {inc.type.water} l · Atemschutztrupps {sum('as')} / {inc.type.as}</span>}
            {elVeh && <span>Einsatzleitung: <b>{elVeh.callsign}</b></span>}
            {inc.revealed && <span className="muted">Lagemeldung liegt vor (siehe Tagebuch).</span>}
          </div>
          {Object.keys(missing).length > 0 && <div className="ef-miss">Fehlende Fahrzeuge: {needText(missing)}</div>}
          <div className="ef-actions">
            {elVeh && !inc.revealed && <button onClick={() => { const r = requestLagemeldung(g, inc.id); if (!r.ok) flash(r.msg) }}>📻 Lagemeldung anfordern</button>}
            {inc.type.elw2Ask && !inc.elw2Asked && elwAtScene && <button onClick={() => { const r = askElw2(g, inc.id); if (!r.ok) flash(r.msg) }}>📻 ELW 1 anfunken: ELW 2 nötig?</button>}
          </div>
        </div>

        <Tagebuch g={g} inc={inc} flash={flash} />

        {assigned.length > 0 && (
          <div className="ef-block">
            <h4>Alarmiert</h4>
            <table className="tbl">
              <tbody>
                {assigned.map((v) => (
                  <tr key={v.id}>
                    <td><span className={`st s${v.status}`}>{v.status}</span></td>
                    <td><b>{v.callsign}</b> <span className="pin" title="Auf der Karte zeigen" onClick={() => onLocate(v.id)}>📍</span></td>
                    <td className="muted">{stationOf(g, v)?.name}</td>
                    <td className="muted">{v.status === 3 ? fmtMin(etaSec(v, inc.pos, tf)) : v.status === 4 ? 'vor Ort' : ''}</td>
                    <td className="nowrap">{(v.status === 3 || v.status === 4) && <button className="small" title={v.status === 4 ? 'Fahrzeug vom Einsatz entlassen (Status 1)' : 'Rückalarmieren (Status 1)'} onClick={() => { const r = recallVehicle(g, v.id); if (!r.ok) flash(r.msg) }}>{v.status === 4 ? 'Entlassen' : 'Rückalarm.'}</button>}</td>
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
                    <td><b>{v.callsign}</b>{v.condition < 30 ? <small className="red"> Panne?</small> : null} <span className="pin" title="Auf der Karte zeigen" onClick={(e) => { e.stopPropagation(); onLocate(v.id) }}>📍</span></td>
                    <td className="muted">{VEHICLE_TYPES[v.type].name}</td>
                    <td>{fmtMin(etaSec(v, inc.pos, tf))}</td>
                    <td className="muted">{stationOf(g, v)?.name}</td>
                  </tr>
                ))}
                {!free.length && <tr><td colSpan={6} className="muted">Keine freien Fahrzeuge.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Overlay>
  )
}

// Einsatztagebuch: alle Ereignisse des Einsatzes aus dem Protokoll (chronologisch) plus Vermerke der Leitstelle
function Tagebuch({ g, inc, flash }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(true)
  const list = g.log.filter((l) => l.inc === inc.id).reverse()
  const add = () => { const r = addVermerk(g, inc.id, text); if (r.ok) setText(''); else flash(r.msg) }
  return (
    <div className="ef-block">
      <div className="ef-row">
        <h4>Einsatztagebuch {list.length > 0 && <span className="count">{list.length}</span>}</h4>
        <button className="small" onClick={() => setOpen(!open)}>{open ? 'Einklappen' : 'Ausklappen'}</button>
      </div>
      {open && list.length === 0 && <small className="muted">Noch keine Einträge.</small>}
      {open && list.map((e, i) => (
        <div key={i} className={`vermerk-zeile funk-${e.kind || 'info'}`}>
          <small className="muted">{fmtClock(e.t)}{LOG_KINDS[e.kind] ? ` · ${LOG_KINDS[e.kind]}` : ''}</small>
          <div>{e.text}</div>
        </div>
      ))}
      <div className="ef-row vermerk-neu">
        <input className="search" style={{ marginLeft: 0, width: '100%' }} placeholder="Vermerk eintragen …" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
        <button className="small" disabled={!text.trim()} onClick={add}>Eintragen</button>
      </div>
    </div>
  )
}

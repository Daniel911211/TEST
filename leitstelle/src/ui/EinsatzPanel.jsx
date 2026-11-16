import { useState } from 'react'
import { ROLES, matchSlots, incidentTitle, fmtMin } from '../game.js'

const needText = (need) => Object.entries(need).map(([k, n]) => `${n}× ${ROLES[k].short}`).join(', ')

// Rechte Spalte: Suchfeld, darunter scrollbare Einsatzkarten. Jede Karte hat eine Kopfzeile mit Knopf „Alarm“
// (öffnet das Einsatz-Overlay) und darunter Statusstreifen, Fortschrittsbalken und Hinweise.
// Die Karte selbst reagiert nicht auf Klicks.
export default function EinsatzPanel({ g, selectedId, onOpenIncident, onOpenSprech }) {
  const [q, setQ] = useState('')
  const list = g.incidents.filter((i) => !q.trim() || `${incidentTitle(i)} ${i.type.name}`.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <section className="panel einsatz">
      <div className="panel-head">Einsätze <span className="count">{g.incidents.length}</span>{g.spawnPaused && <small className="red">· keine neuen Einsätze</small>}</div>
      <div className="einsatz-such"><input className="search" placeholder="🔍 Einsätze durchsuchen …" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="einsatz-liste scroll">
        {!g.incidents.length && <p className="muted pad">{g.stations.length ? 'Keine offenen Einsätze. Warte auf den nächsten Alarm …' : 'Baue zuerst eine Wache (unten links).'}</p>}
        {g.incidents.length > 0 && !list.length && <p className="muted pad">Kein Einsatz passt zur Suche.</p>}
        {list.map((i) => {
          const assigned = g.vehicles.filter((v) => v.incidentId === i.id)
          const missing = matchSlots(i.need, assigned)
          const miss = Object.keys(missing).length > 0
          const cls = i.status === 'working' ? 'working' : i.dispatched ? 'dispatched' : 'open'
          const sprech = assigned.find((v) => v.sprechwunsch || v.status === 5)
          const enRoute = assigned.filter((v) => v.status === 3).length
          const pct = i.status === 'working' ? Math.round(100 - (100 * i.workLeft) / i.type.work) : 0
          return (
            <div key={i.id} className={`inc-card ${cls} ${selectedId === i.id ? 'sel' : ''}`}>
              <div className="inc-head">
                <button className={`alarm ${cls}`} title="Einsatz öffnen und Fahrzeuge alarmieren" onClick={() => onOpenIncident(i.id)}>Alarm</button>
                <span className={`inc-dot ${cls}`} />
                <span className="inc-t"><b>{incidentTitle(i)}</b><small className="muted">{i.type.name}</small></span>
                <small className="muted right">{i.status === 'working' ? `noch ${fmtMin(i.workLeft)}` : `seit ${fmtMin(g.t - i.created)}`}</small>
              </div>
              <div className="inc-body">
                <div className="inc-strip" title={cls === 'working' ? 'In Bearbeitung' : cls === 'dispatched' ? 'Kräfte alarmiert' : 'Offen'}>
                  <span>{cls === 'working' ? '🛠' : cls === 'dispatched' ? '🚒' : '🔔'}</span>
                </div>
                <div className="inc-content">
                  <div className="bar" title={i.status === 'working' ? `Bearbeitung ${pct} %` : enRoute ? `${enRoute} Fahrzeug${enRoute > 1 ? 'e' : ''} auf Anfahrt` : 'Noch keine Bearbeitung'}><i style={{ width: `${pct}%` }} /></div>
                  {miss && <div className="inc-box red">Fehlt noch: {needText(missing)}</div>}
                  {sprech && <div className="inc-box red click" onClick={() => onOpenSprech(sprech.id)}>📻 {sprech.callsign} hat einen Sprechwunsch.</div>}
                  {i.nachDone && !miss && <div className="inc-box amber">Nachforderung erfüllt</div>}
                  {i.escalated && <div className="inc-box amber">Stichwort hochgestuft</div>}
                  {assigned.length > 0 && <div className="inc-veh muted">{assigned.map((v) => <span key={v.id}><span className={`st s${v.status}`}>{v.status}</span> {v.callsign}</span>)}</div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

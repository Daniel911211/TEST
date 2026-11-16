import { WERKSTAETTEN, workshopVehicles, fmtMin } from '../game.js'
import { stationOf } from './helpers.js'
import Overlay from './Overlay.jsx'

const PHASE = { fahrt: 'auf Anfahrt', warten: 'wartet auf Platz', reparatur: 'in Reparatur' }

// Overlay einer Lkw-Werkstatt (Marker „W“ auf der Karte): Plätze, Fahrzeuge in Reparatur, wartend und auf Anfahrt
export default function WerkstattOverlay({ g, workshopId, onClose, onOpenWorkshop, onOpenVehicle }) {
  const w = WERKSTAETTEN.find((x) => x.id === workshopId)
  if (!w) return null
  const idx = WERKSTAETTEN.indexOf(w)
  const go = (d) => onOpenWorkshop(WERKSTAETTEN[(idx + d + WERKSTAETTEN.length) % WERKSTAETTEN.length].id)
  const order = { reparatur: 0, warten: 1, fahrt: 2 }
  const list = workshopVehicles(g, w.id).sort((a, b) => (order[a.wsPhase] - order[b.wsPhase]) || ((a.wsSince || 0) - (b.wsSince || 0)))
  const busy = list.filter((v) => v.wsPhase === 'reparatur').length
  const free = Math.max(0, w.plaetze - busy)

  return (
    <Overlay compact
      title={<><span className="wk wk-WS">W</span> {w.name}</>}
      sub={`Lkw-Werkstatt · ${w.ort} · ${free} von ${w.plaetze} Plätzen frei`}
      onClose={onClose} onPrev={() => go(-1)} onNext={() => go(1)}
    >
      <div className="pad">
        <div className="betten">
          <div className={`betten-zahl ${free > 0 ? 'green' : 'red'}`}>{free}<small> / {w.plaetze}</small></div>
          <div className="muted">freie Reparaturplätze</div>
          <div className="betten-reihe">
            {Array.from({ length: w.plaetze }, (_, i) => <span key={i} className={`bett ${i < busy ? 'belegt' : ''}`} />)}
          </div>
        </div>

        <h4>Fahrzeuge ({list.length})</h4>
        {!list.length && <p className="muted">Kein Fahrzeug in dieser Werkstatt.</p>}
        {list.length > 0 && (
          <table className="tbl">
            <thead><tr><th>Fahrzeug</th><th>Wache</th><th>Stand</th><th>Fertig in</th></tr></thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id} className="click" onClick={() => onOpenVehicle(v.id)}>
                  <td><b>{v.callsign}</b></td>
                  <td className="muted">{stationOf(g, v)?.name}</td>
                  <td>{PHASE[v.wsPhase] || '–'}</td>
                  <td>{v.wsPhase === 'reparatur' ? fmtMin(Math.max(0, v.timer)) : v.wsPhase === 'warten' ? `wartet seit ${fmtMin(g.t - (v.wsSince || g.t))}` : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">Reparaturen laufen gleichzeitig auf den freien Plätzen; weitere Fahrzeuge warten in der Reihenfolge ihrer Ankunft. Mit eigener Wachen-Werkstatt (Reiter Ausbau) entfällt die Fahrt.</p>
      </div>
    </Overlay>
  )
}

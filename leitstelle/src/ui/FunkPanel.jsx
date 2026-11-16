import { fmtClock, LOG_KINDS, LOG_QUIET_KINDS, sprechwunschList, sprechKindName, incidentTitle } from '../game.js'

// Unten rechts: Funk. Oben angeheftet alle Fahrzeuge mit Sprechwunsch (blinkende 5), darunter der Funkverkehr
// (neueste Meldung oben; stille Protokolleinträge wie Neuer Einsatz, Vermerke, Bau/Kauf stehen nur im Protokoll). Klick auf einen Sprechwunsch öffnet das Sprechwunsch-Overlay.
// Aufbau einer Funkzeile mit Fahrzeug: Uhrzeit · Status (aktuell) · 📍 auf Karte · Fahrzeugname (öffnet Fahrzeug) · „Zum Einsatz“ · Art · Meldung.
export default function FunkPanel({ g, onOpenSprech, onOpenVehicle, onOpenIncident, onLocate }) {
  const pending = sprechwunschList(g)
  const byId = new Map(g.vehicles.map((v) => [v.id, v]))
  const incIds = new Set(g.incidents.map((i) => i.id))
  return (
    <section className="panel funk">
      <div className="panel-head">Funk {pending.length > 0 && <span className="count alert">{pending.length}</span>}</div>
      {pending.length > 0 && (
        <div className="sprech-pins">
          {pending.map((v) => {
            const kind = v.sprechwunsch?.kind || 'klinik'
            const inc = v.sprechwunsch ? g.incidents.find((i) => i.id === v.sprechwunsch.incidentId) : null
            return (
              <div key={v.id} className="sprech-pin" onClick={() => onOpenSprech(v.id)} title="Sprechwunsch annehmen">
                <span className="st s5 blink">5</span>
                <b>{v.callsign}</b>
                <span className={`tag tag-sprech-${kind}`}>{sprechKindName(kind)}</span>
                <small className="muted">{inc ? incidentTitle(inc) : kind === 'klinik' ? 'Patient an Bord' : v.sprechwunsch?.incTitle || ''}</small>
              </div>
            )
          })}
        </div>
      )}
      <div className="scroll">
        <ul className="funk-list">
          {g.log.filter((l) => !l.quiet && !LOG_QUIET_KINDS.includes(l.kind)).slice(0, 200).map((l, i) => {
            const kind = l.kind || 'info'
            const v = l.v != null ? byId.get(l.v) : null
            let text = kind === 'erledigt' ? l.text.replace(/^Einsatz erledigt: /, '') : l.text
            if (v) {
              if (text.startsWith(`${v.callsign}: `)) text = text.slice(v.callsign.length + 2)
              else if (text.startsWith(`Leitstelle an ${v.callsign}: `)) text = 'Leitstelle: ' + text.slice(v.callsign.length + 16)
            }
            return (
              <li key={i} className={`funk-${kind} ${i === 0 ? 'new' : ''}`}>
                <small className="muted">{fmtClock(l.t)}</small>
                {v && <>
                  <span className={`st s${v.status}`} title={`Aktueller Status ${v.status}`}>{v.status}</span>
                  <span className="pin" title="Auf der Karte zeigen" onClick={() => onLocate?.(v.id)}>📍</span>
                  <button className="small funk-fz" title="Fahrzeug öffnen" onClick={() => onOpenVehicle?.(v.id)}>{v.callsign}</button>
                  {l.inc != null && incIds.has(l.inc) && <button className="small" title="Einsatz öffnen" onClick={() => onOpenIncident?.(l.inc)}>Zum Einsatz</button>}
                </>}
                {LOG_KINDS[kind] && <span className={`tag tag-${kind}`}>{LOG_KINDS[kind]}</span>}
                <span className="funk-text">{text}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

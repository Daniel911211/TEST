import { fmtClock, LOG_KINDS } from '../game.js'

// Unten rechts: Funkverkehr (neueste Meldung oben). Lagemeldungen, Nachforderungen, neue und erledigte Einsätze sind gekennzeichnet.
export default function FunkPanel({ g }) {
  return (
    <section className="panel funk">
      <div className="panel-head">Funk</div>
      <div className="scroll">
        <ul className="funk-list">
          {g.log.map((l, i) => {
            const kind = l.kind || 'info'
            return (
              <li key={i} className={`funk-${kind} ${i === 0 ? 'new' : ''}`}>
                <small className="muted">{fmtClock(l.t)}</small>
                {LOG_KINDS[kind] && <span className={`tag tag-${kind}`}>{LOG_KINDS[kind]}</span>}
                {' '}{kind === 'neu' || kind === 'erledigt' ? l.text.replace(/^(Neuer Einsatz|Einsatz erledigt): /, '') : l.text}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

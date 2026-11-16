import { fmtClock } from '../game.js'

// Unten rechts: Funkverkehr (neueste Meldung oben)
export default function FunkPanel({ g }) {
  return (
    <section className="panel funk">
      <div className="panel-head">Funk</div>
      <div className="scroll">
        <ul className="funk-list">
          {g.log.map((l, i) => (
            <li key={i} className={i === 0 ? 'new' : ''}><small className="muted">{fmtClock(l.t)}</small> {l.text}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

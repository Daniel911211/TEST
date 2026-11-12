import { useEffect, useState } from 'react'
import Replay from './Replay.jsx'
import { OPTIONS, RULES, TYPE_TITLE } from '../sim/race.js'

const STD_OPTIONS = ['nfa', 'warn', 't5', 't10', 'dt', 'sg', 'black']

export function CaseDialog({ race, incId, onClose }) {
  // Kopie beim Öffnen, damit der Fall auch nach der Entscheidung sichtbar bleibt
  const [inc] = useState(() => ({ ...race.incidents.find((i) => i.id === incId) }))
  const [culprit, setCulprit] = useState(null)
  const [fb, setFb] = useState(null)
  const carA = race.cars[inc.carIds[0]]
  const carB = race.cars[inc.carIds[1] ?? inc.carIds[0]]
  const isCollision = inc.type === 'collision'
  const opts = inc.options || STD_OPTIONS

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const decide = (opt) => {
    if (fb) return
    const res = race.decide(inc.id, { culprit, opt })
    if (res) setFb(res)
  }
  const labelOf = (k) => (inc.type === 'trackLimits' && k === 'nfa' ? 'Kein Vergehen' : k === 'sg' ? 'Stop & Go 10 s' : OPTIONS[k].label)
  const needCulprit = isCollision && !culprit

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dhead">
          <span className="dim">FALL {String(inc.no).padStart(2, '0')} · RUNDE {inc.lap}</span>
          <b>{TYPE_TITLE[inc.type]} · {inc.carIds.map((id) => race.cars[id].code).join(' / ')}</b>
          <button className="btn sm right" onClick={onClose}>SCHLIESSEN · ESC</button>
        </div>
        <div className="dbody">
          <Replay inc={inc} carA={carA} carB={carB} />
          <div className="dside">
            <table className="facts">
              <tbody>
                {inc.facts.map(([k, v]) => (
                  <tr key={k}><td className="dim">{k.toUpperCase()}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
            {inc.tip && <div className="tip">{inc.tip}</div>}
            {inc.statements.map((s) => (
              <div key={s.code} className="quote"><b>{s.code}:</b> „{s.text}“</div>
            ))}
            <div className="rule"><b>REGLEMENT</b><br />{RULES[inc.type]}</div>
            {fb ? (
              <div className={`verdict ${fb.delta > 0 ? 'good' : 'bad'}`}>
                <b>{fb.delta > 0 ? '+' : ''}{fb.delta} Fairness · {fb.text}</b>
                <div>{fb.verdict}</div>
                <button className="btn sm" onClick={onClose}>WEITER</button>
              </div>
            ) : (
              <>
                <div className="ptitle">ENTSCHEIDUNG DER STEWARDS</div>
                {isCollision && (
                  <div className="culprit">
                    {[['a', carA], ['b', carB]].map(([k, c]) => (
                      <button key={k} className={`btn sm ${culprit === k ? 'on' : ''}`} onClick={() => setCulprit(culprit === k ? null : k)}>SCHULD: {c.code}</button>
                    ))}
                  </div>
                )}
                <div className="decisions">
                  {opts.map((k) => (
                    <button key={k} className={`btn sm ${OPTIONS[k].tone || ''}`} disabled={needCulprit && k !== 'nfa'} onClick={() => decide(k)}>
                      {labelOf(k).toUpperCase()}
                    </button>
                  ))}
                </div>
                {isCollision && <div className="hint">Für eine Strafe zuerst den Schuldigen wählen. „Keine Strafe“ bedeutet Rennunfall.</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReportDialog({ snap, onClose, onNew, finished }) {
  const r = snap.report
  return (
    <div className="overlay" onClick={finished ? undefined : onClose}>
      <div className="dialog report" onClick={(e) => e.stopPropagation()}>
        <h2>RENNBERICHT · {snap.track.gp.toUpperCase()}</h2>
        <div className="repsum">
          <div className={`grade g${r.grade}`}>{r.grade}</div>
          <div>
            <b>{r.summary}</b>
            <div className="dim">Sicherheit {r.safety} · Fairness {r.fairness} · Ablauf {r.flow} · {r.decided} Fälle entschieden, {r.good} davon gut{r.open ? ` · ${r.open} offen` : ''}</div>
          </div>
        </div>
        <div className="repcols">
          <table className="results">
            <thead><tr><th>POS</th><th>FAHRER</th><th>TEAM</th><th>ZEIT</th><th>STRAFEN</th><th>BESTE</th></tr></thead>
            <tbody>
              {(snap.results || []).map((x) => (
                <tr key={x.code}>
                  <td>{x.pos}</td>
                  <td><i className="dot" style={{ background: x.color }} />{x.num} {x.name}</td>
                  <td className="dim">{x.team}</td>
                  <td>{x.time}</td>
                  <td>{x.penaltySec ? `+${x.penaltySec}s` : ''}</td>
                  <td className="dim">{x.best}</td>
                </tr>
              ))}
              {!snap.results && <tr><td colSpan="6" className="hint">Das Rennen läuft noch.</td></tr>}
            </tbody>
          </table>
          <div className="replog">
            {r.log.length === 0 && <div className="hint">Noch keine Entscheidungen.</div>}
            {r.log.map((e, i) => (
              <div key={i} className="logrow"><span>{e.text}</span><b className={e.delta >= 0 ? 'pos' : 'neg'}>{e.delta > 0 ? '+' : ''}{e.delta}</b></div>
            ))}
          </div>
        </div>
        <div className="dfoot">
          {!finished && <button className="btn" onClick={onClose}>ZURÜCK ZUM LEITSTAND</button>}
          <button className="btn ok" onClick={onNew}>NEUES RENNEN</button>
        </div>
      </div>
    </div>
  )
}

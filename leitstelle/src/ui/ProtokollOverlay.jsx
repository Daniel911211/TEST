import { useMemo, useState } from 'react'
import Suchfeld from './Suchfeld.jsx'
import { LOG_KINDS, logAsText, fmtClock } from '../game.js'
import Overlay from './Overlay.jsx'

const PAGE = 300

// Protokoll: alle Ereignisse des Spiels (bis LOG_MAX Einträge), neueste oben, filterbar nach Art, Fahrzeug, Einsatz und Text.
// „Herunterladen“ speichert die gefilterte Liste als Textdatei (älteste Zeile zuerst).
export default function ProtokollOverlay({ g, onClose, onOpenIncident, onOpenVehicle }) {
  const [kind, setKind] = useState('alle')
  const [veh, setVeh] = useState('alle')
  const [inc, setInc] = useState('alle')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)

  // Einsätze im Protokoll (auch erledigte), neueste zuerst
  const incidents = useMemo(() => {
    const m = new Map()
    for (const l of g.log) if (l.inc != null && !m.has(l.inc)) m.set(l.inc, l.incTitle || `Einsatz ${l.inc}`)
    return [...m.entries()]
  }, [g.log.length])
  const vehicles = [...g.vehicles].sort((a, b) => a.callsign.localeCompare(b.callsign))

  const needle = q.trim().toLowerCase()
  const list = g.log.filter((l) =>
    (kind === 'alle' || (l.kind || 'info') === kind) &&
    (veh === 'alle' || l.v === Number(veh)) &&
    (inc === 'alle' || l.inc === Number(inc)) &&
    (!needle || l.text.toLowerCase().includes(needle) || (l.incTitle || '').toLowerCase().includes(needle)))

  const download = () => {
    const blob = new Blob([logAsText(g, list) + '\n'], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `protokoll-${fmtClock(g.t).replace(':', '')}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const reset = () => { setKind('alle'); setVeh('alle'); setInc('alle'); setQ(''); setLimit(PAGE) }
  const active = kind !== 'alle' || veh !== 'alle' || inc !== 'alle' || needle

  return (
    <Overlay
      title={<>📋 Protokoll</>}
      sub={`${list.length} von ${g.log.length} Einträgen${active ? ' (gefiltert)' : ''} · die letzten ${g.log.length >= 5000 ? '5.000 ' : ''}Ereignisse bleiben gespeichert`}
      head={<button className="small" onClick={download} disabled={!list.length}>⬇ Herunterladen (.txt)</button>}
      onClose={onClose}
    >
      <div className="pad proto-filter">
        <select value={kind} onChange={(e) => { setKind(e.target.value); setLimit(PAGE) }} title="Art">
          <option value="alle">Alle Arten</option>
          {Object.entries(LOG_KINDS).map(([k, name]) => <option key={k} value={k}>{name || 'Info'}</option>)}
        </select>
        <select value={veh} onChange={(e) => { setVeh(e.target.value); setLimit(PAGE) }} title="Fahrzeug">
          <option value="alle">Alle Fahrzeuge</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.callsign}</option>)}
        </select>
        <select value={inc} onChange={(e) => { setInc(e.target.value); setLimit(PAGE) }} title="Einsatz">
          <option value="alle">Alle Einsätze</option>
          {incidents.map(([id, title]) => <option key={id} value={id}>{title}{g.incidents.some((i) => i.id === id) ? '' : ' (erledigt)'}</option>)}
        </select>
        <Suchfeld className="proto-such" placeholder="Text suchen …" value={q} onChange={(t) => { setQ(t); setLimit(PAGE) }} />
        {active && <button className="small" onClick={reset}>Filter zurücksetzen</button>}
      </div>
      <table className="tbl proto">
        <thead><tr><th>Zeit</th><th>Art</th><th>Ereignis</th><th>Einsatz</th></tr></thead>
        <tbody>
          {list.slice(0, limit).map((l, i) => {
            const k = l.kind || 'info'
            const v = l.v != null ? g.vehicles.find((x) => x.id === l.v) : null
            const live = l.inc != null && g.incidents.some((x) => x.id === l.inc)
            return (
              <tr key={i} className={`funk-${k}`}>
                <td className="muted nowrap">{fmtClock(l.t)}</td>
                <td className="nowrap">{LOG_KINDS[k] ? <span className={`tag tag-${k}`}>{LOG_KINDS[k]}</span> : <span className="muted">Info</span>}</td>
                <td>{l.text}{v && <span className="muted"> · <span className="link" onClick={() => onOpenVehicle(v.id)}>Fahrzeug</span></span>}</td>
                <td className="muted">{l.incTitle ? (live ? <span className="link" onClick={() => onOpenIncident(l.inc)}>{l.incTitle}</span> : l.incTitle) : ''}</td>
              </tr>
            )
          })}
          {!list.length && <tr><td colSpan={4} className="muted">Keine Einträge.</td></tr>}
        </tbody>
      </table>
      {list.length > limit && <div className="pad"><button onClick={() => setLimit(limit + PAGE)}>Weitere {Math.min(PAGE, list.length - limit)} anzeigen</button></div>}
    </Overlay>
  )
}

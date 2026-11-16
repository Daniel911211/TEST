import { useState } from 'react'
import { SEVERITY_TEXT, sprechwunschList, sprechKindName, incidentTitle, transportOptions, confirmTransport, answerSprechwunsch, answerOptions, fmtMin } from '../game.js'
import Overlay from './Overlay.jsx'

// Overlay eines Sprechwunschs: Lagemeldung oder Nachforderung lesen und als Vermerk in den Einsatz eintragen,
// bei Status 5 mit Patient die Zielklinik festlegen. Vor/Zurück blättert durch alle offenen Sprechwünsche.
export default function SprechwunschOverlay({ g, vehicleId, onClose, onOpenSprech, onSelectIncident, flash }) {
  const v = g.vehicles.find((x) => x.id === vehicleId)
  const [note, setNote] = useState('') // Antwort der Leitstelle
  const [zusage, setZusage] = useState(null) // true/false aus einem Vorschlag, null = aus dem Text erkennen
  if (!v || (!v.sprechwunsch && v.status !== 5)) return null
  const list = sprechwunschList(g)
  const idx = list.indexOf(v)
  const go = (d) => { setNote(''); setZusage(null); onOpenSprech(list[(idx + d + list.length) % list.length].id) }
  const sw = v.sprechwunsch
  const inc = sw ? g.incidents.find((i) => i.id === sw.incidentId) : null
  const kind = sw?.kind || 'klinik'
  const next = () => { const rest = sprechwunschList(g).filter((x) => x.id !== v.id); setNote(''); setZusage(null); if (rest.length) onOpenSprech(rest[0].id); else onClose() }

  return (
    <Overlay compact
      title={<><span className="st s5">5</span> {v.callsign}</>}
      sub={`Sprechwunsch · ${sprechKindName(kind)}${inc ? ` · ${incidentTitle(inc)}` : sw?.incTitle ? ` · ${sw.incTitle} (erledigt)` : ''}${sw ? ` · wartet seit ${fmtMin(g.t - sw.since)}` : ''} · Spiel angehalten`}
      head={inc && <button className="small" onClick={() => onSelectIncident(inc.id)}>Zum Einsatz</button>}
      onClose={onClose} onPrev={list.length > 1 ? () => go(-1) : null} onNext={list.length > 1 ? () => go(1) : null}
    >
      <div className="pad">
        {sw ? (
          <>
            <h4>Funkspruch</h4>
            <div className="funkspruch">„{sw.text}“</div>
            <h4>Antwort der Leitstelle</h4>
            <div className="chips antwort-vorschlaege">
              {answerOptions(g, v.id).map((o) => <button key={o.text} className={note === o.text ? 'on' : ''} onClick={() => { setNote(o.text); setZusage(o.zusage) }}>{o.text}</button>)}
            </div>
            <textarea className="vermerk" rows={3} placeholder="Antwort an das Fahrzeug (Vorschlag anklicken oder selbst schreiben; steht danach im Funk und im Einsatztagebuch) …" value={note} onChange={(e) => { setNote(e.target.value); setZusage(null) }} />
            <div className="ef-actions">
              <button className="primary" style={{ width: 'auto' }} disabled={!note.trim()} onClick={() => { const r = answerSprechwunsch(g, v.id, note, zusage); if (r.ok) { flash('Antwort gesendet.'); next() } else flash(r.msg) }}>Antworten</button>
              <button onClick={() => { answerSprechwunsch(g, v.id, ''); next() }}>Nur quittieren</button>
            </div>
          </>
        ) : <KlinikWahl g={g} v={v} flash={flash} onDone={next} />}
      </div>
    </Overlay>
  )
}

// Zielklinik bei Status 5 (Patient an Bord)
function KlinikWahl({ g, v, flash, onDone }) {
  const opts = transportOptions(g, v)
  const wish = opts.find((h) => h.id === v.request?.wishId)
  const choose = (hid) => { const r = confirmTransport(g, v.id, hid); if (r.ok) onDone(); else flash(r.msg) }
  return (
    <>
      <h4>Funkspruch</h4>
      <div className="funkspruch">
        {wish ? <>„Patient möchte nach <b>{wish.name}</b>.“ Kapazität: {wish.free > 0 ? <b className="green">{wish.free} Betten frei</b> : <b className="red">keine Kapazität</b>}</>
          : <>„Erbitte Zielklinik für den Patienten.“ <small className="muted">Patient {SEVERITY_TEXT[v.request?.severity || 1]} – die Leitstelle entscheidet.</small></>}
      </div>
      {wish && wish.free > 0 && <button className="primary" onClick={() => choose(wish.id)}>Wunschklinik {wish.name} bestätigen</button>}
      <h4>{wish && wish.free <= 0 ? 'Gegenvorschlag der Leitstelle' : 'Andere Klinik'}</h4>
      <div className="klinik-wahl">
        {opts.filter((h) => h.id !== wish?.id || wish.free <= 0).map((h) => (
          <button key={h.id} disabled={h.free <= 0 || h.id === wish?.id} onClick={() => choose(h.id)}>
            {h.name} · {h.dist.toFixed(1)} km · {h.free > 0 ? `${h.free} frei` : 'voll'}
          </button>
        ))}
      </div>
    </>
  )
}

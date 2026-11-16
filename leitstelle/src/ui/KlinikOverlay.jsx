import { HOSPITALS, SEVERITY_TEXT, BED_STEP, BED_COST, hospitalFree, hospitalBeds, hospitalPatients, expandHospital, fmtMin, fmtMoney } from '../game.js'
import Overlay from './Overlay.jsx'

// Overlay einer Klinik: Bettenzähler, belegte Betten mit Restzeit, Ausbau in 5er-Schritten
export default function KlinikOverlay({ g, hospitalId, onClose, onOpenHospital, flash }) {
  const h = HOSPITALS.find((x) => x.id === hospitalId)
  if (!h) return null
  const idx = HOSPITALS.indexOf(h)
  const free = hospitalFree(g, h.id), beds = hospitalBeds(g, h.id)
  const patients = [...hospitalPatients(g, h.id)].sort((a, b) => a.until - b.until)
  const onWay = g.vehicles.filter((v) => v.status === 7 && v.hospital?.id === h.id)
  const go = (d) => onOpenHospital(HOSPITALS[(idx + d + HOSPITALS.length) % HOSPITALS.length].id)

  return (
    <Overlay compact
      title={<><span className="wk wk-KH">H</span> {h.name}</>}
      sub={`Klinik · ${free} von ${beds} Betten frei`}
      onClose={onClose} onPrev={() => go(-1)} onNext={() => go(1)}
    >
      <div className="pad">
        <div className="betten">
          <div className={`betten-zahl ${free > 0 ? 'green' : 'red'}`}>{free}<small> / {beds}</small></div>
          <div className="muted">freie Betten</div>
          <div className="betten-reihe">
            {Array.from({ length: beds }, (_, i) => <span key={i} className={`bett ${i < beds - free ? 'belegt' : ''}`} />)}
          </div>
        </div>

        <h4>Belegte Betten ({patients.length})</h4>
        {!patients.length && <p className="muted">Keine Patienten in Behandlung.</p>}
        {patients.length > 0 && (
          <table className="tbl">
            <thead><tr><th>Patient</th><th>Eingeliefert von</th><th>Bett frei in</th></tr></thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={i}><td>{SEVERITY_TEXT[p.severity] || 'leicht'}</td><td className="muted">{p.by || '–'}</td><td>{fmtMin(Math.max(0, p.until - g.t))}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {onWay.length > 0 && <p className="muted">Unterwegs hierher: {onWay.map((v) => v.callsign).join(', ')} (Betten bereits belegt)</p>}

        <h4>Ausbau</h4>
        <div className="card">
          <p className="muted">Jeder Ausbau bringt {BED_STEP} zusätzliche Betten. Betten werden nach der Behandlung wieder frei (leicht 2 h, mittel 3 h, schwer 5 h Spielzeit).</p>
          <button disabled={g.money < BED_COST} onClick={() => { const r = expandHospital(g, h.id); flash(r.ok ? `${h.name}: +${BED_STEP} Betten (−${fmtMoney(BED_COST)})` : r.msg) }}>+{BED_STEP} Betten – {fmtMoney(BED_COST)}</button>
        </div>
      </div>
    </Overlay>
  )
}

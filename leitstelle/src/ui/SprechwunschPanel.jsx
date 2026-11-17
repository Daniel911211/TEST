import { HOSPITALS, hospitalFree, hospitalBeds, hospitalPatients } from '../game.js'

// Unten Mitte: Kliniken mit Bettenlage (Klick öffnet das Klinik-Overlay). Sprechwünsche stehen oben im Funk.
export default function SprechwunschPanel({ g, onOpenHospital }) {
  return (
    <section className="panel sprech">
      <div className="panel-head">Kliniken</div>
      <div className="scroll">
        <table className="tbl">
          <thead><tr><th>Klinik</th><th>Betten frei</th><th>In Behandlung</th></tr></thead>
          <tbody>
            {HOSPITALS.map((h) => {
              const free = hospitalFree(g, h.id)
              return (
                <tr key={h.id} className="click" onClick={() => onOpenHospital(h.id)}>
                  <td>{h.name}</td>
                  <td className={free > 0 ? 'green' : 'red'}><b>{free}</b> / {hospitalBeds(g, h.id)}</td>
                  <td className="muted">{hospitalPatients(g, h.id).length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="muted pad">Klick auf eine Klinik: Belegung, Restzeiten und Ausbau.</p>
      </div>
    </section>
  )
}

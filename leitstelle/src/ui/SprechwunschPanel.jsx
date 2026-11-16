import { HOSPITALS, SEVERITY_TEXT, hospitalFree, hospitalBeds, transportOptions, confirmTransport } from '../game.js'

// Unten Mitte: Sprechwünsche (Status 5, Klinikwahl) und Bettenlage der Kliniken (Klick öffnet das Klinik-Overlay)
export default function SprechwunschPanel({ g, flash, onOpenHospital }) {
  const requests = g.vehicles.filter((v) => v.status === 5)
  const doConfirm = (vid, hid) => { const r = confirmTransport(g, vid, hid); if (!r.ok) flash(r.msg) }
  return (
    <section className="panel sprech">
      <div className="panel-head">Sprechwünsche {requests.length > 0 && <span className="count alert">{requests.length}</span>}</div>
      <div className="scroll">
        {!requests.length && <p className="muted pad">Keine offenen Sprechwünsche.</p>}
        {requests.map((v) => {
          const opts = transportOptions(g, v)
          const wish = opts.find((h) => h.id === v.request.wishId)
          return (
            <div className="card req" key={v.id}>
              <h4>📻 {v.callsign} – Status 5</h4>
              {wish ? (
                <p>„Patient möchte nach <b>{wish.name}</b>.“<br />Kapazität: {wish.free > 0 ? <b className="green">{wish.free} Betten frei</b> : <b className="red">keine Kapazität</b>}</p>
              ) : <p>„Erbitte Zielklinik für den Patienten.“<br /><small className="muted">Patient {SEVERITY_TEXT[v.request.severity || 1]} – die Leitstelle entscheidet.</small></p>}
              {wish && wish.free > 0 && <button className="primary" onClick={() => doConfirm(v.id, wish.id)}>Wunschklinik bestätigen</button>}
              <h5>{wish && wish.free <= 0 ? 'Gegenvorschlag der Leitstelle' : 'Andere Klinik'}</h5>
              {opts.filter((h) => h.id !== wish?.id || wish.free <= 0).map((h) => (
                <button key={h.id} disabled={h.free <= 0 || h.id === wish?.id} onClick={() => doConfirm(v.id, h.id)}>
                  {h.name} · {h.dist.toFixed(1)} km · {h.free > 0 ? `${h.free} frei` : 'voll'}
                </button>
              ))}
            </div>
          )
        })}
        <h5 className="muted pad">Kliniken (freie Betten) – Klick für Details und Ausbau</h5>
        <table className="tbl">
          <tbody>
            {HOSPITALS.map((h) => {
              const free = hospitalFree(g, h.id)
              return (
                <tr key={h.id} className="click" onClick={() => onOpenHospital(h.id)}>
                  <td>{h.name}</td>
                  <td className={free > 0 ? 'green' : 'red'}><b>{free}</b> / {hospitalBeds(g, h.id)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

import { STATION_TYPES, FIRST_VEHICLES, firstVehicleOptions, countStations, fmtMoney } from '../game.js'

// Bauformular über der Karte (nach Vorbild „Neues Gebäude bauen“): Gebäudetyp, Name, Standort per Klick, Bauen
export default function BauFormular({ g, build, setBuild, siteMode, onBuild }) {
  const def = STATION_TYPES[build.kind]
  const needsSite = siteMode(build.kind)
  const hasPos = !!build.pos
  const firsts = firstVehicleOptions(g, build.kind)
  const chosen = firsts.find((o) => o.type === build.vehicle && !o.locked) || firsts.find((o) => !o.locked)
  const gesperrt = (def.needRW && countStations(g, 'RW') < def.needRW) || (def.max && countStations(g, build.kind) >= def.max)
  return (
    <div className="bau-form" onClick={(e) => e.stopPropagation()}>
      <div className="bau-head"><b>Neues Gebäude bauen</b><span className="spacer" /><button className="small" onClick={() => setBuild(null)}>✕</button></div>
      <label>Gebäudetyp
        <select value={build.kind} onChange={(e) => setBuild({ kind: e.target.value, pos: null, site: null, name: '', vehicle: FIRST_VEHICLES[e.target.value][1] || FIRST_VEHICLES[e.target.value][0] })}>
          {Object.entries(STATION_TYPES).map(([k, d]) => <option key={k} value={k}>{d.name} – {fmtMoney(d.cost)}</option>)}
        </select>
      </label>
      <label>Name
        <input value={build.name} placeholder={build.site ? build.site.name : `${def.name} ${g.stations.filter((s) => s.kind === build.kind).length + 1}`} onChange={(e) => setBuild({ ...build, name: e.target.value })} />
      </label>
      <label>Erstes Fahrzeug (gratis)
        {firsts.length > 1
          ? <select value={chosen?.type || ''} onChange={(e) => setBuild({ ...build, vehicle: e.target.value })}>
            {firsts.map((o) => <option key={o.type} value={o.type} disabled={o.locked}>{o.name} – {o.locked ? `🔒 ${o.text}` : o.text}</option>)}
          </select>
          : <b>{firsts[0].name}</b>}
      </label>
      {def.needRW && countStations(g, 'RW') < def.needRW && <div className="amber">🔒 Erst ab {def.needRW} Rettungswachen ({countStations(g, 'RW')} vorhanden).</div>}
      {def.max && countStations(g, build.kind) >= def.max && <div className="amber">Es gibt schon eine {def.name}.</div>}
      <div className="bau-ort">
        <span className="muted">Standort</span>{' '}
        {hasPos ? <b>{build.site ? build.site.name : `${build.pos[0].toFixed(4)}, ${build.pos[1].toFixed(4)}`}</b>
          : <span className="amber">{needsSite ? 'Klicke auf einen markierten Standort auf der Karte' : 'Klicke auf die Karte'}</span>}
      </div>
      <div className="bau-foot">
        <span className={g.money < def.cost ? 'red' : 'muted'}>Kosten: {fmtMoney(def.cost)}</span>
        <span className="spacer" />
        <button onClick={() => setBuild(null)}>Abbrechen</button>
        <button className="primary" disabled={!hasPos || g.money < def.cost || gesperrt} onClick={onBuild}>Bauen</button>
      </div>
    </div>
  )
}

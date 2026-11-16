import { STATION_TYPES, fmtMoney } from '../game.js'

// Bauformular über der Karte (nach Vorbild „Neues Gebäude bauen“): Gebäudetyp, Name, Standort per Klick, Bauen
export default function BauFormular({ g, build, setBuild, siteMode, onBuild }) {
  const def = STATION_TYPES[build.kind]
  const needsSite = siteMode(build.kind)
  const hasPos = !!build.pos
  return (
    <div className="bau-form" onClick={(e) => e.stopPropagation()}>
      <div className="bau-head"><b>Neues Gebäude bauen</b><span className="spacer" /><button className="small" onClick={() => setBuild(null)}>✕</button></div>
      <label>Gebäudetyp
        <select value={build.kind} onChange={(e) => setBuild({ kind: e.target.value, pos: null, site: null, name: '' })}>
          {Object.entries(STATION_TYPES).map(([k, d]) => <option key={k} value={k}>{d.name} – {fmtMoney(d.cost)}</option>)}
        </select>
      </label>
      <label>Name
        <input value={build.name} placeholder={build.site ? build.site.name : `${def.name} ${g.stations.filter((s) => s.kind === build.kind).length + 1}`} onChange={(e) => setBuild({ ...build, name: e.target.value })} />
      </label>
      <div className="bau-ort">
        <span className="muted">Standort</span>{' '}
        {hasPos ? <b>{build.site ? build.site.name : `${build.pos[0].toFixed(4)}, ${build.pos[1].toFixed(4)}`}</b>
          : <span className="amber">{needsSite ? 'Klicke auf einen markierten Standort auf der Karte' : 'Klicke auf die Karte'}</span>}
      </div>
      <div className="bau-foot">
        <span className={g.money < def.cost ? 'red' : 'muted'}>Kosten: {fmtMoney(def.cost)}</span>
        <span className="spacer" />
        <button onClick={() => setBuild(null)}>Abbrechen</button>
        <button className="primary" disabled={!hasPos || g.money < def.cost} onClick={onBuild}>Bauen</button>
      </div>
    </div>
  )
}

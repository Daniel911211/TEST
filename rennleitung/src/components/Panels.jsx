import { OPTION_LIST, TYPE_TITLE, TYRES, clockStr } from '../sim/race.js'

export function TimingTower({ rows, selected, onSelect, state }) {
  return (
    <div className="panel tower">
      <div className="ptitle">ZEITNAHME · LIVE <span className="dim right">INTERVALL</span></div>
      <div className="towerrows">
        {rows.map((r) => (
          <div key={r.id} className={`trow ${selected === r.id ? 'sel' : ''} ${r.status}`} onClick={() => onSelect(r.id === selected ? null : r.id)}>
            <span className="pos">{r.pos}</span>
            <span className="bar" style={{ background: r.color }} />
            <span className="code" title={r.name}>{r.name}</span>
            <span className="badges">
              {r.status === 'stopped' && <i className="b red">STOP</i>}
              {r.inPit && <i className="b blue">BOX</i>}
              {r.serving && <i className="b amber">STRAFE</i>}
              {r.penaltySec > 0 && <i className="b amber">+{r.penaltySec}s</i>}
              {r.warnings > 0 && <i className="b gray">{'▲'.repeat(Math.min(3, r.warnings))}</i>}
            </span>
            <span className="gap">{state === 'GRID' ? '' : r.gap}</span>
            <span className="tyre" style={{ borderColor: TYRES[r.tyre].color, color: TYRES[r.tyre].color }} title={`${TYRES[r.tyre].name}, ${r.wear} % abgefahren, ${r.stops} Stopps`}>{r.tyre}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const FLAG_LABEL = { green: 'grün', yellow: 'gelb', double: 'doppelgelb' }

export function ControlPanel({ snap, race, selectedRow, selectedCar }) {
  const s = snap.state
  const live = ['GREEN', 'VSC', 'SC', 'RED', 'RESTART'].includes(s)
  return (
    <div className="controls">
      <div className="panel">
        <div className="ptitle">STRECKENSEKTOREN</div>
        <div className="sectors">
          {snap.sectors.map((f, i) => (
            <button key={i} disabled={!live} className={`sector ${f}`} onClick={() => race.cycleSector(i)}>
              S{i + 1}<small>{FLAG_LABEL[f]}</small>
            </button>
          ))}
        </div>
        <div className="hint">Klick schaltet: Grün → Gelb → Doppelgelb. Tasten 1 2 3.</div>
        <button className="btn wide ok" disabled={!live || snap.sectors.every((f) => f === 'green')} onClick={() => race.allGreen()}>ALLE SEKTOREN GRÜN</button>
      </div>

      <div className="panel">
        <div className="ptitle">NEUTRALISIERUNG</div>
        <div className="neutral">
          <button className="btn amber" disabled={s !== 'GREEN'} onClick={() => race.callVSC()}>VSC</button>
          <button className="btn gray" disabled={s !== 'VSC' || snap.vscEnding} onClick={() => race.endVSC()}>{snap.vscEnding ? 'VSC ENDET…' : 'VSC BEENDEN'}</button>
          <button className="btn orange" disabled={s !== 'GREEN' && s !== 'VSC'} onClick={() => race.callSC()}>SAFETY CAR</button>
          <button className="btn gray" disabled={s !== 'SC' || snap.scEnding} onClick={() => race.scInThisLap()}>{snap.scEnding ? 'SC KOMMT REIN…' : 'SC IN DIESER RUNDE'}</button>
          <button className="btn red" disabled={!['GREEN', 'VSC', 'SC'].includes(s)} onClick={() => race.callRed()}>ROTE FLAGGE</button>
          <button className="btn ok" disabled={s !== 'RED'} onClick={() => race.restart()}>NEUSTART</button>
        </div>
      </div>

      <div className="panel">
        <div className="ptitle">FAHRZEUG · DIREKTE MASSNAHME</div>
        {selectedCar ? (
          <>
            <div className="carinfo">
              <b style={{ color: selectedCar.color }}>#{selectedCar.num} {selectedCar.name}</b>
              <span className="dim">{selectedCar.team} · P{selectedRow.pos} · Strafen {selectedCar.penaltySec}s · Verwarnungen {selectedCar.warnings}</span>
              <span className="dim">Reifen: <b style={{ color: TYRES[selectedRow.tyre].color }}>{TYRES[selectedRow.tyre].name}</b> · {selectedRow.wear} % abgefahren · {selectedRow.stops} {selectedRow.stops === 1 ? 'Stopp' : 'Stopps'}</span>
            </div>
            <div className="penalties">
              {OPTION_LIST.filter((o) => !['nfa', 'lap', 'lap5'].includes(o.key)).map((o) => (
                <button key={o.key} className={`btn sm ${o.tone || ''}`} disabled={!live || selectedCar.status === 'dsq' || selectedCar.status === 'fin'} onClick={() => race.penalizeCar(selectedCar.id, o.key)}>
                  {o.key === 'black' ? 'SCHWARZE FLAGGE' : o.label.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="hint">Fahrer in der Zeitnahme oder auf der Karte anklicken.</div>
        )}
      </div>
    </div>
  )
}

export function IncidentPanel({ incidents, t, onOpen, race }) {
  const sorted = [...incidents].sort((a, b) => a.id - b.id)
  return (
    <div className="panel incidents">
      <div className="ptitle">VORFÄLLE <span className="dim right">{incidents.length} AKTIV</span></div>
      <div className="inclist">
        {sorted.length === 0 && <div className="hint pad">Keine offenen Vorfälle. Ruhige Phase.</div>}
        {sorted.map((i) => {
          const cars = i.carIds.map((id) => race.cars[id])
          const left = i.deadline ? Math.max(0, Math.ceil(i.deadline - t)) : null
          return (
            <div key={i.id} className={`inc ${i.kind}`}>
              <div className="inchead">
                <b>{i.kind === 'decision' ? `${String(i.no).padStart(2, '0')} · ${TYPE_TITLE[i.type]}` : `⚠ ${cars[0].code} steht auf der Strecke`}</b>
                {left !== null && <span className={`timer ${left < 30 ? 'low' : ''}`}>{left}s</span>}
              </div>
              <div className="dim">
                {cars.map((c) => c.code).join(' / ')} · {i.place} · Runde {i.lap}
              </div>
              {i.kind === 'decision' ? (
                <button className="btn sm amber" onClick={() => onOpen(i.id)}>FALL PRÜFEN</button>
              ) : (
                <div className="quick">
                  <button className="btn sm" onClick={() => race.setSector(i.sector, 'yellow')}>GELB S{i.sector + 1}</button>
                  <button className="btn sm" onClick={() => race.setSector(i.sector, 'double')}>DOPPELGELB</button>
                  <button className="btn sm amber" disabled={race.state !== 'GREEN'} onClick={() => race.callVSC()}>VSC</button>
                  <button className="btn sm orange" disabled={race.state !== 'GREEN' && race.state !== 'VSC'} onClick={() => race.callSC()}>SC</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MessageLog({ messages, radio }) {
  return (
    <>
      <div className="panel logbox">
        <div className="ptitle">RACE CONTROL MESSAGES</div>
        <div className="loglist">
          {[...messages].reverse().map((m) => (
            <div key={m.id} className={`msg ${m.level}`}><span className="dim">{clockStr(m.t)}</span> {m.text}</div>
          ))}
        </div>
      </div>
      <div className="panel radiobox">
        <div className="ptitle">FUNKVERKEHR</div>
        <div className="loglist">
          {[...radio].reverse().map((m) => (
            <div key={m.id} className={`msg radio ${m.box ? 'box' : ''}`}><b style={{ color: m.color }}>{m.box ? `Box → ${m.name}` : m.name}</b> {m.text}</div>
          ))}
        </div>
      </div>
    </>
  )
}

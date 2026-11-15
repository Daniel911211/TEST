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
              {r.damage && !r.inPit && <i className="b amber">SCHADEN</i>}
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

export function ControlPanel({ snap, race, selectedRow, selectedCar, onAuto }) {
  const s = snap.state
  const live = ['GREEN', 'VSC', 'SC', 'RED', 'RESTART'].includes(s)
  const auto = snap.auto // Automatik sperrt Flaggen und Neutralisierung für den Spieler
  return (
    <div className="controls">
      <div className="panel">
        <div className="ptitle">
          STRECKENSICHERUNG
          <span className="seg push" role="group" aria-label="Streckensicherung">
            <button className={`btn sm ${auto ? '' : 'on'}`} aria-pressed={!auto} onClick={() => onAuto(false)}>MANUELL</button>
            <button className={`btn sm ${auto ? 'on' : ''}`} aria-pressed={auto} onClick={() => onAuto(true)}>AUTO</button>
          </span>
        </div>
        <div className="sectors">
          {snap.sectors.map((f, i) => (
            <button key={i} disabled={!live || auto} className={`sector ${f}`} onClick={() => race.cycleSector(i)}>
              S{i + 1}<small>{FLAG_LABEL[f]}</small>
            </button>
          ))}
        </div>
        {auto ? (
          <div className="autonote"><b>AUTOMATIK</b> {snap.autoNote || 'wartet auf den Start'}</div>
        ) : (
          <div className="hint">Klick schaltet: Grün → Gelb → Doppelgelb. Tasten 1 2 3.</div>
        )}
        <button className="btn wide ok" disabled={!live || auto || snap.sectors.every((f) => f === 'green')} onClick={() => race.allGreen()}>ALLE SEKTOREN GRÜN</button>
      </div>

      <div className="panel">
        <div className="ptitle">NEUTRALISIERUNG{auto && <span className="push autotag">AUTOMATIK</span>}</div>
        <div className="neutral">
          <button className="btn amber" disabled={auto || s !== 'GREEN'} onClick={() => race.callVSC()}>VSC</button>
          <button className="btn gray" disabled={auto || s !== 'VSC' || snap.vscEnding} onClick={() => race.endVSC()}>{snap.vscEnding ? 'VSC ENDET…' : 'VSC BEENDEN'}</button>
          <button className="btn orange" disabled={auto || (s !== 'GREEN' && s !== 'VSC')} onClick={() => race.callSC()}>SAFETY CAR</button>
          <button className="btn gray" disabled={auto || s !== 'SC' || snap.scEnding} onClick={() => race.scInThisLap()}>{snap.scEnding ? 'SC KOMMT REIN…' : snap.scWaiting ? 'SC ZURÜCKRUFEN' : 'SC IN DIESER RUNDE'}</button>
          <button className="btn red" disabled={auto || !['GREEN', 'VSC', 'SC'].includes(s)} onClick={() => race.callRed()}>ROTE FLAGGE</button>
          <button className="btn ok" disabled={auto || s !== 'RED'} onClick={() => race.restart()}>NEUSTART</button>
        </div>
        <button className="btn sm wide gray" disabled={auto || s !== 'SC' || !snap.scCollected || !snap.lapped || snap.scEnding} onClick={() => race.letLappedPass()}>
          {snap.unlapping ? `ÜBERRUNDETE FAHREN VORBEI (${snap.unlapping})` : `ÜBERRUNDETE VORBEILASSEN${snap.lapped ? ` (${snap.lapped})` : ''}`}
        </button>
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
              {i.kind === 'hazard' && i.haz && (
                <div className="marshal">
                  <div><span className="dim">GRUND</span> {i.haz.cause}{i.haz.debris ? ' · Trümmer auf der Strecke' : ''}</div>
                  <div><span className="dim">LAGE</span> <b className={`pos-${i.haz.pos}`}>{{ rand: 'am Streckenrand', teil: 'teilweise auf der Fahrbahn', linie: 'auf der Ideallinie' }[i.haz.pos]}</b></div>
                  {i.haz.medical && (
                    <div>
                      <span className="dim">ARZT</span>{' '}
                      <b className={i.haz.medical.state === 'done' ? 'pos-rand' : i.haz.medical.state === 'needed' ? 'pos-linie' : 'pos-teil'}>
                        {{
                          needed: i.haz.medical.heavy ? 'angefordert · Fahrer muss geborgen werden, die Rettung braucht die ganze Strecke' : 'angefordert · Fahrer meldet sich nicht',
                          enroute: 'Arztwagen ist unterwegs',
                          onscene: `Arzt am Unfallort, noch ca. ${Math.ceil(i.haz.medical.left)} s`,
                          done: 'Fahrer versorgt',
                        }[i.haz.medical.state]}
                      </b>
                    </div>
                  )}
                  <div><span className="dim">BERGUNG</span> {i.haz.self ? `fährt selbst weiter, noch ca. ${Math.ceil(i.haz.left)} s` : i.haz.medical && i.haz.medical.state !== 'done' ? 'beginnt, sobald der Fahrer versorgt ist' : `ca. ${Math.round(i.haz.total / 5) * 5} s unter Safety Car`}</div>
                  {i.haz.medical && i.haz.medical.state === 'needed' && !race.auto && (
                    <button className="btn sm red" onClick={() => race.sendMedical(cars[0].id)}>ARZTWAGEN SCHICKEN</button>
                  )}
                  <div className="mbar"><i style={{ width: `${Math.round((1 - i.haz.left / i.haz.total) * 100)}%`, background: '#4cd0ff' }} /></div>
                </div>
              )}
              {i.kind === 'decision' ? (
                <button className="btn sm amber" onClick={() => onOpen(i.id)}>FALL PRÜFEN</button>
              ) : (
                race.auto ? (
                  <div className="autonote"><b>AUTOMATIK</b> sichert diese Stelle selbst ab</div>
                ) : (
                  <div className="quick">
                    <button className="btn sm" onClick={() => race.setSector(i.sector, 'yellow')}>GELB S{i.sector + 1}</button>
                    <button className="btn sm" onClick={() => race.setSector(i.sector, 'double')}>DOPPELGELB</button>
                    <button className="btn sm amber" disabled={race.state !== 'GREEN'} onClick={() => race.callVSC()}>VSC</button>
                    <button className="btn sm orange" disabled={race.state !== 'GREEN' && race.state !== 'VSC'} onClick={() => race.callSC()}>SC</button>
                  </div>
                )
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
        <div className="ptitle">MELDUNGEN DER RENNLEITUNG</div>
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

import { useEffect, useState } from 'react'
import { TRACK_LIST } from '../sim/tracks.js'
import { DIFFS } from '../sim/race.js'
import { CALENDAR, driverTable, gradeOf } from '../season.js'

const useEsc = (onClose) => useEffect(() => {
  const h = (e) => e.key === 'Escape' && onClose()
  window.addEventListener('keydown', h)
  return () => window.removeEventListener('keydown', h)
}, [onClose])

const Choice = ({ label, value, options, onChange }) => (
  <div className="choice">
    <span className="dim">{label}</span>
    <div className="seg">
      {options.map(([k, text]) => (
        <button key={k} className={`btn sm ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>{text}</button>
      ))}
    </div>
  </div>
)

const DIFF_TEXT = {
  easy: 'Weniger Vorfälle, lange Fristen, höchstens 2 offene Fälle. Die Empfehlung der Stewards wird angezeigt.',
  normal: 'Der normale Betrieb: bis zu 4 offene Fälle, 110 Sekunden Frist je Fall.',
  hard: 'Viele Vorfälle, 70 Sekunden Frist, bis zu 6 offene Fälle. Fehlurteile kosten mehr Fairness.',
}

export function SetupDialog({ setup, onStart, onClose }) {
  const [cfg, setCfg] = useState(setup)
  useEsc(onClose)
  const set = (k) => (v) => setCfg({ ...cfg, [k]: v })
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog menu" onClick={(e) => e.stopPropagation()}>
        <h2>NEUES RENNEN</h2>
        <div className="choice">
          <span className="dim">STRECKE</span>
          <div className="tracks">
            {TRACK_LIST.map((t) => (
              <button key={t.key} className={`btn trk ${cfg.track === t.key ? 'on' : ''}`} onClick={() => set('track')(t.key)}>
                <b>{t.gp.replace('Großer Preis von ', '')}</b><small>{t.name}</small>
              </button>
            ))}
          </div>
        </div>
        <Choice label="RENNDISTANZ" value={cfg.laps} options={[3, 5, 10, 15, 20].map((n) => [n, `${n} Runden`])} onChange={set('laps')} />
        <Choice label="ABLAUF" value={cfg.mode} options={[['race', 'Nur Rennen'], ['weekend', 'Qualifying + Rennen']]} onChange={set('mode')} />
        <Choice label="SCHWIERIGKEIT" value={cfg.diff} options={Object.entries(DIFFS).map(([k, d]) => [k, d.label])} onChange={set('diff')} />
        <div className="hint">{DIFF_TEXT[cfg.diff]}{cfg.mode === 'weekend' ? ' Im Qualifying fahren alle drei gezeitete Runden, das Ergebnis ist die Startaufstellung.' : ''}</div>
        <div className="dfoot">
          <button className="btn" onClick={onClose}>ABBRECHEN</button>
          <button className="btn ok" onClick={() => onStart(cfg)}>STARTEN</button>
        </div>
      </div>
    </div>
  )
}

export function SeasonDialog({ season, setup, onBegin, onNext, onReset, onClose }) {
  const [sure, setSure] = useState(false)
  useEsc(onClose)
  const name = (k) => TRACK_LIST.find((t) => t.key === k)
  if (!season) {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="dialog menu" onClick={(e) => e.stopPropagation()}>
          <h2>SAISON</h2>
          <p className="lead">Sechs Rennen, eine Fahrerwertung und deine Gesamtnote als Rennleiter. Die Saison nutzt die Einstellungen aus „Neues Rennen“:
            <b> {setup.laps} Runden · {setup.mode === 'weekend' ? 'Qualifying + Rennen' : 'nur Rennen'} · {DIFFS[setup.diff].label}</b>. Der Stand wird in diesem Browser gespeichert.</p>
          <ol className="cal">{CALENDAR.map((k) => <li key={k}><b>{name(k).gp}</b> <span className="dim">{name(k).name}</span></li>)}</ol>
          <div className="dfoot">
            <button className="btn" onClick={onClose}>SCHLIESSEN</button>
            <button className="btn ok" onClick={onBegin}>SAISON BEGINNEN</button>
          </div>
        </div>
      </div>
    )
  }
  const done = season.races.length
  const over = done >= CALENDAR.length
  const table = driverTable(season)
  const avg = done ? season.races.reduce((a, r) => a + r.score, 0) / done : 0
  const final = { A: 'Der Weltverband verlängert deinen Vertrag um fünf Jahre.', B: 'Eine gute Saison. Du bleibst Rennleiter.', C: 'Durchwachsen. Du bekommst einen Aufpasser an die Seite gestellt.', D: 'Die Teams fordern deine Ablösung.', F: 'Du leitest ab sofort Kartrennen auf dem Supermarktparkplatz.' }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog menu wide" onClick={(e) => e.stopPropagation()}>
        <h2>SAISON · RENNEN {Math.min(done + 1, CALENDAR.length)} VON {CALENDAR.length}</h2>
        <div className="repsum">
          <div className={`grade g${done ? gradeOf(avg) : ''}`}>{done ? gradeOf(avg) : '–'}</div>
          <div>
            <b>{over ? final[gradeOf(avg)] : done ? `Dein Schnitt als Rennleiter: ${Math.round(avg)} von 100 Punkten` : 'Noch kein Rennen gefahren.'}</b>
            <div className="dim">{season.laps} Runden · {season.mode === 'weekend' ? 'Qualifying + Rennen' : 'nur Rennen'} · {DIFFS[season.diff].label}</div>
          </div>
        </div>
        <div className="repcols">
          <table className="results">
            <thead><tr><th>NR</th><th>GRAND PRIX</th><th>SIEGER</th><th>NOTE</th></tr></thead>
            <tbody>
              {CALENDAR.map((k, i) => {
                const r = season.races[i]
                return (
                  <tr key={k} className={i === done ? 'next' : ''}>
                    <td>{i + 1}</td>
                    <td>{name(k).gp}</td>
                    <td>{r ? <><i className="dot" style={{ background: r.top[0]?.color }} />{r.top[0]?.name || '-'}</> : <span className="dim">{i === done ? 'als Nächstes' : ''}</span>}</td>
                    <td>{r ? `${r.grade} (${Math.round(r.score)})` : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <table className="results">
            <thead><tr><th>POS</th><th>FAHRER</th><th>TEAM</th><th>SIEGE</th><th>PUNKTE</th></tr></thead>
            <tbody>
              {table.slice(0, 12).map((d, i) => (
                <tr key={d.code}><td>{i + 1}</td><td><i className="dot" style={{ background: d.color }} />{d.name}</td><td className="dim">{d.team}</td><td>{d.wins || ''}</td><td><b>{d.pts}</b></td></tr>
              ))}
              {!table.length && <tr><td colSpan="5" className="hint">Die Fahrerwertung füllt sich nach dem ersten Rennen.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="dfoot">
          <button className={`btn ${sure ? 'red' : ''}`} onClick={() => (sure ? onReset() : setSure(true))}>{sure ? 'WIRKLICH LÖSCHEN?' : 'SAISON LÖSCHEN'}</button>
          <button className="btn" onClick={onClose}>SCHLIESSEN</button>
          {!over && <button className="btn ok" onClick={onNext}>NÄCHSTES RENNEN · {name(CALENDAR[done]).gp.replace('Großer Preis von ', '').toUpperCase()}</button>}
        </div>
      </div>
    </div>
  )
}

const PAGES = [
  ['DEINE AUFGABE', [
    'Du bist die Rennleitung. Du fährst nicht selbst, du sorgst dafür, dass das Rennen sicher und fair abläuft.',
    'Oben rechts siehst du drei Werte. SICHERHEIT sinkt, wenn Autos an einer ungesicherten Gefahrenstelle vorbeifahren. FAIRNESS steigt und fällt mit deinen Urteilen. ABLAUF sinkt, wenn du das Rennen länger als nötig bremst.',
    'Am Ende gibt es eine Note von A bis F. Sicherheit und Fairness zählen je 40 %, der Ablauf 20 %.',
  ]],
  ['DER START', [
    'Zuerst gibst du die Einführungsrunde frei. Stehen alle wieder in der Aufstellung, startest du die Ampel.',
    'Achte vorher auf Warnungen: Steht ein Auto mit abgewürgtem Motor in der Aufstellung, brich den Start ab. Meldet sich der Arztwagen nicht bereit, warte auf seine Freigabe.',
    'In der ersten Runde folgt der rote Arztwagen dem Feld und parkt danach neben dem Safety Car in der Boxengasse.',
  ]],
  ['STRECKE SICHERN', [
    'Bleibt ein Auto stehen, erscheint rechts eine Gefahrenmeldung mit dem Bericht der Streckenposten: Wo steht das Auto, liegen Trümmer, wie lange dauert die Bergung?',
    'Auto neben der Strecke: Gelb im Sektor genügt. Auto teilweise auf der Strecke: Doppelgelb und Virtuelles Safety Car. Auto auf der Ideallinie oder Trümmer: Safety Car. Mehrere Autos oder Arzteinsatz auf der Strecke: Rote Flagge.',
    'Die Sektoren schaltest du unten oder mit den Tasten 1, 2 und 3. Ist die Stelle geräumt, gibst du wieder frei. Jede unnötige Sekunde kostet Ablauf.',
  ]],
  ['FÄLLE ENTSCHEIDEN', [
    'Verstöße landen rechts als Fall mit Frist. Mit FALL PRÜFEN öffnest du Replay, Fakten, Aussagen der Fahrer und den passenden Auszug aus dem Reglement.',
    'Im Replay kannst du das Tempo ändern, hineinzoomen und Bild für Bild scrubben. Die Antwort steht immer in den Fakten und im Bild, nicht in den Aussagen der Fahrer.',
    'Nach dem Urteil siehst du, wie die Experten entschieden hätten. Gegen harte Strafen legen Teams manchmal Protest ein: War dein Urteil richtig, bestätige es. War es überzogen, nimm es zurück.',
  ]],
  ['BOXENGASSE UND ARZTWAGEN', [
    'Steht ein Auto im Bereich der Boxeneinfahrt, sperre die Boxengasse. Wer trotz roter Ampel ohne Schaden einfährt, wird zum Fall.',
    'Nach schweren Einschlägen fordern die Posten einen Arzt an. Schicke den Arztwagen los. Geborgen wird erst, wenn der Fahrer versorgt ist.',
    'Unter dem Safety Car kannst du Überrundete vorbeilassen, bevor du es wieder hereinholst.',
  ]],
  ['QUALIFYING, SAISON, AUTOMATIK', [
    'Unter NEUES RENNEN wählst du Strecke, Distanz und Schwierigkeit und ob vor dem Rennen ein Qualifying stattfindet. Im Qualifying gibt es nur gelbe Flaggen, gestrichene Runden und Rückversetzungen.',
    'Die SAISON führt über sechs Rennen mit Fahrerwertung und deiner Gesamtnote.',
    'Mit dem Schalter MANUELL / AUTO übernimmt eine Automatik die Streckensicherung. Die Fälle entscheidest du weiterhin selbst. Für den Anfang ist das eine gute Hilfe.',
  ]],
]

export function HelpDialog({ onClose, onPractice }) {
  const [i, setI] = useState(0)
  useEsc(onClose)
  const [title, text] = PAGES[i]
  const last = i === PAGES.length - 1
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog menu" onClick={(e) => e.stopPropagation()}>
        <h2>EINFÜHRUNG · {i + 1}/{PAGES.length} · {title}</h2>
        <div className="helptext">{text.map((t, k) => <p key={k}>{t}</p>)}</div>
        <div className="dots">{PAGES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} />)}</div>
        <div className="dfoot">
          <button className="btn" onClick={onClose}>SCHLIESSEN</button>
          <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>ZURÜCK</button>
          {last
            ? <button className="btn ok" onClick={onPractice}>ÜBUNGSRENNEN STARTEN</button>
            : <button className="btn ok" onClick={() => setI(i + 1)}>WEITER</button>}
        </div>
      </div>
    </div>
  )
}

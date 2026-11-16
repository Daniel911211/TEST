import { useLayoutEffect, useRef } from 'react'

// Rahmen für Overlays: Kopf, Reiter, scrollbarer Inhalt, Fuß mit Vor/Zurück und Schließen.
// Zwei Größen: groß (Standard, füllt die Fläche unter der Kopfzeile – Einsatz, Protokoll) und compact
// (mittig, nur so hoch wie der Inhalt – Wache, Sprechwunsch, Fahrzeug, Klinik, Werkstatt). Die Kopfzeile bleibt bedienbar.
export default function Overlay({ title, sub, head, tabs, tab, setTab, onClose, onPrev, onNext, foot, compact = false, children }) {
  const back = useRef(null)
  useLayoutEffect(() => {
    const fit = () => { const h = document.querySelector('header')?.offsetHeight || 48; if (back.current) back.current.style.top = `${h}px` }
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className={`overlay-back${compact ? ' compact' : ''}`} ref={back} onClick={onClose}>
      <div className="overlay" onClick={(e) => e.stopPropagation()}>
        <div className="ov-head">
          <div className="ov-title">
            <h3>{title}</h3>
            {sub && <small className="muted">{sub}</small>}
          </div>
          <span className="spacer" />
          {head}
          <button className="small ov-close" title="Schließen" onClick={onClose}>✕</button>
        </div>
        {tabs && (
          <div className="ov-tabs">
            {tabs.map(([k, name]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{name}</button>)}
          </div>
        )}
        <div className="ov-body scroll">{children}</div>
        <div className="ov-foot">
          {onPrev && <button onClick={onPrev}>‹ Zurück</button>}
          {onNext && <button onClick={onNext}>Weiter ›</button>}
          <span className="spacer" />
          {foot}
          <button onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  )
}

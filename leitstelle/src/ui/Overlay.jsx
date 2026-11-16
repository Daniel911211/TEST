import { useLayoutEffect, useRef } from 'react'

// Rahmen für Overlays: Kopf, Reiter, scrollbarer Inhalt, Fuß mit Vor/Zurück und Schließen.
// Liegt über der ganzen Fläche unter der Kopfzeile (die bleibt bedienbar: Tempo, Pause, Ton).
export default function Overlay({ title, sub, head, tabs, tab, setTab, onClose, onPrev, onNext, foot, children }) {
  const back = useRef(null)
  useLayoutEffect(() => {
    const fit = () => { const h = document.querySelector('header')?.offsetHeight || 48; if (back.current) back.current.style.top = `${h}px` }
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="overlay-back" ref={back} onClick={onClose}>
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

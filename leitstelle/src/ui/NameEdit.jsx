import { useState } from 'react'

// Stift zum Umbenennen (Wache, Fahrzeug): Klick öffnet ein Eingabefeld an Ort und Stelle; Enter oder „Speichern“ übernimmt,
// Escape oder „Abbrechen“ verwirft. onSave(name) liefert { ok, msg } aus der Spiellogik.
export default function NameEdit({ value, onSave, flash, title = 'Umbenennen' }) {
  const [edit, setEdit] = useState(false)
  const [text, setText] = useState(value)
  if (!edit) return <button className="small" title={title} onClick={() => { setText(value); setEdit(true) }}>✏️</button>
  const save = () => { const r = onSave(text); if (r?.ok === false) flash?.(r.msg); else setEdit(false) }
  return (
    <span className="name-edit">
      <input className="search" autoFocus value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEdit(false) }} />
      <button className="small primary" onClick={save}>Speichern</button>
      <button className="small" onClick={() => setEdit(false)}>Abbrechen</button>
    </span>
  )
}

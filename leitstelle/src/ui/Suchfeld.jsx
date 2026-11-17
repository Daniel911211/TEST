// Suchfeld mit ×-Knopf zum Löschen (erscheint, sobald Text drinsteht). Die Klasse des Außenelements („such-wrap“) übernimmt Breite und Rand von „.search“.
export default function Suchfeld({ value, onChange, placeholder, className = '' }) {
  return (
    <span className={`such-wrap ${className}`}>
      <input className="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.stopPropagation(); onChange('') } }} />
      {value && <button type="button" className="such-x" title="Suche löschen" aria-label="Suche löschen" onClick={() => onChange('')}>×</button>}
    </span>
  )
}

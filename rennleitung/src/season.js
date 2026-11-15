// Saison und Einstellungen: liegen im Browser-Speicher. Fehlt er (privates Fenster), gilt alles nur für diese Sitzung.
export const CALENDAR = ['suzuka', 'monaco', 'spielberg', 'silverstone', 'spa', 'monza']
export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v && typeof v === 'object' ? v : fallback
  } catch { return fallback }
}
const write = (key, v) => {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* ohne Speicher nur für diese Sitzung */ }
}

export const DEFAULT_SETUP = { track: 'spa', laps: 10, mode: 'race', diff: 'normal' }
export const loadSetup = () => ({ ...DEFAULT_SETUP, ...read('rennleitung-setup', {}) })
export const saveSetup = (s) => write('rennleitung-setup', s)

export const loadSeason = () => {
  const s = read('rennleitung-season', null)
  return s && Array.isArray(s.races) ? s : null
}
export const saveSeason = (s) => (s ? write('rennleitung-season', s) : (() => { try { localStorage.removeItem('rennleitung-season') } catch { /* egal */ } })())
export const newSeason = (cfg) => ({ laps: cfg.laps, mode: cfg.mode, diff: cfg.diff, races: [] })

export const helpSeen = () => { try { return localStorage.getItem('rennleitung-help') === '1' } catch { return true } }
export const markHelpSeen = () => { try { localStorage.setItem('rennleitung-help', '1') } catch { /* egal */ } }

// Fahrerwertung aus den gespeicherten Rennergebnissen
export const driverTable = (season) => {
  const pts = {}
  for (const r of season.races) r.top.forEach((d, i) => {
    const e = (pts[d.code] ||= { code: d.code, name: d.name, team: d.team, color: d.color, pts: 0, wins: 0 })
    e.pts += POINTS[i] || 0
    if (i === 0) e.wins++
  })
  return Object.values(pts).sort((a, b) => b.pts - a.pts || b.wins - a.wins)
}
export const gradeOf = (score) => (score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F')

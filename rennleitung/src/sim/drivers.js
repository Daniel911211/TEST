// Fahrerfeld 2026 – frei editierbar. pace = relative Rennpace (1.0 = schnellstes Auto).
export const TEAMS = {
  McLaren: { color: '#ff8000', pace: 1.0 },
  Ferrari: { color: '#e8002d', pace: 0.997 },
  'Red Bull Racing': { color: '#3671c6', pace: 0.996 },
  Mercedes: { color: '#27f4d2', pace: 0.996 },
  Williams: { color: '#64c4ff', pace: 0.99 },
  'Aston Martin': { color: '#229971', pace: 0.989 },
  'Racing Bulls': { color: '#9aa8ff', pace: 0.987 },
  Alpine: { color: '#ff87bc', pace: 0.985 },
  Haas: { color: '#e6e6e6', pace: 0.985 },
  Audi: { color: '#b3261e', pace: 0.983 },
  Cadillac: { color: '#d9b55b', pace: 0.98 },
}

const d = (num, code, name, team) => ({ num, code, name, last: name.split(' ').slice(1).join(' '), team, color: TEAMS[team].color, teamPace: TEAMS[team].pace })

export const DRIVERS = [
  d(1, 'NOR', 'Lando Norris', 'McLaren'),
  d(81, 'PIA', 'Oscar Piastri', 'McLaren'),
  d(16, 'LEC', 'Charles Leclerc', 'Ferrari'),
  d(44, 'HAM', 'Lewis Hamilton', 'Ferrari'),
  d(3, 'VER', 'Max Verstappen', 'Red Bull Racing'),
  d(6, 'HAD', 'Isack Hadjar', 'Red Bull Racing'),
  d(63, 'RUS', 'George Russell', 'Mercedes'),
  d(12, 'ANT', 'Kimi Antonelli', 'Mercedes'),
  d(23, 'ALB', 'Alexander Albon', 'Williams'),
  d(55, 'SAI', 'Carlos Sainz', 'Williams'),
  d(14, 'ALO', 'Fernando Alonso', 'Aston Martin'),
  d(18, 'STR', 'Lance Stroll', 'Aston Martin'),
  d(30, 'LAW', 'Liam Lawson', 'Racing Bulls'),
  d(41, 'LIN', 'Arvid Lindblad', 'Racing Bulls'),
  d(10, 'GAS', 'Pierre Gasly', 'Alpine'),
  d(43, 'COL', 'Franco Colapinto', 'Alpine'),
  d(31, 'OCO', 'Esteban Ocon', 'Haas'),
  d(87, 'BEA', 'Oliver Bearman', 'Haas'),
  d(27, 'HUL', 'Nico Hülkenberg', 'Audi'),
  d(5, 'BOR', 'Gabriel Bortoleto', 'Audi'),
  d(77, 'BOT', 'Valtteri Bottas', 'Cadillac'),
  d(11, 'PER', 'Sergio Pérez', 'Cadillac'),
]

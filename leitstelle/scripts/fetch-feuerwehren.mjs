// Holt Feuerwehr-Standorte (OSM, amenity=fire_station) im Landkreis Fulda und schreibt src/data/feuerwehren.json
// Aufruf: node scripts/fetch-feuerwehren.mjs   (Internetzugang zu overpass-api.de nötig)
import { writeFileSync } from 'node:fs'

const query = `[out:json][timeout:60];
area["boundary"="administrative"]["admin_level"="6"]["name"="Landkreis Fulda"]->.a;
nwr["amenity"="fire_station"](area.a);
out center tags;`

const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(query) })
if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
const { elements } = await res.json()

const sites = elements
  .map((e) => {
    const lat = e.lat ?? e.center?.lat
    const lon = e.lon ?? e.center?.lon
    if (lat == null || lon == null) return null
    const t = e.tags || {}
    return {
      id: `${e.type[0]}${e.id}`,
      name: t.name || t['short_name'] || `Feuerwehr ${t['addr:city'] || t['addr:suburb'] || ''}`.trim(),
      pos: [Math.round(lat * 1e5) / 1e5, Math.round(lon * 1e5) / 1e5],
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name, 'de'))

writeFileSync(new URL('../src/data/feuerwehren.json', import.meta.url), JSON.stringify(sites, null, 1) + '\n')
console.log(`${sites.length} Feuerwehr-Standorte gespeichert.`)

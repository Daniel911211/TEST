#!/usr/bin/env python3
"""Ersatz für fetch-feuerwehren.mjs, falls Overpass nicht erreichbar ist.
Holt Feuerwehr- und Rettungswachen-Standorte (OSM-Daten) im Landkreis Fulda über Nominatim
(1 Anfrage/Sekunde, Kachelung wegen max. 40 Treffern pro Anfrage) und schreibt src/data/feuerwehren.json."""
import json, time, urllib.parse, urllib.request, pathlib

UA = 'leitstelle-private-game'
BBOX = (9.35, 50.30, 10.00, 50.76)  # W, S, O, N
KINDS = {'FW': ['[amenity=fire_station]'], 'RW': ['[emergency=ambulance_station]', '[amenity=ambulance_station]'], 'KH': ['[amenity=hospital]']}
found, calls = {}, 0

def query(q, w, s, e, n):
    global calls
    calls += 1
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
        {'q': q, 'format': 'json', 'limit': 40, 'bounded': 1, 'viewbox': f'{w},{n},{e},{s}'})
    for attempt in range(3):
        try:
            time.sleep(1.1)
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40) as r:
                return json.load(r)
        except Exception as ex:
            print('retry', ex)
            time.sleep(3)
    raise RuntimeError('Nominatim nicht erreichbar')

def tile(kind, q, w, s, e, n):
    res = query(q, w, s, e, n)
    if len(res) >= 40 and (e - w) > 0.02:
        mw, ms = (w + e) / 2, (s + n) / 2
        for box in ((w, s, mw, ms), (mw, s, e, ms), (w, ms, mw, n), (mw, ms, e, n)):
            tile(kind, q, *box)
        return
    for x in res:
        if 'Landkreis Fulda' not in x['display_name']:
            continue
        key = (x['osm_type'], x['osm_id'])
        parts = [t.strip() for t in x['display_name'].split(',')]
        name = x.get('name') or ' '.join(parts[:3])
        if key not in found:
            found[key] = {'kind': kind, 'id': f"{x['osm_type'][0]}{x['osm_id']}", 'name': name,
                          'pos': [round(float(x['lat']), 5), round(float(x['lon']), 5)]}

for kind, qs in KINDS.items():
    for q in qs:
        tile(kind, q, *BBOX)

def near(a, b):
    return abs(a[0] - b[0]) < 0.001 and abs(a[1] - b[1]) < 0.0015  # ca. 100 m

unique = []
for s in found.values():
    if not any(u['kind'] == s['kind'] and near(u['pos'], s['pos']) for u in unique):
        unique.append(s)
hospitals = sorted([s for s in unique if s['kind'] == 'KH'], key=lambda s: s['name'])
sites = sorted([s for s in unique if s['kind'] != 'KH'], key=lambda s: (s['kind'], s['name']))
out = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'data' / 'feuerwehren.json'
out.write_text(json.dumps(sites, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
(out.parent / 'kliniken-roh.json').write_text(json.dumps(hospitals, ensure_ascii=False, indent=1) + '\n', encoding='utf8')
print(f"{len(hospitals)} Kliniken; {calls} Anfragen: {sum(s['kind']=='FW' for s in sites)} Feuerwachen, {sum(s['kind']=='RW' for s in sites)} Rettungswachen")

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { CENTER, HOSPITALS, VEHICLE_TYPES, incidentTitle } from './game.js'

const icon = (html, cls, size = 28) =>
  L.divIcon({ html, className: cls, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })

export default function MapView({ game, sites, selected, focus, buildMode, buildPos, onMapClick, onSelectIncident, onSelectStation, onSelectVehicle, onSelectHospital, onSiteClick }) {
  const el = useRef(null)
  const map = useRef(null)
  const layers = useRef({ st: new Map(), veh: new Map(), inc: new Map() })
  const cb = useRef({})
  const gameRef = useRef(game)
  gameRef.current = game
  cb.current = { onMapClick, onSelectIncident, onSelectStation, onSelectVehicle, onSelectHospital, onSiteClick, buildMode }

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: true }).setView(CENTER, 12)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    layers.current.hosp = new Map()
    for (const h of HOSPITALS) layers.current.hosp.set(h.id, L.marker(h.pos, { icon: icon('H', 'mk mk-hosp', 24) }).bindTooltip(h.name).on('click', (e) => {
      L.DomEvent.stopPropagation(e); cb.current.onSelectHospital?.(h.id)
    }).addTo(m))
    const siteLayer = L.layerGroup().addTo(m)
    siteLayer.sites = new Map()
    layers.current.siteLayer = siteLayer
    if (sites.length) m.fitBounds(L.latLngBounds(sites.map((s) => s.pos)).pad(0.05))
    m.on('click', (e) => cb.current.onMapClick([e.latlng.lat, e.latlng.lng]))
    map.current = m
    // Fahrzeugmarker jeden Frame nachführen (flüssige Bewegung unabhängig vom React-Takt)
    let raf = 0
    const loop = () => {
      for (const [id, mk] of layers.current.veh) {
        const v = gameRef.current.vehicles.find((x) => x.id === id)
        if (!v) continue
        const ll = mk.getLatLng()
        if (ll.lat !== v.pos[0] || ll.lng !== v.pos[1]) mk.setLatLng(v.pos)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); m.remove() }
  }, [])

  useEffect(() => {
    if (map.current) map.current.getContainer().style.cursor = buildMode && !sites.some((s) => (s.kind || 'FW') === buildMode) ? 'crosshair' : ''
  }, [buildMode])

  useEffect(() => {
    const m = map.current
    const { st, veh, inc } = layers.current
    for (const h of HOSPITALS) {
      const mk = layers.current.hosp?.get(h.id)
      const txt = `${h.name} – freie Betten: ${game.hospitals[h.id]?.free ?? 0}/${game.hospitals[h.id]?.beds ?? 0}`
      if (mk && mk._txt !== txt) { mk._txt = txt; mk.setTooltipContent(txt) }
    }
    // Marker nur anfassen, wenn sich wirklich etwas geändert hat (sonst flackert die Karte)
    const setTip = (mk, txt) => { if (mk._txt !== txt) { mk._txt = txt; mk.getTooltip() ? mk.setTooltipContent(txt) : mk.bindTooltip(txt) } }
    const setIcon = (mk, key, make) => { if (mk._key !== key) { mk._key = key; mk.setIcon(make()) } }
    const sync = (store, items, make, update) => {
      const ids = new Set(items.map((i) => i.id))
      for (const [id, mk] of store) if (!ids.has(id)) { mk.remove(); store.delete(id) }
      for (const it of items) {
        let mk = store.get(it.id)
        if (!mk) { mk = make(it).addTo(m); store.set(it.id, mk) }
        update(mk, it)
      }
    }
    sync(st, game.stations, (s) =>
      L.marker(s.pos, { icon: icon(s.kind, `mk mk-st mk-${s.kind}`, 30), zIndexOffset: 100 }).on('click', (e) => {
        L.DomEvent.stopPropagation(e); cb.current.onSelectStation(s.id)
      }).bindTooltip(s.name), () => {})
    sync(inc, game.incidents, (i) =>
      L.marker(i.pos, { icon: icon('!', 'mk mk-inc', 30), zIndexOffset: 500 }).on('click', (e) => {
        L.DomEvent.stopPropagation(e); cb.current.onSelectIncident(i.id)
      }), (mk, i) => {
        setTip(mk, `${incidentTitle(i)}${i.status === 'working' ? ' (wird bearbeitet)' : ''}`)
        const sel = selected.incidentId === i.id
        const cls = `mk mk-inc ${i.status === 'working' ? 'working' : ''} ${sel ? 'sel' : ''}`
        setIcon(mk, cls, () => icon('!', cls, 30))
      })
    sync(veh, game.vehicles.filter((v) => v.status !== 2), (v) =>
      L.marker(v.pos, { icon: icon('', 'mk mk-veh', 24), zIndexOffset: 300 }).on('click', (e) => {
        L.DomEvent.stopPropagation(e); cb.current.onSelectVehicle?.(v.id)
      }), (mk, v) => {
        const ll = mk.getLatLng()
        if (ll.lat !== v.pos[0] || ll.lng !== v.pos[1]) mk.setLatLng(v.pos)
        const cls = `mk mk-veh t-${VEHICLE_TYPES[v.type].kind}${focus?.vehicleId === v.id ? ' sel' : ''}`
        setIcon(mk, `${v.status}|${cls}`, () => icon(`${v.status}`, cls, 24))
        setTip(mk, `${v.callsign} · Status ${v.status}`)
      })
  })

  useEffect(() => {
    const layer = layers.current.siteLayer
    if (!layer) return
    const taken = new Set(game.stations.map((s) => s.siteId))
    for (const s of sites) {
      if (taken.has(s.id)) { const mk = layer.sites.get(s.id); if (mk) { mk.remove(); layer.sites.delete(s.id) } continue }
      let mk = layer.sites.get(s.id)
      if (!mk) {
        mk = L.marker(s.pos, { icon: icon('', `mk mk-site site-${s.kind || 'FW'}`, 16) }).bindTooltip(s.name).on('click', (e) => {
          L.DomEvent.stopPropagation(e); cb.current.onSiteClick(s)
        }).addTo(layer)
        layer.sites.set(s.id, mk)
      }
      const active = buildMode === (s.kind || 'FW')
      if (mk._active !== active) { mk._active = active; mk.getElement()?.classList.toggle('active', active) }
    }
  })

  // Gewählter Bauplatz im Bauformular
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (layers.current.buildMk) { layers.current.buildMk.remove(); layers.current.buildMk = null }
    if (buildPos && buildMode) {
      layers.current.buildMk = L.marker(buildPos, { icon: icon(buildMode, `mk mk-st mk-${buildMode} mk-build`, 34), zIndexOffset: 900, interactive: false }).addTo(m)
    }
  }, [buildPos, buildMode])

  // 📍 Karte auf ein Fahrzeug oder eine Wache zentrieren
  useEffect(() => {
    if (focus?.pos && map.current) map.current.flyTo(focus.pos, Math.max(map.current.getZoom(), 14), { duration: 0.6 })
  }, [focus?.n])

  useEffect(() => {
    const inc = game.incidents.find((i) => i.id === selected.incidentId)
    if (inc && map.current) map.current.panTo(inc.pos)
  }, [selected.incidentId])

  return <div ref={el} className="map" />
}

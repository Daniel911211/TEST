import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { CENTER, HOSPITALS, VEHICLE_TYPES } from './game.js'

const icon = (html, cls, size = 28) =>
  L.divIcon({ html, className: cls, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })

export default function MapView({ game, sites, selected, buildMode, onMapClick, onSelectIncident, onSelectStation, onSiteClick }) {
  const el = useRef(null)
  const map = useRef(null)
  const layers = useRef({ st: new Map(), veh: new Map(), inc: new Map() })
  const cb = useRef({})
  cb.current = { onMapClick, onSelectIncident, onSelectStation, onSiteClick, buildMode }

  useEffect(() => {
    const m = L.map(el.current, { zoomControl: true }).setView(CENTER, 12)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    for (const h of HOSPITALS) L.marker(h.pos, { icon: icon('H', 'mk mk-hosp', 24) }).bindTooltip(h.name).addTo(m)
    const siteLayer = L.layerGroup().addTo(m)
    siteLayer.sites = new Map()
    layers.current.siteLayer = siteLayer
    if (sites.length) m.fitBounds(L.latLngBounds(sites.map((s) => s.pos)).pad(0.05))
    m.on('click', (e) => cb.current.onMapClick([e.latlng.lat, e.latlng.lng]))
    map.current = m
    return () => m.remove()
  }, [])

  useEffect(() => {
    if (map.current) map.current.getContainer().style.cursor = buildMode && !sites.some((s) => (s.kind || 'FW') === buildMode) ? 'crosshair' : ''
  }, [buildMode])

  useEffect(() => {
    const m = map.current
    const { st, veh, inc } = layers.current
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
        mk.bindTooltip(`${i.type.name}${i.status === 'working' ? ' (wird bearbeitet)' : ''}`)
        const sel = selected.incidentId === i.id
        mk.setIcon(icon('!', `mk mk-inc ${i.status === 'working' ? 'working' : ''} ${sel ? 'sel' : ''}`, 30))
      })
    sync(veh, game.vehicles.filter((v) => v.status !== 2), (v) =>
      L.marker(v.pos, { icon: icon('', 'mk mk-veh', 24), zIndexOffset: 300 }), (mk, v) => {
        mk.setLatLng(v.pos)
        mk.setIcon(icon(`${v.status}`, `mk mk-veh t-${v.type}`, 24))
        mk.bindTooltip(`${v.callsign} · Status ${v.status}`)
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
      mk.getElement()?.classList.toggle('active', buildMode === (s.kind || 'FW'))
    }
  })

  useEffect(() => {
    const inc = game.incidents.find((i) => i.id === selected.incidentId)
    if (inc && map.current) map.current.panTo(inc.pos)
  }, [selected.incidentId])

  return <div ref={el} className="map" />
}

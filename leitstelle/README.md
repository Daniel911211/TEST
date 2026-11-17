# Leitstelle – privater Nachbau eines Leitstellen-Simulators

Browserspiel (React + Vite + Leaflet/OpenStreetMap): Wachen bauen, Fahrzeuge kaufen, Einsätze disponieren.

```
npm install
npm run dev      # Entwicklung
npm run build    # Produktion -> dist/
```

Hinweise: Fahrzeuge fahren auf Routen des OSRM-Servers (Standard: router.project-osrm.org; eigene URL per `localStorage.setItem("osrm-url", "http://localhost:5000")` oder `VITE_OSRM_URL`). Ohne Routing-Server fahren sie nicht; Anzeige-ETAs sind Luftlinie × 1,3. Der Spielstand liegt im localStorage.
Für die Kartenkacheln wird Internet benötigt.

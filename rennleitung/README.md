# Rennleitung – Formel-1-Simulator

Du bist die Rennleitung: Autos fahren automatisch, es passieren Zwischenfälle, und du entscheidest.

**Starten**

```bash
npm install
npm run dev      # Entwicklung
npm run build    # Produktions-Build
npm run sim-test # Simulation ohne Oberfläche testen
```

**Was drin ist**

- Strecken: Spa, Monza, Monaco (frei erweiterbar in `src/sim/tracks.js`)
- 20 Autos mit Zeitnahme, Überholen, Rennende mit Zielflagge
- Sektorflaggen (Grün/Gelb/Doppelgelb, Tasten 1 2 3), VSC, Safety Car, Rote Flagge, Neustart
- Zufallsfälle mit Fall-Dialog, Replay, Regelauszug und Fahreraussagen:
  Track Limits, Kollision (Schuldfrage), Unsichere Freigabe, Überholen unter Gelb
- Direkte Strafen pro Fahrer (Verwarnung, 5/10 s, Durchfahrt, Stop & Go, Schwarze Flagge)
- Bewertung nach Sicherheit, Fairness und Ablauf, Rennbericht mit Note A–F
- Funkverkehr und Race-Control-Messages

Fahrerfeld: `src/sim/drivers.js`. Leertaste pausiert, das Rennen pausiert außerdem während ein Fall geprüft wird.

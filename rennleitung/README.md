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

- Strecken: Spa, Monza, Monaco mit echtem Verlauf und echten Kurvennamen (`src/sim/tracks.js`, `src/sim/trackData.js`)
- 22 Autos (Feld 2026) mit Zeitnahme, Überholen, Rennende mit Zielflagge
- Zwei Kameraansichten: eine folgt einem Auto, eine zeigt den Ort des letzten Vorfalls
- Wetter: Regenschauer mit weniger Grip, mehr Drehern und Aquaplaning-Gefahr
- Startprozedur: Einführungsrunde, Startampel, Startabbruch bei abgewürgtem Auto
- Töne für Funk, Meldungen, Vorfälle und Startampel
- Streckenkamera frei verschiebbar: Rechteck auf der Karte ziehen oder doppelklicken
- Boxengasse mit Garagen und Tempolimit, Boxenstopps, Reifen (Soft, Medium, Hard, Intermediate, Regen) mit Verschleiß und Pflicht zu zwei Mischungen. In Rennen bis 3 Runden gibt es keine Pflichtstopps, nur Reparatur-, Straf- und Wetterstopps
- Sektorflaggen (Grün/Gelb/Doppelgelb, Tasten 1 2 3), VSC, Safety Car, Rote Flagge, Neustart
- Zufallsfälle mit Fall-Dialog, Replay, Regelauszug und Fahreraussagen:
  Track Limits, Kollision (Schuldfrage), Unsichere Freigabe, Überholen unter Gelb, Frühstart, Falsche Startposition, Tempo in der Boxengasse
- Direkte Strafen pro Fahrer (Verwarnung, 5/10 s, Durchfahrt, Stop & Go, Schwarze Flagge)
- Bewertung nach Sicherheit, Fairness und Ablauf, Rennbericht mit Note A–F
- Funkverkehr mit vielen Sprüchen (`src/sim/radio.js`) und Race-Control-Messages

Fahrerfeld: `src/sim/drivers.js`. Leertaste pausiert, das Rennen pausiert außerdem während ein Fall geprüft wird.

Streckengeometrie abgeleitet aus [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT-Lizenz, © Tomislav Bacinger). Inoffizielle Daten.

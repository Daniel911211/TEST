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

- Strecken: Spa, Monza, Monaco, Silverstone, Suzuka und Spielberg mit echtem Verlauf und echten Kurvennamen (`src/sim/tracks.js`, `src/sim/trackData.js`)
- Menü „Neues Rennen“: Strecke, Distanz, Ablauf (nur Rennen oder Qualifying + Rennen) und Schwierigkeit (Einsteiger, Normal, Profi)
- Qualifying: drei gezeitete Runden, nur gelbe Flaggen, Fälle zu Track Limits und Behindern, das Ergebnis wird die Startaufstellung
- Saison über sechs Rennen mit Fahrerwertung und Gesamtnote (`src/season.js`, gespeichert im Browser)
- Einführung in sechs Schritten mit Übungsrennen (Knopf HILFE)
- Weitere Fälle: Blaue Flaggen, Abdrängen, Spurwechsel beim Verteidigen, Abkürzen, Abstand hinter dem Safety Car, Einfahrt bei gesperrter Boxengasse
- Boxengasse sperren, Proteste der Teams gegen harte Strafen, Startverzögerung, wenn der Arztwagen nicht bereit ist
- 22 Autos (Feld 2026) mit Zeitnahme, Überholen, Rennende mit Zielflagge
- Zwei Kameraansichten: eine folgt einem Auto, eine zeigt den Ort des letzten Vorfalls
- Wetter: Regenschauer mit weniger Grip, mehr Drehern und Aquaplaning-Gefahr
- Startprozedur: Einführungsrunde, Startampel, Startabbruch bei abgewürgtem Auto
- Töne für Funk, Meldungen, Vorfälle und Startampel
- Streckenkamera frei verschiebbar: Rechteck auf der Karte ziehen oder doppelklicken
- Boxengasse mit Garagen und Tempolimit, Boxenstopps, Reifen (Soft, Medium, Hard, Intermediate, Regen) mit Verschleiß und Pflicht zu zwei Mischungen. In Rennen bis 3 Runden gibt es keine Pflichtstopps, nur Reparatur-, Straf- und Wetterstopps
- Streckensicherung umschaltbar zwischen MANUELL und AUTO: Die Automatik übernimmt Flaggen, VSC, Safety Car, Rote Flagge und den Neustart, mit menschlicher Reaktionszeit und gelegentlichen Fehleinschätzungen. Start und Fälle bleiben beim Spieler
- Safety Car fährt beim Ruf sofort aus, sammelt mit grünen Lichtern das Feld ein und schaltet auf Orange, sobald der Führende dahinter ist. Der Arztwagen (Medical Car) folgt dem Feld in der Einführungsrunde und in Runde 1
- Startboxen in der Startaufstellung
- Zurückrunden: Überrundete dürfen auf Kommando das Feld und das Safety Car überholen und reihen sich hinten ein
- Bergung sichtbar: Bergungsfahrzeug mit Kran, Streckenposten mit gelber Flagge, Trümmer, die weggeräumt werden
- Kollisions-Replay in der echten Kurve mit dem echten Streckenverlauf
- Einsätze des Arztwagens: Nach schweren Unfällen wird der Arzt angefordert; die Bergung beginnt erst, wenn der Fahrer versorgt ist. Fahrende Autos weichen stehenden Autos und dem Arztwagen aus
- Sektorflaggen (Grün/Gelb/Doppelgelb, Tasten 1 2 3), VSC, Safety Car, Rote Flagge, Neustart
- Zufallsfälle mit Fall-Dialog, Replay, Regelauszug und Fahreraussagen:
  Track Limits, Kollision (Schuldfrage), Unsichere Freigabe, Überholen unter Gelb, Frühstart, Falsche Startposition, Tempo in der Boxengasse
- Direkte Strafen pro Fahrer (Verwarnung, 5/10 s, Durchfahrt, Stop & Go, Schwarze Flagge)
- Bewertung nach Sicherheit, Fairness und Ablauf, Rennbericht mit Note A–F
- Funkverkehr mit vielen Sprüchen (`src/sim/radio.js`) und Race-Control-Messages

Fahrerfeld: `src/sim/drivers.js`. Leertaste pausiert, das Rennen pausiert außerdem während ein Fall geprüft wird.

Streckengeometrie abgeleitet aus [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT-Lizenz, © Tomislav Bacinger). Inoffizielle Daten.

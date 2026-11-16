# Übergabe: Leitstelle (privater Nachbau eines Leitstellen-Simulators)

Stand: 16.11.2026, Branch `ccr-794c805b-4exbgh`, Draft-PR #4 im Repo `Daniel911211/TEST`. Alles liegt im Ordner `leitstelle/`.
Der Nutzer spricht Deutsch und möchte **vor jedem Start Rückfragen** gestellt bekommen. Das Spiel ist privat.
Vorbild ist leitstellenspiel.de: **nur Struktur übernehmen, keine Grafiken oder Texte.** Recherche dazu in
`recherche/leitstellenspiel/` (Erfahrungsbericht + 32 Screenshots, reine Arbeitsreferenz). Umbauplan und Stand: `UMBAUPLAN.md`.

## Starten
`cd leitstelle && npm install && npm run dev` → `http://localhost:5173`. Spielstand liegt im Browser (localStorage, Schlüssel `leitstelle-save-v2`).
Die Karte (OSM-Kacheln) und das Routing (OSRM-Demo-Server, `router.project-osrm.org`) laden direkt im Browser. Eigene OSRM-URL per `localStorage.setItem('osrm-url', '…')` oder `VITE_OSRM_URL`.

Automatisches Durchspielen der Spiellogik (ohne Oberfläche, Luftlinien-Routing), um Logik- und Balance-Fehler zu finden:
```
npx esbuild tools/durchspielen.mjs --bundle --platform=node --format=esm --outfile=/tmp/ds.mjs && SAVE=/tmp/spielstand.json node /tmp/ds.mjs 48
```
Gibt Stundenwerte, Käufe, Wartezeiten und Auffälligkeiten aus; `SAVE=` schreibt einen Spielstand, den man im Browser in localStorage einspielen kann.

## Technik (React 18, Vite 5, Leaflet 1.9)
- `src/game.js`: reine Spiellogik (Tick, Fahrzeuge, Einsätze, Funk, Werkstatt, Kliniken, Verkauf, Rückalarmieren). Keine UI-Abhängigkeit.
- `src/stichworte.js`: 52 Einsatzstichworte nach dem Hessen-Erlass (F, H, R), Rollen, Eskalationsketten, Grundwahrscheinlichkeiten nach Stufe.
- `src/App.jsx`: nur Layout-Rahmen und Auswahl-/Overlay-Zustand. `src/MapView.jsx`: Karte, Marker werden zwischengespeichert (kein Neuzeichnen, keine `transform`-Animationen auf Markern, sonst springen sie). Klick auf Wachen-, Fahrzeug- und Einsatzmarker.
- `src/ui/`: `EinsatzPanel.jsx` (Einsatzliste + Einsatzfenster), `WachenPanel.jsx` (Wachenliste unten links), `SprechwunschPanel.jsx`, `FunkPanel.jsx`,
  `Overlay.jsx` (Rahmen mit Kopf, Reitern, Vor/Zurück), `WachenOverlay.jsx` (Reiter Fahrzeuge, Fahrzeugmarkt, Ausbau; Reiterliste je Wachentyp in `TABS`),
  `FahrzeugOverlay.jsx`, `BauFormular.jsx` („Neues Gebäude bauen“), `helpers.js` (Fahrzeuggruppen, Kurznamen).
- `src/data/feuerwehren.json` (Feuer- und Rettungswachen aus OSM/Nominatim), `zusatz-standorte.json`, `kliniken.json` (4 Kliniken mit Bettenkapazität).
- `scripts/fetch-nominatim.py` (Standorte neu holen), `scripts/fetch-feuerwehren.mjs` (Overpass, ging hier nicht). `tools/durchspielen.mjs` (siehe oben).

## Oberfläche (Stand nach Etappe 1–4)
- Kopfzeile: Uhr, Geld, Punkte/Rang, erledigt/gescheitert, Sprechwunsch-Zähler, Geschwindigkeit (Pause, 1x, 2x, 5x), Neu.
- Oben: Karte links, rechts Einsatzbereich (Liste mit „Fehlt noch: …“, darunter Einsatzfenster mit Alarmiert, Freie Fahrzeuge nach Fahrzeit mit Typfiltern, Empfehlung, Alarmieren).
- Unten: Wachen (Knopf „Neues Gebäude bauen“, Filter, Suche, Liste mit Fahrzeug-Chips) | Sprechwünsche + Kliniken | Funk.
- Overlays über der Karte: Wache (Marker oder „Details“), Fahrzeug (Marker, Chip oder Tabellenzeile), Bauformular (Gebäudetyp, Name, Standort per Klick, Bauen).

## Spielregeln (so mit dem Nutzer abgestimmt)
- Wachen werden nur auf Bauplätzen (Marker) gebaut. Erste Wache bekommt ein Gratis-Fahrzeug (HLF 20 / RTW). Startgeld 30.000 €. Stellplätze unbegrenzt. Sonderfahrzeuge (ELW 2, ABC-Erkunder, GW-Mess, Dekon-P) nur auf Feuerwachen. Kein Personal, keine Ausbildung.
- Einsatz-Spawn: alle 360–750 Spielsekunden bei 2 Wachen, mit mehr Wachen häufiger (Faktor (Wachen+6)/8); nur Stichwörter, die mit den vorhandenen Fahrzeugen besetzbar sind; kein neuer Einsatz, solange kein Fahrzeug frei ist. Einsätze scheitern vorerst nicht, keine Strafen. Bonus bei schneller Besetzung.
- Status 1/2/3/4/5/6/7/8. Fahrzeugzustand sinkt, Werkstatt (auch eigene), Panne unter 30 %. Fahrzeuge verkaufbar (ungenutzt voller Preis). Rückalarmieren (Status 3) und vom Einsatz abziehen (Status 4) möglich, damit Kräfte umverteilt werden können.
- Einsatzleitung: ELW 2 vor ELW 1 vor Feuerwehrfahrzeug vor Rettungsdienst, sonst das zuerst eingetroffene. Lagemeldung (von selbst ~70 % oder anforderbar) und Nachforderung sind unabhängig.
- ELW 2: ab F4-Klasse Pflicht, bei F3/F3Y u. ä. per Funk-Rückfrage an den ELW 1.
- Erkundung beim Eintreffen: Einsatzleiter erhöht ggf. das Stichwort. Entwicklung in Ketten, jede Stufe halb so wahrscheinlich.
- R-Stichwörter: R1 = RTW, R2 = RTW + Notarzt, R3 = Notarzt allein (nur als Nachforderung).
- Klinik: Patient hat nur bei leichten Fällen einen Wunsch, die Leitstelle prüft die Kapazität und macht ggf. einen Gegenvorschlag. Bett wird bei Bestätigung reserviert.

## Erkenntnisse aus dem Durchspielen (48–72 Spielstunden)
- Logik stabil: keine NaN, keine hängenden Fahrzeuge, Eskalationen/ELW 2/MANV/Notarzt-Nachforderung laufen.
- Geld sammelt sich an (ca. 5.000–8.000 € je Spielstunde bei 8 Wachen), weil es nach Sonderfahrzeugen nichts mehr zu kaufen gibt → Erweiterungen/Stufen/Stellplätze sind der nächste Balance-Hebel.
- Ohne die Bremse „kein Spawn ohne freies Fahrzeug“ blockierten sich Einsätze gegenseitig (alle warten auf Nachforderungen).

## Als Nächstes möglich
- Erweiterungen je Wache (Reiter „Ausbau“ ausbauen): Stufen, Stellplatzgrenzen, Freischaltung von Fahrzeugtypen, Bauzeit in Spielzeit (Werkstatt ist bisher sofort fertig).
- Fahrzeuge „ab N Wachen“ freischalten (wie im Vorbild), Einsatzorte auf echte Adressen, Stichwörter nach Ortstyp, Wetter.

## Nicht gewollt
Personal/Ausbildung, Chat, Verband, Coins, Toplisten, POIs.

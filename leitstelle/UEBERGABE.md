# Übergabe: Leitstelle (privater Nachbau eines Leitstellen-Simulators)

Stand: Branch `ccr-794c805b-4exbgh`, Draft-PR #4 im Repo `Daniel911211/TEST`. Alles liegt im Ordner `leitstelle/`.
Der Nutzer spricht Deutsch und möchte **vor jedem Start Rückfragen** gestellt bekommen. Das Spiel ist privat.

## Starten
`cd leitstelle && npm install && npm run dev` → `http://localhost:5173`. Spielstand liegt im Browser (localStorage, Schlüssel `leitstelle-save-v2`).
Die Karte (OSM-Kacheln) und das Routing (OSRM-Demo-Server, `router.project-osrm.org`) laden direkt im Browser. Eigene OSRM-URL per `localStorage.setItem('osrm-url', '…')` oder `VITE_OSRM_URL`.

## Technik (React 18, Vite 5, Leaflet 1.9)
- `src/game.js`: reine Spiellogik (Tick, Fahrzeuge, Einsätze, Funk, Werkstatt, Kliniken, Verkauf). Keine UI-Abhängigkeit.
- `src/stichworte.js`: 52 Einsatzstichworte nach dem Hessen-Erlass (F, H, R), Rollen (Gruppe, Staffel, Hubrettung, ELW 1/2, RW, GW-L, GW-A, ABC/GWM/Dekon, RTW/NEF/KTW), Eskalationsketten, Grundwahrscheinlichkeiten nach Stufe.
- `src/App.jsx`: Oberfläche mit Seitenpanel (Tabs Einsätze, Wachen, Fahrzeuge, Funk). `src/MapView.jsx`: Karte, Marker werden zwischengespeichert (kein Neuzeichnen, keine `transform`-Animationen auf Markern, sonst springen sie).
- `src/data/feuerwehren.json` (131 Feuerwachen, 11 Rettungswachen aus OSM/Nominatim), `zusatz-standorte.json` (Rettungswachen Flieden, Hosenfeld, Großenlüder), `kliniken.json` (4 Kliniken mit Bettenkapazität).
- `scripts/fetch-nominatim.py` (Standorte neu holen), `scripts/fetch-feuerwehren.mjs` (Overpass, ging hier nicht).

## Spielregeln (so mit dem Nutzer abgestimmt)
- Wachen werden nur auf Bauplätzen (Marker) gebaut. Erste Wache bekommt ein Gratis-Fahrzeug (HLF 20 / RTW). Startgeld 30.000 €. Stellplätze unbegrenzt. Sonderfahrzeuge (ELW 2, ABC-Erkunder, GW-Mess, Dekon-P) nur auf Feuerwachen.
- Einsatz-Spawn: alle 360–750 Spielsekunden, nur Stichwörter, die mit den vorhandenen Fahrzeugen besetzbar sind. Einsätze scheitern vorerst nicht, keine Strafen. Bonus bei schneller Besetzung.
- Status 1/2/3/4/5/6/7/8. Fahrzeugzustand sinkt, Werkstatt (auch eigene), Panne unter 30 %. Fahrzeuge verkaufbar (ungenutzt voller Preis).
- Einsatzleitung: erstes Fahrzeug, dann ELW 1, dann ELW 2. Lagemeldung (von selbst ~70 % oder anforderbar) und Nachforderung sind unabhängig, die Lagemeldung kann zufällig auch eine Nachforderung enthalten.
- ELW 2: ab F4-Klasse Pflicht, bei F3/F3Y u. ä. per Funk-Rückfrage an den ELW 1.
- Erkundung beim Eintreffen: Einsatzleiter erhöht das Stichwort (z. B. F1 → F2 oder F WALD 1). Entwicklung in Ketten, jede Stufe halb so wahrscheinlich.
- R-Stichwörter: R1 = RTW, R2 = RTW + Notarzt, R3 = Notarzt allein (nur als Nachforderung zu R0/R1, kein eigener Einsatz).
- Klinik: Patient hat nur bei leichten Fällen einen Wunsch, die Leitstelle prüft die Kapazität und macht ggf. einen Gegenvorschlag. Bett wird bei Bestätigung reserviert.

## Als Nächstes geplant
**Wachen-Overlay** (Klick auf die Wache öffnet ein Fenster über der Karte): Reiter aus einer einzigen Liste (leicht erweiterbar), am Anfang Übersicht, Fahrzeuge, Gebäude/Ausbau. Ausbau mit Stufen, Kosten, Bauzeit (Werkstatt vorhanden, geplant: Fahrzeughalle für Stellplätze, Aufenthaltsräume). Vorbild: leitstellenspiel.de (nur Struktur, keine Grafiken oder Texte übernehmen). Die Wiki-Struktur dort: Leitstelle mit Reitern Gebäude, Erweiterungen, Fahrzeuge, Lehrgänge; Wachen mit Stufen, Ausbauten gegen Geld und Bauzeit, Stellplatzgrenzen.
Der Nutzer wollte dazu Screenshots aus seinem angemeldeten Leitstellenspiel zeigen, das braucht eine Sitzung am eigenen Rechner (Chrome-Erweiterung).

## Weitere Ideen (offen)
Einsatzorte auf echte Adressen/Straßen legen, Stichwörter nach Ortstyp (BMA nur an Gewerbe, Waldbrand nur im Wald); Boote/Taucher; Personal und Ausbildung; Alarm- und Ausrückeordnung des Landkreises; Wetter.

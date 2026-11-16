# Umbauplan: Oberfläche nach Vorbild leitstellenspiel.de

Stand: 16.11.2026. Abgestimmt mit Daniel: kein Personal, keine Ausbildung, Bauzeiten in Spielzeit,
Karte links und Einsätze rechts, unten Bereiche wie im Vorbild (Wachen, Funk), kein Chat, keine Verbandseinsätze.
Erweiterungen, Stufen und Stellplatzgrenzen kommen später. Ziel dieser Runde: das jetzige Spiel im neuen Aufbau
einmal durchspielbar machen. Nur Struktur übernehmen, keine Grafiken oder Texte des Vorbilds.

## Etappe 1: Neues Grundlayout (erledigt 16.11.2026)

Kopfzeile wie bisher (Uhr, Geld, Punkte/Rang, Geschwindigkeit, Neu).

Oberer Bereich, zwei Spalten:
- Links: Karte (ca. zwei Drittel der Breite).
- Rechts: **Einsatzbereich**.
  - Oben die Einsatzliste: pro Einsatz Stichwort, Adresse/Ort, Wartezeit oder Fortschrittsbalken,
    rote Zeile „Fehlt noch: 1× Hubrettung, 1× RTW“, farbige Statusmarke (offen, in Bearbeitung, Nachforderung).
  - Darunter das **Einsatzfenster** des gewählten Einsatzes: Kopf mit Stichwort und Belohnung,
    Block „Alarmiert“ (Fahrzeuge mit Status, Wache, Restfahrzeit), Block „Freie Fahrzeuge“ als Tabelle
    (Haken, Status, Funkrufname, Typ, Fahrzeit, Wache) sortiert nach Fahrzeit mit Typ-Filterknöpfen
    (Alle, Löschfahrzeuge, Sonder, Rettung), Knopf „Empfehlung“ (unser AAO-Ersatz) und roter Fuß „Alarmieren (n)“.
    Lagemeldung, ELW-2-Rückfrage, Einsatzleitung und Wasser/Atemschutz bleiben wie bisher im Kopf.

Unterer Bereich, drei Spalten:
- **Wachen**: Knopf „Neue Wache bauen“ (Feuerwache / Rettungswache), Typ-Filter, Suchfeld,
  Liste der Wachen mit Details-Knopf, darunter die Fahrzeuge jeder Wache mit Status-Zahl in Statusfarbe.
- **Sprechwünsche und Kliniken**: Status-5-Anfragen (Klinikwahl) und freie Betten der Kliniken.
- **Funk**: Statusmeldungen der Fahrzeuge (neueste oben), Lagemeldungen, Nachforderungen.

Der bisherige Reiter „Fahrzeuge“ (Zustand, Werkstatt, Verkauf) wandert ins Wachen-Overlay (Etappe 2).

## Etappe 2: Wachen-Overlay (erledigt 16.11.2026)

Öffnet sich über der Karte bei Klick auf den Wachen-Marker oder auf „Details“.
- Kopf: Name, Typ, Fahrzeuge (Anzahl), Werkstatt (ja/nein), Knopf „Fahrzeugmarkt“.
- Reiter aus einer Liste je Wachentyp (leicht erweiterbar): **Fahrzeuge**, **Fahrzeugmarkt**, **Ausbau**.
  - Fahrzeuge: Tabelle Funkrufname, Status, aktueller Einsatz, Zustand als Balken, Besatzung,
    Knöpfe „Werkstatt“ und „Verkaufen“.
  - Fahrzeugmarkt: Kacheln nach Gruppen (Löschfahrzeuge, Sonderfahrzeuge, Rettungsdienst) mit Kurzname,
    Langname, Besatzung, Wasser, Atemschutz, Preis, „n in Besitz“, Kaufknopf mit Bestätigung.
  - Ausbau: vorerst nur Werkstatt (Kosten, Bauzeit in Spielzeit). Platz für spätere Erweiterungen.
- Fuß: Schließen. Vor/Zurück zur nächsten Wache.

## Etappe 3: Fahrzeug-Overlay (erledigt 16.11.2026)

Klick auf ein Fahrzeug auf der Karte oder in einer Liste: Wache, Typ, Status, Zustand, Laufleistung,
aktueller Einsatz, Besatzung; Knöpfe Rückalarmieren (Status 1), Werkstatt, Verkaufen.

## Etappe 4: Durchspielen und Feinschliff (erledigt 16.11.2026)

Ein Spiel von der ersten Wache bis zu mehreren Wachen und Sonderfahrzeugen durchspielen,
Layout-Fehler und Balance-Probleme notieren und beheben.

## Nicht in dieser Runde

Erweiterungen, Stufen und Stellplatzgrenzen, Personal und Lehrgänge, Lager, Spezialisierung,
Gebäudekomplexe, Coins, Chat, Verband, Toplisten.

## Technik

- Neue Dateien: `src/ui/EinsatzPanel.jsx`, `src/ui/WachenPanel.jsx`, `src/ui/FunkPanel.jsx`,
  `src/ui/WachenOverlay.jsx`, `src/ui/FahrzeugOverlay.jsx`, `src/ui/Overlay.jsx` (Rahmen mit Reitern).
- `App.jsx` wird zum Layout-Rahmen und hält nur noch Auswahl und Overlay-Zustand.
- `game.js` bleibt unangetastet, außer kleinen Helfern (z. B. Fahrzeuggruppen für Filter).
- Marker in MapView.jsx bleiben zwischengespeichert; Fahrzeug-Marker bekommen einen Klick-Handler.

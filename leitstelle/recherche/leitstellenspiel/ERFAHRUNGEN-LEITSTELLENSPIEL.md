# Erfahrungen aus leitstellenspiel.de (Vorbild-Recherche)

Stand: 16.11.2026, angesehen im angemeldeten Konto des Nutzers (Leitstelle NHF, Raum Fulda).
Zweck: Struktur-Vorbild für das Wachen-Overlay und weitere Spielmechanik in `leitstelle/`.
**Nur Struktur und Spielregeln übernehmen, keine Grafiken oder Texte.** Die Bilder im Ordner `bilder/` sind reine Arbeitsreferenz.

## 1. Hauptseite (Bild 01)

Drei-Spalten-Layout:
- Oben: Karte (Leaflet, OSM) mit Wachen-Markern, rechts daneben die Einsatzliste.
- Unten links: Wachenliste mit Typ-Filterknöpfen (Feuerwehr, Rettung, Polizei, THW, Wasserrettung, Bergrettung, Seenotrettung, Schulen, Leitstelle, Gebäudekomplexe, Alle Anzeigen) und einem Suchfeld. Pro Wache: Name, Details-Knopf, darunter die Fahrzeuge mit FMS-Status als farbige Zahl (2 grün, 4 rot, 3 gelb, 1 blau, 5/6/7 grau) und ggf. „Rückalarmieren".
- Unten Mitte: Chat (Verband). Unten rechts: Funk (Statusmeldungen der Fahrzeuge, z. B. „Zum Einsatz / Beim Einsatzort", „Patient aufgenommen", „Einsatzbereit auf Wache").
- Kopfzeile: Credits (hier 5.019.632), Coins, Nachrichten, Ortssuche, Pause-Knopf, Zähler für Einsätze (eigene/Verband).
- Einsatzliste: pro Einsatz ein Balken mit Fortschritt, darunter rot „Fehlende Fahrzeuge: …", „Fehlendes Personal: …", „Uns fehlt: 350 Sonderlöschmittel". Sortierung wählbar (Älteste, Neueste, A–Z, Credits, Gefangene, Patienten).

Für unser Spiel bedeutet das: Die Einsatzliste zeigt immer explizit, **was noch fehlt** (Fahrzeuge, Ausbildung, Verbrauchsmittel). Das ist der zentrale Spielanreiz.

## 2. Wachen-Overlay (Bilder 05 bis 13)

Klick auf „Details" öffnet ein großes Fenster über der Karte (Lightbox mit iframe). Aufbau:

**Kopfbereich** (immer sichtbar):
- Titel = Wachenname, rechts „Vorheriges Gebäude / Leitstelle / Nächstes Gebäude" zum Durchblättern.
- Stufe: 10 → Knopf „Ausbauen"
- Einsatzbereitschaft: Einsatzbereit → Knopf „Umschalten"
- Fahrzeuge: 11 von maximal 11 → Knopf „Fahrzeugmarkt"
- Lager: 0/0 → Knopf „Ausrüstungsmarkt"
- Personal: 46 Angestellte → Knöpfe „Anzeigen", „Neue Leute werben"
- Generiert: Feuerwehreinsätze (welche Einsatzarten diese Wache erzeugt)

**Reiter** (Feuerwache): Fahrzeuge, Erweiterungen, Gebäudekomplex, Lager, Spezialisierung.
Reiter einer SEG (Rettung): nur Fahrzeuge und Erweiterungen. Die Reiterliste hängt also vom Gebäudetyp ab.

**Fußbereich**: Bearbeiten, Gebäude verschieben, Abreißen (keine Gutschrift).

### Reiter Fahrzeuge (Bild 05)
Tabelle: Fahrzeugbild, Name (Funkrufname, Link zur Fahrzeugseite), Stift-Symbol (bearbeiten), FMS-Status, Aktueller Einsatz, Besatzung (Maximal). Beispiel Feuerwehr Hosenfeld: 1/11/1 (ELW 1), 1/12/1 (ELW 2), 1/22/1 (TLF 16/25), 1/30/1 (DLK 23), 1/42/1 (LF 20), 1/46/1 (HLF 20), 1/51/1 (RW), 1/53/1 (FwK), 1/56/1 (GW-A), 1/59/1 (GW-L2-Wasser), 1/62/1 (GW-Öl).

### Reiter Erweiterungen (Bilder 06 bis 09)
Lange Liste mit Spalten Bezeichnung, Dauer, Voraussetzungen, Preis (Credits oder Coins). Jede Erweiterung hat Beschreibung, freigeschaltete Fahrzeuge, ggf. neue Stellplätze und „Ermöglicht Einsatzarten: …". Bereits gebaute zeigen „Einsatzbereit / Nicht Einsatzbereit" (Umschalter) statt Preis.

| Erweiterung | Dauer | Preis (Credits) | Voraussetzung |
|---|---|---|---|
| Rettungsdienst (RTW, KTW, NEF, GRTW, NAW, ITW auf vorhandenen Stellplätzen) | 7 Tage | 100.000 | – |
| Wasserrettung (GW-Taucher, GW-Wasserrettung, MZB) | 7 Tage | 400.000 | – |
| Flughafenfeuerwehr (FLF, Rettungstreppe) | 7 Tage | 300.000 | pro 10 Feuerwachen eine |
| Werkfeuerwehr (GW-Werkfeuerwehr, ULF, TM 50, Turbolöscher) | 7 Tage | 100.000 | – |
| Netzersatzanlage 50 (NEA50, AB-NEA50) | 5 Tage | 100.000 | – |
| Netzersatzanlage 200 (1 Stellplatz NEA200, 1 AB-Stellplatz) | 7 Tage | 200.000 | Großwache |
| Großlüfter (GW-Lüfter, Anh Lüfter, AB-Lüfter) | 5 Tage | 75.000 | – |
| Drohneneinheit (1 Stellplatz MTF/ELW Drohne) | 5 Tage | 150.000 | – |
| Verpflegungsdienst (2 Stellplätze GW-Küche, FKH, …) | 5 Tage | 200.000 | – |
| Bahnrettung (1 Stellplatz RW-Schiene, HLF Schiene) | 5 Tage | 125.000 | – |
| Tierrettung (1 Stellplatz) | 3 Tage | 100.000 | – |
| Wald- und Vegetationsbrandbekämpfung (4 Stellplätze TLF-W, GTLF, GW-Waldbrand) | 5 Tage | 200.000 | – |
| Großwache (+10 Stellplätze) | 7 Tage | 1.000.000 | pro 10 Feuerwachen eine |
| Abrollbehälter-Stellplatz (mehrfach kaufbar, WLF/AB-…) | 7 Tage | 100.000, später 150.000 | – |
| Anhänger-Stellplatz (mehrfach kaufbar) | 3 Tage | 75.000 | – |

Muster: **Erweiterung = Freischaltung von Fahrzeugtypen + evtl. Stellplätze + evtl. neue Einsatzarten.** Mehrfach-Erweiterungen (AB-Stellplatz, Anhänger) werden teurer, je mehr man hat.

### Reiter Gebäudekomplex (Bild 10)
Zwei Kästen: „Ausbau zu einer Gebäudekomplexbasis" und „Hinzufügen eines Gebäudes zu einer Gebäudekomplexbasis". Voraussetzung: maximale Ausbaustufe (aktuell 10/19). Kosten 500.000 Credits. Für uns vorerst unwichtig.

### Reiter Lager (Bild 11)
Lagerraum (5 Tage, 25.000 Credits, initial 40 Plätze), danach „Zusätzlicher Lagerraum +30" in Stufen (3 Tage, 50.000 bis 100.000 Credits), jede Stufe setzt die vorige voraus. Dient für Ausrüstung (z. B. Sonderlöschmittel, Ölausrüstung).

### Reiter Spezialisierung (Bild 12)
Flughafen-, Wasserrettungs-, Werkfeuerwehr-Spezialisierung: 2 Tage, 50.000 Credits, setzt die passende Erweiterung voraus. Ein spezialisiertes Gebäude generiert nur noch Einsätze dieses Typs, nur eine Spezialisierung gleichzeitig.

### Ausbau-Dialog (Bild 13)
„Kosten: 100.000 Credits · 20 Coins", „Ausbauen auf Stufe: 11", zwei Knöpfe (Credits / Coins), „Abbrechen", darunter „Direkt bis zu einer Stufe ausbauen: 11 12 13 … 19". Jede Stufe = ein Stellplatz mehr. Maximalstufe einer Feuerwache: 19 (bei Kleinwache geringer). Bauzeit wird erst nach Klick sichtbar (nicht geklickt).

### Personal (Bilder 14, 15)
Eigene Seite „Personal": Anzahl (46 Leute), „Neue Leute werben", Lehrgangsfilter, Tabelle mit Name, Ausbildung (leer, ELW 2, Dekon-P, Feuerwehrkran, …), „Gebunden an" (Fahrzeug), Status (Verfügbar / Im Fahrzeug: …), Optionen (bearbeiten, löschen). Personal ist fest einem Fahrzeug zugeordnet; Ausbildungen kommen aus den Schulen.

## 3. Fahrzeugmarkt (Bilder 16 bis 20)

Hinweis oben: „Du hast derzeit keine freien Stellplätze auf der Wache. Du musst erst die Stufe der Wache erweitern." Kategorien-Reiter: Löschfahrzeuge, Tanklöschfahrzeuge, Schlauchwagen, Andere Fahrzeuge, Rettungsdienst, Wasserrettung, Werkfeuerwehr, Flughafen, Logistik-Fahrzeuge, Netzersatzanlagen, Lüfter, Drohnen, Verpflegungsdienst, Bahnrettung, Sonderlöschmittel, Tierrettung, Wald- und Vegetationsbrandbekämpfung, Abrollbehälter.

Jede Kategorie hat Untergruppen (z. B. „Hilfeleistungs-Löschfahrzeuge", „Genormt und häufig verwendet", „Genormte kleinere Fahrzeuge", „Ältere Normung / Regionale Fahrzeuge"). Pro Fahrzeug eine Karte mit: Kurzname, Langname, Max. Personen, Wassermenge, Sonderlöschmittelmenge, Pumpenleistung (als Balken), Preis in Coins und Credits, „1 in Besitz".

Preise und Werte (Credits):
- HLF 10: 20.000 (9 Pers., 1.000 l, 1000 l/min) · HLF 20: 20.000 (9 Pers., 1.600 l, 2000 l/min)
- LF 20: 5.000 (9 Pers., 2.000 l) · LF 10: 5.000 (9 Pers., 1.200 l) · TSF-W, KLF, MLF: 5.000 (6 Pers., 500 bis 1.000 l) · LF 8/6, LF 20/16, LF 10/6, LF 16-TS: 5.000
- TLF 2000, 3000, 8/8, 8/18, 16/24-Tr, 16/25, 16/45, 20/40, 20/40-SL, TLF 16, TLF 4000: je 5.000 · GTLF: 10.000 l Wasser
- DLK 23: 10.000 (ab 3 Feuerwachen) · ELW 1: 10.000 (ab 6) · RW: 12.180 (ab 4) · GW-A: 11.680 (ab 5) · GW-Öl: 12.000 (ab 6) · GW-Messtechnik: 18.300 (ab 10, Lehrgang) · GW-Gefahrgut: 19.200 (ab 11, Lehrgang) · GW-Höhenrettung: 19.500 (ab 12, Lehrgang) · ELW 2: 25.500 (ab 13, Lehrgang) · MTW: 2.500 · WLF: 5.000 (Lehrgang) · Dekon-P: 23.100 (ab 14, Lehrgang) · FwK: 30.000 (ab 14, Lehrgang) · Kleintankwagen: 10.000 · Tankwagen: 15.000

Zwei Freischalt-Mechaniken: **„Wird ab N gebauten Feuerwachen benötigt"** (Fahrzeug erst ab N Wachen kaufbar, dann tauchen auch Einsätze auf, die es brauchen) und **„Benötigt eine Sonderausbildung an der Schule"** (Personal muss Lehrgang haben).

## 4. Einsatzfenster (Bilder 21 bis 24)

Oben: Titel mit Symbol, Adresse, rechts Fortschrittsbalken und Zähler „Feuerwehrleute 81, Rettungsdienstler 34, Polizisten 7, THWler 22". Rote Box „Uns fehlt: 350 Sonderlöschmittel", darunter Bedarfsbalken „Sonderlöschmittelbedarf 2.000: Einsatzstelle 1.650 · Anfahrt 450".

**AAO-Leiste** (Alarm- und Ausrückeordnung): Reiter Feuerwehr, Rettungsdienst, Polizei, THW, Großschadenslagen, darunter Dutzende farbige Knöpfe mit Stichwortnamen („Wohnhausbrand", „Dachstuhlbrand", „Person in Baugrube" …). Ein Klick hakt die passenden Fahrzeuge in der Liste an. Grün = alle Fahrzeuge der AAO verfügbar, rot = nicht alle. Die AAO ist vom Spieler selbst gepflegt.

Darunter links: „Fahrzeuge auf Anfahrt" (Fahrzeug, Wache, Restzeit, Besatzung, Besitzer, Rückalarmieren) und „Fahrzeuge an der Einsatzstelle". Rechts: „Freie Fahrzeuge" mit Filterreitern (Alle, LF, FW Andere, Rettung, Polizei, …), Spalten Checkbox, Status, Fahrzeug, Entfernung (Fahrzeit „01 Min. 43 Sek."), Wache. Sortiert nach Fahrzeit. Farbstreifen links kennzeichnet Fahrzeugtyp. Unten: „Maximale Entfernung von den Fahrzeugen: 1 km … 400 km". Fußleiste rot mit „Alarmieren (0)", Navigation vor/zurück, „Hilfe zu diesem Einsatz".

## 5. Leitstelle (Bilder 25 bis 29)

Reiter: Geplante Einsätze, Protokoll, Statistiken, **Gebäude**, **Erweiterungen**, Fahrzeuge, **Lehrgänge**, Streifenfahrten, Streifenfahrten-Routen, Einstellungen.
- Gebäude: Tabelle aller Wachen mit Ausbaustufe, Bewerbungsphase (Personalwerbung 1/2/3 Tage/Automatisch), Personal, Personal (Soll), zugeordnete Leitstelle.
- Erweiterungen: alle Erweiterungen aller Wachen auf einer Seite (z. B. Windenrettung für RTH 200.000, Großwache für Rettungswache 1.000.000).
- Lehrgänge: pro Schule (Feuerwehrschule 1, 2, Polizeischule, Rettungsschule, THW-Schule) „Neuen Lehrgang starten". Lehrgangsseite: Räume wählen, Lehrgang aus Dropdown, „Im Verband freigeben", dann Personal pro Wache auswählen (max. 10 Personen pro Raum), „Ausbilden". Während der Ausbildung fahren die Personen keine Einsätze.

## 6. Neues Gebäude bauen (Bild 30)

Formular im Wachenpanel: Gebäudetyp (Dropdown), Name, Adresse (vom Marker), „Verschiebe den Marker auf der Karte", Zugeordnete Leitstelle, „Baue ein weiteres Gebäude". Gebäudetypen: Leitstelle, Feuerwache, Feuerwache (Kleinwache), Feuerwehrschule, Rettungswache, Rettungswache (Kleinwache), Rettungsschule, Krankenhaus, Rettungshubschrauber-Station, SEG, Polizeiwache, Polizeiwache (Kleinwache), Bereitschaftspolizei, Polizei-Sondereinheiten, Reiterstaffel, Autobahnpolizei, Polizeihubschrauberstation, Polizeischule, THW, THW Bundesschule, Bereitstellungsraum, Wasserrettung, Rettungshundestaffel, Bergrettungswache, Seenotrettungswache, Schule für Seefahrt, Hubschrauberstation (Seenotrettung). Baupreise je Typ 100.000 bis 500.000 Credits (versteckte „Bauen"-Knöpfe).

## 7. Fahrzeugseite und Fahrzeug bearbeiten (Bilder 31, 32)

Fahrzeugseite: Wache (mit „Verschieben"), Fahrzeugtyp, FMS mit „Rückalarmieren", Max. Personenzahl, Laufleistung gesamt (82,75 km), Aktueller Einsatz, Liste „Personen im Fahrzeug" mit Ausbildung. Rechts „Weiteralarmieren": eigene Einsätze/Verbandseinsätze mit Entfernung, Status, Verletzte, „Alarmieren".
Fahrzeug bearbeiten: Funkrufname, Max. Personenanzahl, Ausrücke-Verzögerung (Sekunden), „In AAO ignorieren", Arbeitszeit-Beginn/-Ende, Eigene Fahrzeugklasse, Grafik hochladen.

## 8. Übertragbare Ideen für unser Spiel (Vorschlag, noch nicht umgesetzt)

1. **Wachen-Overlay** mit festem Kopfbereich (Stufe + Ausbauen, Fahrzeuge x von y + Fahrzeugmarkt, Personal) und Reitern aus einer Liste je Gebäudetyp: Übersicht, Fahrzeuge, Ausbau/Erweiterungen, später Personal, Lager.
2. **Stellplätze an Stufe koppeln**: Stufe n = n Stellplätze, Ausbau kostet Geld und dauert (Bauzeit in Spielzeit). Wir haben aktuell unbegrenzte Stellplätze, das wäre eine bewusste Regeländerung und muss abgestimmt werden.
3. **Erweiterungen als Freischalter**: z. B. „Gefahrgut" schaltet GW-Mess, Dekon-P frei und erlaubt ABC-Stichwörter; „Wasserrettung" schaltet Boote frei. Passt zu unserer bestehenden Regel „Sonderfahrzeuge nur auf Feuerwachen".
4. **Fahrzeuge ab N Wachen** statt alles sofort: einfache Progression ohne Personal-System.
5. **Einsatzliste zeigt fehlende Fahrzeuge/Rollen** explizit, wie bei uns schon teils über Nachforderung.
6. **AAO**: Spieler definiert pro Stichwort einen Standard-Alarmvorschlag, Knopf alarmiert mit einem Klick. Wir haben Stichworte mit Rollen, ein „Vorschlag"-Knopf wäre naheliegend.
7. **Freie-Fahrzeuge-Liste nach Fahrzeit** mit Typ-Filtern und Farbstreifen.
8. Später: Lehrgänge, Lager/Sonderlöschmittel, Spezialisierung, Gebäudekomplex. Für ein Privatspiel eher niedrig priorisiert.

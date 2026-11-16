// Konkrete Einsatzszenarien je Stichwort (eigene Texte).
// name: kurzer Einsatzname für die Liste ("H1 – Baum auf Fahrbahn")
// lage: Lagemeldung der Einsatzleitung nach dem Eintreffen (Funkstil, 1–2 Sätze)
// stabil: harmlose Lage ohne Nachforderung oder Hochstufung (Fehlalarm, Nachschau, Tragehilfe)
// Beim Hochstufen des Stichworts wird ein Szenario des neuen Stichworts gezogen.

export const SZENARIEN = {
  // --- Brand ---
  F1: [
    { name: 'Mülltonnenbrand', lage: 'Brennt eine Restmülltonne an der Hauswand, Fassade leicht verrußt. Ablöschen mit einem C-Rohr, keine Ausbreitung.' },
    { name: 'PKW-Brand', lage: 'PKW im Motorraum in Vollbrand, keine Personen im Fahrzeug. Löschangriff mit Schaum läuft, Straße halbseitig gesperrt.' },
    { name: 'Gartenlaube brennt', lage: 'Brennt eine Gartenlaube in einer Kleingartenanlage, kein Wohngebäude betroffen. Ein C-Rohr im Einsatz, Nachbarn gewarnt.' },
    { name: 'Rauch aus Papiercontainer', lage: 'Papiercontainer vor einem Bürogebäude, starke Rauchentwicklung, keine Flammen mehr sichtbar. Container wird ausgeräumt und abgelöscht.' },
    { name: 'Nachschau nach Brand', stabil: true, lage: 'Keine Flammen mehr feststellbar, Brandgut wurde vom Besitzer abgelöscht. Wir kontrollieren mit der Wärmebildkamera und rücken dann ein.' },
    { name: 'Heckenbrand', lage: 'Brennt eine Thujahecke auf etwa zehn Meter Länge, Übergreifen auf den Carport droht. Zwei C-Rohre vorgenommen.' },
  ],
  F2: [
    { name: 'Küchenbrand', lage: 'Brand in der Küche im zweiten Obergeschoss, Bewohner haben das Haus verlassen. Innenangriff unter Atemschutz, Treppenraum wird entraucht.' },
    { name: 'Dachstuhlbrand', lage: 'Dachstuhl eines Einfamilienhauses in Vollbrand, Bewohner sind draußen. Außenangriff über die Drehleiter, Nachbargebäude wird geschützt.' },
    { name: 'Kellerbrand', lage: 'Brand im Keller eines Mehrfamilienhauses, Treppenraum stark verraucht. Alle Bewohner im Freien, zwei Trupps unter Atemschutz im Innenangriff.' },
    { name: 'Kaminbrand', lage: 'Rußbrand im Schornstein, Funkenflug aus der Esse. Schornsteinfeger ist angefordert, wir kontrollieren alle Geschosse mit der Wärmebildkamera.' },
    { name: 'Zimmerbrand', lage: 'Zimmerbrand im Erdgeschoss, Flammen aus einem Fenster. Wohnung ist geräumt, Innenangriff mit einem C-Rohr läuft.' },
    { name: 'Rauchentwicklung aus Wohnung', lage: 'Deutliche Rauchentwicklung aus einer Wohnung im dritten Stock, Bewohner nicht erreichbar. Tür wird geöffnet, Trupp unter Atemschutz geht vor.' },
  ],
  F2Y: [
    { name: 'Wohnungsbrand, Person vermisst', lage: 'Wohnungsbrand im ersten Obergeschoss, eine Person wird noch in der Wohnung vermutet. Zwei Trupps unter Atemschutz zur Menschenrettung eingesetzt.' },
    { name: 'Dachgeschossbrand, Personen am Fenster', lage: 'Brand im Dachgeschoss, zwei Personen stehen am Fenster und winken. Menschenrettung über die Drehleiter läuft, Innenangriff parallel.' },
    { name: 'Brand in Pflegeheim', lage: 'Brand in einem Bewohnerzimmer eines Pflegeheims, Station wird evakuiert. Mehrere bettlägerige Bewohner müssen getragen werden.' },
    { name: 'Kellerbrand, Treppenraum verraucht', lage: 'Kellerbrand, Treppenraum bis unters Dach verraucht, Bewohner in den Wohnungen eingeschlossen. Fenster werden mit Steckleitern angeleitert.' },
  ],
  F3: [
    { name: 'Brand in Schreinerei', lage: 'Brand in der Werkhalle einer Schreinerei, Holzlager betroffen, starke Rauchentwicklung. Großer Löschangriff von zwei Seiten, Wasserversorgung über Hydranten aufgebaut.' },
    { name: 'Lagerhallenbrand', lage: 'Lagerhalle eines Logistikbetriebs in Vollbrand, Dach teilweise eingestürzt. Außenangriff mit Wenderohr, Nachbarhalle wird gehalten.' },
    { name: 'Brand in Kfz-Werkstatt', lage: 'Brand in einer Kfz-Werkstatt, mehrere Fahrzeuge und Ölfässer betroffen. Schaumangriff läuft, Gasflaschen werden gekühlt.' },
    { name: 'Brand im Hochhaus', lage: 'Wohnungsbrand im achten Stock eines Hochhauses, Rauch zieht in den Flur. Angriff über die Steigleitung, betroffene Etagen werden kontrolliert.' },
    { name: 'Brand auf Recyclinghof', lage: 'Brand auf einem Schrottplatz, großer Haufen Altmetall und Reifen in Flammen, Rauchsäule weithin sichtbar. Langwieriger Löscheinsatz, Bagger angefordert.' },
  ],
  F3Y: [
    { name: 'Hotelbrand, Gäste eingeschlossen', lage: 'Brand im Erdgeschoss eines Hotels, Gäste in den oberen Etagen eingeschlossen. Menschenrettung über zwei Drehleitern, Innenangriff mit drei Trupps.' },
    { name: 'Brand in Produktionshalle, Mitarbeiter vermisst', lage: 'Brand in einer Produktionshalle, zwei Mitarbeiter laut Schichtleiter noch in der Halle. Suchtrupps unter Atemschutz im Einsatz.' },
    { name: 'Brand in Schule', lage: 'Brand im Fachtrakt einer Schule, Gebäude wird geräumt, Klassen sammeln sich auf dem Sportplatz. Mehrere Schüler mit Rauchvergiftung.' },
  ],
  F4: [
    { name: 'Großbrand Industriegebiet', lage: 'Mehrere Hallen eines Industriebetriebs stehen in Flammen, Gefahr des Übergreifens auf die Nachbarbetriebe. Einsatzabschnitte werden gebildet, Löschwasserversorgung über lange Wegstrecke.' },
    { name: 'Brand Einkaufszentrum', lage: 'Ausgedehnter Brand in einem Einkaufszentrum, Gebäude ist geräumt, starke Rauchausbreitung. Großangriff über alle Zugänge, Warnung der Bevölkerung läuft.' },
    { name: 'Brand in Reihenhauszeile', lage: 'Brand greift von Haus zu Haus auf eine Reihenhauszeile über, vier Gebäude betroffen. Riegelstellungen an beiden Enden, Bewohner evakuiert.' },
  ],
  FBMA: [
    { name: 'Brandmeldeanlage Seniorenheim', stabil: true, lage: 'Brandmeldeanlage im Seniorenheim ausgelöst, Melder im Küchenbereich. Verbranntes Essen, keine Ausbreitung, Anlage wird zurückgestellt.' },
    { name: 'Brandmeldeanlage Gewerbebetrieb', stabil: true, lage: 'Brandmeldeanlage in einem Gewerbebetrieb, Melder in der Lagerhalle. Kontrolle läuft, bisher kein Feuer und kein Rauch feststellbar.' },
    { name: 'Brandmeldeanlage Hotel', stabil: true, lage: 'Brandmeldeanlage im Hotel, ausgelöst durch Rauch in einem Zimmer. Gast hat im Zimmer geraucht, keine Gefahr, Zimmer wird gelüftet.' },
    { name: 'Brandmeldeanlage Krankenhaus', stabil: true, lage: 'Brandmeldeanlage im Krankenhaus, Melder im Technikbereich. Überhitzte Lüftungsanlage, Haustechnik hat abgeschaltet, keine Ausbreitung.' },
    { name: 'Brandmeldeanlage Schule', stabil: true, lage: 'Brandmeldeanlage in der Schule, Handmelder im Flur gedrückt. Fehlalarm, keine Feststellung, Anlage wird zurückgestellt.' },
  ],
  FRWM: [
    { name: 'Rauchwarnmelder piept', stabil: true, lage: 'Rauchwarnmelder in einer Wohnung im zweiten Stock, niemand öffnet. Tür wird geöffnet, in der Wohnung angebranntes Essen auf dem Herd.' },
    { name: 'Rauchmelder, Bewohner abwesend', stabil: true, lage: 'Rauchwarnmelder in einem Einfamilienhaus, Bewohner nicht zu Hause. Kontrolle von außen mit der Wärmebildkamera, keine Feststellung, Batterie wohl leer.' },
    { name: 'Rauchmelder in Dachwohnung', stabil: true, lage: 'Rauchwarnmelder in einer Dachwohnung, Mieterin öffnet selbst. Verqualmte Küche nach Kochen, Wohnung wird gelüftet.' },
  ],
  FBUSY: [
    { name: 'Reisebus brennt, Fahrgäste an Bord', lage: 'Reisebus auf der Bundesstraße im Heckbereich in Vollbrand, Fahrgäste zum Teil noch im Bus. Menschenrettung läuft, Löschangriff mit Schaum.' },
    { name: 'Linienbus brennt an Haltestelle', lage: 'Linienbus an einer Haltestelle, Brand im Motorraum greift auf den Innenraum über. Mehrere Fahrgäste verletzt, Sichtung läuft.' },
  ],
  FFLUG1Y: [
    { name: 'Kleinflugzeug abgestürzt', lage: 'Kleinflugzeug auf einem Feld abgestürzt und in Brand geraten, zwei Insassen. Brand wird mit Schaum bekämpft, Rettung der Insassen läuft.' },
    { name: 'Hubschrauber notgelandet', lage: 'Hubschrauber nach Notlandung auf einer Wiese, Flammen am Triebwerk. Pilot hat sich selbst gerettet, Löschangriff läuft.' },
  ],
  FFLUG2Y: [
    { name: 'Verkehrsflugzeug verunglückt', lage: 'Verkehrsflugzeug nach Absturz auf freiem Feld, Wrack brennt, zahlreiche Verletzte. Großlage, Einsatzabschnitte Brandbekämpfung und Verletztenversorgung werden gebildet.' },
  ],
  FGAS1: [
    { name: 'Gasflasche brennt am Imbiss', lage: 'Brennende Propangasflasche an einem Imbisswagen, Umgebung wird geräumt. Flasche wird gekühlt und kontrolliert abgebrannt.' },
    { name: 'Brand an Gasleitung', lage: 'Beschädigte Gasleitung an einer Baustelle brennt mit etwa zwei Metern Flamme. Versorger ist alarmiert, wir kühlen die Umgebung bis zum Absperren.' },
    { name: 'Gasgrill-Brand auf Terrasse', lage: 'Brand eines Gasgrills auf einer Terrasse, Flasche angeschlossen. Flasche wurde abgedreht, Restbrand abgelöscht.' },
  ],
  FGAS2: [
    { name: 'Gastankwagen brennt', lage: 'Gastankwagen nach Unfall mit Flammen am Tank, Absperrung im Umkreis von dreihundert Metern. Tank wird mit mehreren Rohren gekühlt.' },
    { name: 'Flüssiggastank an Gebäude brennt', lage: 'Brand an einem Flüssiggastank neben einem Wohnhaus, Sicherheitsventil bläst ab. Umgebung evakuiert, Kühlung läuft.' },
  ],
  FLKW: [
    { name: 'LKW brennt auf Autobahn', lage: 'Sattelzug auf dem Standstreifen, Zugmaschine in Vollbrand, Fahrer unverletzt. Löschangriff mit Schaum, Ladung bisher nicht betroffen.' },
    { name: 'Mähdrescher brennt', lage: 'Mähdrescher auf einem Feld in Vollbrand, Übergreifen auf das Getreidefeld droht. Zwei C-Rohre und Tanklöschfahrzeug im Einsatz.' },
    { name: 'Müllwagen brennt', lage: 'Brand in der Ladung eines Müllfahrzeugs, Ladung wird auf der Straße abgekippt. Ablöschen läuft, Straße gesperrt.' },
    { name: 'Leerer Bus brennt im Depot', lage: 'Brand eines abgestellten Busses auf dem Betriebshof, keine Personen. Löschangriff mit Schaum, Nachbarfahrzeuge werden weggefahren.' },
  ],
  FZUG: [
    { name: 'Güterwagen brennt', lage: 'Brand in einem Güterwagen auf einem Abstellgleis, keine Gefahrgutladung. Strecke ist gesperrt und geerdet, Löschangriff läuft.' },
    { name: 'Triebwagen brennt am Bahnhof', lage: 'Brand im Technikraum eines Triebwagens am Bahnsteig, Zug ist geräumt. Oberleitung abgeschaltet, Löschangriff unter Atemschutz.' },
  ],
  FZUGY: [
    { name: 'Zugbrand mit Fahrgästen', lage: 'Brand in einem besetzten Regionalzug auf freier Strecke, mehrere Wagen verraucht. Fahrgäste werden evakuiert, Rettungswege im Gleisbereich eingerichtet.' },
  ],
  FSCHIFF1: [
    { name: 'Sportboot brennt am Steg', lage: 'Brand eines Motorboots am Bootssteg, Besatzung an Land. Löschangriff vom Steg aus, Boot wird gesichert.' },
  ],
  FSCHIFF2: [
    { name: 'Frachtschiff brennt im Laderaum', lage: 'Brand im Laderaum eines Frachtschiffs am Anleger, Besatzung von Bord. Löschangriff über die Pier, Wasserversorgung vom Fluss.' },
  ],
  FSCHIFF2Y: [
    { name: 'Fahrgastschiff brennt', lage: 'Brand im Maschinenraum eines Ausflugsschiffs mit Fahrgästen an Bord, Schiff liegt am Anleger. Evakuierung über den Steg, mehrere Verletzte.' },
  ],
  FSCHIFF2G: [
    { name: 'Tankschiff mit Gefahrgut brennt', lage: 'Brand auf einem Tankschiff mit Gefahrgut, Austritt von Dämpfen. Großräumige Absperrung, Messungen laufen, Löschangriff nur mit Schaum.' },
  ],
  FWALD1: [
    { name: 'Flächenbrand am Feldrand', lage: 'Brennt eine Stoppelfläche von etwa halbem Hektar am Feldrand, leichter Wind. Brand wird mit D-Rohren und Löschrucksäcken eingegrenzt.' },
    { name: 'Waldbrand klein', lage: 'Bodenfeuer im Nadelwald auf rund zwanzig mal zwanzig Metern, kein Kronenfeuer. Zugang über einen Waldweg, Wasserversorgung über das Tanklöschfahrzeug.' },
    { name: 'Böschungsbrand an Bahnstrecke', lage: 'Böschung entlang der Bahnstrecke brennt auf hundert Metern Länge. Strecke ist gesperrt, Brand wird von beiden Seiten abgelöscht.' },
    { name: 'Windrad brennt', lage: 'Brand in der Gondel einer Windenergieanlage, Teile fallen herab. Löschen nicht möglich, Absperrung und kontrolliertes Abbrennen, Flächenbrand darunter wird bekämpft.' },
  ],
  FWALD2: [
    { name: 'Waldbrand breitet sich aus', lage: 'Waldbrand auf etwa drei Hektar, starker Wind treibt das Feuer den Hang hinauf. Riegelstellung am Forstweg, Pendelverkehr mit Tanklöschfahrzeugen eingerichtet.' },
    { name: 'Getreidefeld in Vollbrand', lage: 'Brennt ein Getreidefeld von etwa zehn Hektar, Feuer läuft auf eine Ortschaft zu. Schutz der Bebauung hat Vorrang, Landwirte ziehen Brandschneisen.' },
  ],

  // --- Hilfeleistung ---
  H1: [
    { name: 'Baum auf Fahrbahn', lage: 'Baum liegt quer über der Fahrbahn, Straße voll gesperrt, kein Fahrzeug beteiligt. Beseitigung mit der Motorsäge läuft, etwa zwanzig Minuten.' },
    { name: 'Wasser im Keller', lage: 'Keller eines Wohnhauses steht etwa dreißig Zentimeter unter Wasser, Ursache ist ein geplatztes Rohr. Wasserzufuhr ist abgestellt, wir pumpen ab.' },
    { name: 'Ölspur', stabil: true, lage: 'Ölspur auf etwa zweihundert Metern Länge in einer Kurve, Verursacher unbekannt. Spur wird abgestreut, Straßenmeisterei ist verständigt.' },
    { name: 'Katze auf Baum', stabil: true, lage: 'Katze sitzt seit gestern in etwa acht Metern Höhe in einem Baum. Rettung mit der Steckleiter läuft, Besitzerin ist vor Ort.' },
    { name: 'Wasserrohrbruch', lage: 'Wasserrohrbruch in der Straße, Wasser läuft in eine Tiefgarage. Versorger ist alarmiert, Einfahrt wird mit Sandsäcken gesichert.' },
    { name: 'Ast droht abzubrechen', lage: 'Großer Ast hängt nach dem Sturm abgebrochen über dem Gehweg. Gehweg abgesperrt, Ast wird von der Steckleiter aus abgesägt.' },
    { name: 'Verkehrsunfall, Fahrbahn reinigen', stabil: true, lage: 'Auffahrunfall ohne Verletzte, Trümmerteile und Kühlwasser auf der Fahrbahn. Fahrbahn wird gereinigt, Polizei nimmt auf.' },
  ],
  H1Y: [
    { name: 'Person im Aufzug', stabil: true, lage: 'Zwei Personen stecken seit einer halben Stunde zwischen zwei Stockwerken im Aufzug fest. Aufzug wird mit der Notentriegelung geöffnet, Personen wohlauf.' },
    { name: 'Türöffnung, hilflose Person', lage: 'Angehörige erreichen eine ältere Dame seit zwei Tagen nicht, Tür verschlossen. Tür wurde geöffnet, Person liegt gestürzt im Flur, Rettungsdienst übernimmt.' },
    { name: 'Tragehilfe für Rettungsdienst', stabil: true, lage: 'Rettungsdienst benötigt Tragehilfe für einen Patienten im vierten Stock ohne Aufzug. Patient wird mit dem Tragetuch nach unten gebracht.' },
    { name: 'Kind im Auto eingeschlossen', stabil: true, lage: 'Kleinkind in einem abgeschlossenen PKW in der Sonne, Schlüssel liegt im Fahrzeug. Scheibe wird eingeschlagen, Kind wohlauf, Rettungsdienst kontrolliert.' },
  ],
  H2: [
    { name: 'LKW umgestürzt', lage: 'LKW nach Ausweichmanöver auf die Seite gekippt, Fahrer hat sich selbst befreit. Betriebsstoffe laufen aus, Fahrbahn gesperrt, Bergung wird vorbereitet.' },
    { name: 'Gerüst eingestürzt', lage: 'Baugerüst auf etwa zwanzig Metern Länge auf die Straße gestürzt, niemand verletzt. Gerüst wird gesichert und abgebaut.' },
    { name: 'Traktor im Graben', lage: 'Traktor mit Anhänger im Straßengraben, droht umzukippen, Fahrer unverletzt. Fahrzeug wird mit der Seilwinde gesichert.' },
    { name: 'Bauunfall, Bagger abgerutscht', lage: 'Bagger an einer Baugrube abgerutscht, Fahrer konnte aussteigen. Baugrube wird gesichert, Kran zur Bergung angefordert.' },
  ],
  HABSTY: [
    { name: 'Person auf Brücke', lage: 'Person steht außen am Brückengeländer, Polizei spricht mit ihr. Sprungpolster wird aufgebaut, Drehleiter in Stellung, Straße gesperrt.' },
    { name: 'Person auf Baukran', lage: 'Person ist nachts auf einen Baukran geklettert und kommt nicht mehr herunter. Rettung über die Drehleiter und Höhenrettung vorbereitet.' },
    { name: 'Arbeiter auf Dach abgerutscht', lage: 'Dachdecker hängt im Sicherungsgurt an einer Dachkante. Rettung mit der Drehleiter läuft, Person ansprechbar.' },
  ],
  HELEK: [
    { name: 'Unfall in Trafostation', lage: 'Monteur in einer Trafostation durch Lichtbogen verletzt, Anlage ist freigeschaltet. Rettungsdienst versorgt, wir sichern die Station.' },
    { name: 'Stromleitung auf Fahrzeug', lage: 'Abgerissene Freileitung liegt auf einem PKW, Insassen bleiben im Fahrzeug. Absperrung, Netzbetreiber schaltet frei.' },
  ],
  HEINSTY: [
    { name: 'Wohnhaus teilweise eingestürzt', lage: 'Rückwärtiger Teil eines Wohnhauses nach Gasexplosion eingestürzt, zwei Personen werden vermisst. Suche mit Ortungstechnik läuft, Statiker angefordert.' },
    { name: 'Baugrube verschüttet', lage: 'Baugrube eingebrochen, ein Arbeiter bis zur Brust verschüttet, ansprechbar. Grube wird verbaut, vorsichtige Rettung läuft.' },
  ],
  HFLUSS: [
    { name: 'Treibgut an Brückenpfeiler', lage: 'Großer Baumstamm hat sich an einem Brückenpfeiler verkeilt, Wasser staut sich auf. Stamm wird von der Brücke aus gesichert und zerlegt.' },
    { name: 'Ölfilm auf dem Fluss', lage: 'Ölfilm auf etwa fünfzig Metern auf dem Fluss, Quelle unbekannt. Ölsperre wird ausgelegt, Wasserbehörde ist informiert.' },
  ],
  HFLUSSY: [
    { name: 'Person in Fluss gestürzt', lage: 'Person ist von der Uferböschung in den Fluss gestürzt und treibt ab. Suche entlang beider Ufer, Rettung mit Leinen vorbereitet.' },
  ],
  HWASSY: [
    { name: 'Person im Baggersee', lage: 'Schwimmer im Baggersee untergegangen, zuletzt etwa fünfzig Meter vom Ufer gesehen. Suche vom Ufer aus, Rettungsdienst in Bereitstellung.' },
  ],
  HGAS1: [
    { name: 'Gasgeruch im Treppenhaus', lage: 'Deutlicher Gasgeruch im Treppenhaus eines Mehrfamilienhauses. Messungen laufen, Haus wird vorsorglich geräumt, Versorger kommt.' },
    { name: 'Gasgeruch auf der Straße', lage: 'Gasgeruch an einer Baustelle auf der Straße, Bagger hat offenbar eine Leitung beschädigt. Absperrung eingerichtet, Messwerte leicht erhöht.' },
    { name: 'Gasgeruch in Wohnung', stabil: true, lage: 'Mieterin meldet Gasgeruch in der Küche, Herdanschluss undicht. Hauptabsperrung geschlossen, Wohnung gelüftet, Messung unauffällig.' },
  ],
  HGAS2: [
    { name: 'Gasleitung bei Bauarbeiten gerissen', lage: 'Mitteldruckleitung bei Tiefbauarbeiten abgerissen, Gas strömt hörbar aus. Umkreis von hundert Metern geräumt, Messungen laufen, Versorger sperrt ab.' },
    { name: 'Gasaustritt in Heizungskeller', lage: 'Gasaustritt im Heizungskeller eines Schulgebäudes, Explosionsgrenze teilweise erreicht. Gebäude geräumt, Belüftung unter Atemschutz.' },
  ],
  HGEFAHR1: [
    { name: 'Chemikalien in Schule ausgetreten', lage: 'Im Chemieraum einer Schule ist Salzsäure ausgelaufen, Gebäude teilweise geräumt. Trupp unter Chemikalienschutz nimmt den Stoff auf.' },
    { name: 'Fass auf LKW undicht', lage: 'Undichtes Fass mit Lösungsmittel auf einem LKW, Flüssigkeit tropft auf die Straße. Absperrung, Fass wird abgedichtet und umgefüllt.' },
    { name: 'Unbekannte Flüssigkeit in Bachlauf', lage: 'Unbekannte Flüssigkeit läuft aus einem Gewerbebetrieb in einen Bach, Fische verendet. Zulauf wird abgedichtet, Proben genommen.' },
  ],
  HGEFAHR2: [
    { name: 'Gefahrgut-LKW verunglückt', lage: 'Gefahrgut-LKW auf der Bundesstraße umgestürzt, Tank undicht, Ammoniakgeruch. Weiträumige Absperrung, Dekon-Platz wird aufgebaut.' },
    { name: 'Störfall in Chemiebetrieb', lage: 'Störfall in einem Chemiebetrieb, Gaswolke zieht über das Werksgelände. Warnung der Bevölkerung läuft, Messtrupps im Umfeld.' },
  ],
  HKLEMM1Y: [
    { name: 'Verkehrsunfall, Person eingeklemmt', lage: 'PKW gegen Baum, Fahrer eingeklemmt und ansprechbar. Patientenorientierte Rettung mit Schere und Spreizer läuft, Dach wird abgenommen.' },
    { name: 'Arbeiter in Maschine eingeklemmt', lage: 'Arbeiter mit dem Arm in einer Walzmaschine eingeklemmt, Maschine ist stromlos. Befreiung mit hydraulischem Gerät, Notarzt vor Ort.' },
    { name: 'Frontalzusammenstoß', lage: 'Frontalzusammenstoß zweier PKW, eine Person eingeklemmt, zweite leicht verletzt. Unfallstelle gesichert, Rettung läuft.' },
  ],
  HKLEMM2Y: [
    { name: 'Massenkarambolage', lage: 'Mehrere Fahrzeuge auf der Autobahn ineinander geschoben, drei Personen eingeklemmt. Einsatzabschnitte werden gebildet, Sichtung läuft.' },
    { name: 'Bus gegen LKW', lage: 'Zusammenstoß eines Kleinbusses mit einem LKW, mehrere Insassen eingeklemmt. Zwei Rettungsgeräte-Sätze im Einsatz, Verletztensammelstelle eingerichtet.' },
  ],
  HRADIO: [
    { name: 'Strahlenquelle bei Transport beschädigt', lage: 'Transportbehälter mit radioaktivem Messgerät nach Unfall beschädigt. Absperrung nach Messwerten, Fachberater angefordert.' },
  ],
  HSCHIFF: [
    { name: 'Schiff auf Grund gelaufen', stabil: true, lage: 'Frachtschiff im Fluss auf Grund gelaufen, keine Verletzten, kein Austritt. Schiff wird gesichert, Wasserschutzpolizei vor Ort.' },
  ],
  HSCHIFFY1: [
    { name: 'Boot gekentert, Personen im Wasser', lage: 'Ruderboot gekentert, zwei Personen klammern sich am Rumpf fest. Rettung vom Ufer mit Leinen läuft, Rettungsdienst bereit.' },
  ],
  HSCHIFFY2: [
    { name: 'Fahrgastschiff havariert', lage: 'Ausflugsschiff mit Schlagseite nach Kollision, etwa sechzig Fahrgäste an Bord. Evakuierung über die Uferseite, Verletztensammelstelle eingerichtet.' },
  ],
  HZUG1Y: [
    { name: 'Person unter Zug', lage: 'Person am Bahnübergang von einem Zug erfasst und unter dem Fahrzeug eingeklemmt. Strecke gesperrt und geerdet, Rettung mit Hebekissen.' },
    { name: 'PKW am Bahnübergang erfasst', lage: 'PKW am Bahnübergang von einem Regionalzug erfasst, Fahrer eingeklemmt. Zugverkehr eingestellt, Rettung läuft.' },
  ],
  HZUG2Y: [
    { name: 'Zugentgleisung mit Verletzten', lage: 'Regionalzug nach Entgleisung mit mehreren Wagen umgekippt, zahlreiche Verletzte. Rettungswege zum Gleis werden eingerichtet, Großlage.' },
  ],
  HUNWETTER1: [
    { name: 'Baum auf Straße nach Sturm', lage: 'Sturm hat einen Baum auf die Kreisstraße geworfen, Fahrbahn blockiert. Beseitigung mit der Motorsäge, weitere Bäume in der Umgebung werden kontrolliert.' },
    { name: 'Dachziegel drohen herabzufallen', lage: 'Sturm hat Dachziegel gelöst, Teile liegen auf dem Gehweg, weitere drohen zu fallen. Absperrung, lose Teile werden von der Drehleiter aus entfernt.' },
    { name: 'Umgestürzter Bauzaun', lage: 'Bauzaun auf fünfzig Metern auf die Straße geweht, Fahrbahn halbseitig blockiert. Zaun wird gesichert und beiseite geräumt.' },
    { name: 'Schnee auf Dach, Einsturzgefahr', lage: 'Schneelast auf dem Flachdach einer Halle, Dach hängt sichtbar durch. Halle geräumt, Dach wird abgeschaufelt.' },
    { name: 'Werbetafel droht abzustürzen', lage: 'Große Werbetafel an einer Hausfassade hat sich im Sturm gelöst. Gehweg und Straße gesperrt, Tafel wird mit der Drehleiter gesichert.' },
  ],
  HUNWETTER2: [
    { name: 'Straße überflutet', lage: 'Unterführung nach Starkregen einen Meter tief überflutet, ein PKW steckt fest, Fahrer ist draußen. Abpumpen läuft, Straße gesperrt.' },
    { name: 'Mehrere Keller unter Wasser', lage: 'Nach Starkregen stehen in der Straße mindestens sechs Keller unter Wasser. Wir arbeiten die Adressen der Reihe nach ab, zwei Tauchpumpen im Einsatz.' },
    { name: 'Bach tritt über die Ufer', lage: 'Bach tritt nach Starkregen über die Ufer, Wasser läuft in die ersten Grundstücke. Sandsäcke werden verbaut, Pegel steigt noch.' },
  ],

  // --- Rettungsdienst ---
  R0K: [
    { name: 'Krankentransport Verlegung', stabil: true, lage: 'Patient wird planmäßig in eine andere Klinik verlegt, stabil. Transport beginnt.' },
    { name: 'Rücktransport nach Dialyse', stabil: true, lage: 'Patientin nach Dialyse auf dem Rückweg nach Hause, Zustand unverändert. Übergabe an die Angehörigen.' },
    { name: 'Sturz ohne Verletzung, Hilfe beim Aufstehen', stabil: true, lage: 'Ältere Person zu Hause gestürzt, keine Verletzung feststellbar. Person wird zur Kontrolle in die Klinik gefahren.' },
  ],
  R0: [
    { name: 'Rückenschmerzen', lage: 'Patient mit starken Rückenschmerzen, kann nicht mehr aufstehen, Kreislauf stabil. Transport in die Klinik.' },
    { name: 'Erbrechen und Schwindel', lage: 'Patientin mit anhaltendem Erbrechen und Schwindel, ansprechbar und stabil. Transport zur weiteren Abklärung.' },
    { name: 'Verletzung beim Sport', lage: 'Sportler mit verdrehtem Knie auf dem Fußballplatz, keine weiteren Verletzungen. Ruhigstellung und Transport.' },
    { name: 'Fieber bei Kleinkind', lage: 'Kleinkind mit hohem Fieber, Eltern sehr besorgt, Kind wach und ansprechbar. Transport mit der Mutter in die Kinderklinik.' },
  ],
  R1: [
    { name: 'Sturz von Leiter', lage: 'Mann von einer drei Meter hohen Leiter gestürzt, Verdacht auf Unterarmbruch, ansprechbar. Versorgung läuft, Transport mit Sondersignal.' },
    { name: 'Atemnot', lage: 'Patientin mit akuter Atemnot, bekannte Lungenerkrankung, Sauerstoffsättigung niedrig. Sauerstoffgabe, Transport zügig.' },
    { name: 'Verkehrsunfall, Leichtverletzte', lage: 'Auffahrunfall mit zwei Leichtverletzten, beide gehfähig, Nackenschmerzen. Versorgung läuft, ein Transport.' },
    { name: 'Schnittverletzung', lage: 'Tiefe Schnittverletzung an der Hand beim Arbeiten mit der Kreissäge, Blutung gestillt. Transport in die Unfallchirurgie.' },
    { name: 'Krampfanfall', lage: 'Patient nach Krampfanfall, jetzt wieder ansprechbar, bekannte Epilepsie. Überwachung und Transport.' },
    { name: 'Fahrradsturz', lage: 'Radfahrer gestürzt, Schürfwunden und Verdacht auf Schlüsselbeinbruch, Helm getragen. Transport in die Klinik.' },
  ],
  R2: [
    { name: 'Verdacht auf Herzinfarkt', lage: 'Patient mit Brustschmerz und Ausstrahlung in den linken Arm, EKG auffällig. Notarzt versorgt, Transport mit Voranmeldung.' },
    { name: 'Bewusstlose Person', lage: 'Person bewusstlos in der Wohnung aufgefunden, Atmung vorhanden, Ursache unklar. Notarzt vor Ort, Transport zügig.' },
    { name: 'Schlaganfall-Verdacht', lage: 'Patientin mit halbseitiger Lähmung und Sprachstörung seit etwa zwanzig Minuten. Zeitkritischer Transport in die Stroke Unit.' },
    { name: 'Schwerer Motorradunfall', lage: 'Motorradfahrer nach Sturz mit Verdacht auf Beckenverletzung, instabiler Kreislauf. Notarzt stabilisiert, Transport in die Klinik.' },
    { name: 'Allergischer Schock', lage: 'Patient nach Wespenstich mit Schwellung im Gesicht und Atemnot, Kreislauf instabil. Medikamente gegeben, Zustand bessert sich, Transport.' },
  ],
  R3: [
    { name: 'Notarzt zum laufenden Einsatz', lage: 'Notarzt am Einsatzort eingetroffen, übernimmt die Versorgung vom Rettungswagen.' },
  ],
  RLEBEL: [
    { name: 'Verletzte nach Messerangriff', lage: 'Person mit Stichverletzung, Täter laut Polizei noch in der Nähe. Versorgung erst nach Freigabe durch die Polizei, Bereitstellungsraum eingerichtet.' },
    { name: 'Schussverletzung', lage: 'Person mit Schussverletzung vor einer Gaststätte, Lage durch Polizei gesichert. Versorgung läuft, Transport mit Notarzt.' },
  ],
  RMANV: [
    { name: 'Busunfall mit vielen Verletzten', lage: 'Reisebus von der Straße abgekommen und umgekippt, etwa dreißig Verletzte, mehrere schwer. Verletztensammelstelle eingerichtet, Sichtung läuft.' },
    { name: 'Tribüne eingestürzt', lage: 'Zuschauertribüne bei einem Sportfest teilweise eingestürzt, viele Verletzte. Sichtung läuft, weitere Rettungsmittel gefordert.' },
    { name: 'Reizgas in Schule', lage: 'Reizgas in einer Schule versprüht, über zwanzig Schüler mit Augen- und Atemreizungen. Sichtung auf dem Schulhof, Gebäude wird gelüftet.' },
  ],
}

export const pickSzenario = (typeId) => {
  const list = SZENARIEN[typeId]
  return list ? list[Math.floor(Math.random() * list.length)] : null
}

// Kurzes Stichwort-Kürzel aus dem Namen ("H1 – Einfache technische Hilfe" -> "H1")
export const typeCode = (type) => type.name.split(' – ')[0]
export const incidentTitle = (inc) => inc.szenario ? `${typeCode(inc.type)} – ${inc.szenario.name}` : inc.type.name

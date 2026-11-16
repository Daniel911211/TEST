// Konkrete Einsatzszenarien je Stichwort (eigene Texte). Die Lagemeldung wird daraus in lagemeldung.js nach dem Schema
// „Was sehe ich – Was mache ich – Was brauche ich“ zusammengesetzt.
// name: kurzer Einsatzname für die Liste ("H1 – Baum auf Fahrbahn")
// sehe: Schadensbild, Personen, Gefahren (Teil „Was sehe ich“)
// mache: eigene Maßnahmen (Teil „Was mache ich“), ohne fremde Kräfte
// kraefte: { ROLLE: Satz } – Maßnahmen-Satz, der nur erscheint, wenn die Rolle am Einsatz ist (vor Ort oder auf Anfahrt)
// anforderung: { ROLLE: [Wahrscheinlichkeit, Begründung] } – Anforderungswahrscheinlichkeit je Rolle (wie im Vorbild je Einsatzart):
//   wird beim Erzeugen des Einsatzes gewürfelt und von der Einsatzleitung nach dem Eintreffen als Nachforderung abgesetzt
// verletzte: [min, max] – Zahl der Verletzten für Teil „Was sehe ich“ (Zahlen statt „mehrere“)
// stabil: harmlose Lage ohne Nachforderung oder Hochstufung (Fehlalarm, Nachschau, Tragehilfe)
// Beim Hochstufen des Stichworts wird ein Szenario des neuen Stichworts gezogen.

export const SZENARIEN = {
  // --- Brand ---
  F1: [
    { name: 'Mülltonnenbrand', sehe: 'Brennt eine Restmülltonne an der Hauswand, Fassade leicht verrußt.', mache: 'Ablöschen mit einem C-Rohr, keine Ausbreitung.' },
    { name: 'PKW-Brand', sehe: 'PKW im Motorraum in Vollbrand, keine Personen im Fahrzeug.', mache: 'Löschangriff mit Schaum läuft, Straße halbseitig gesperrt.' },
    { name: 'Gartenlaube brennt', sehe: 'Brennt eine Gartenlaube in einer Kleingartenanlage, kein Wohngebäude betroffen.', mache: 'Ein C-Rohr im Einsatz, Nachbarn gewarnt.' },
    { name: 'Rauch aus Papiercontainer', sehe: 'Papiercontainer vor einem Bürogebäude, starke Rauchentwicklung, keine Flammen mehr sichtbar.', mache: 'Container wird ausgeräumt und abgelöscht.' },
    { name: 'Nachschau nach Brand', stabil: true, sehe: 'Keine Flammen mehr feststellbar, Brandgut wurde vom Besitzer abgelöscht.', mache: 'Wir kontrollieren mit der Wärmebildkamera und rücken dann ein.' },
    { name: 'Heckenbrand', sehe: 'Brennt eine Thujahecke auf etwa zehn Meter Länge, Übergreifen auf den Carport droht.', mache: 'Zwei C-Rohre vorgenommen.' },
  ],
  F2: [
    { name: 'Küchenbrand', sehe: 'Brand in der Küche im zweiten Obergeschoss, Bewohner haben das Haus verlassen.', mache: 'Innenangriff unter Atemschutz, Treppenraum wird entraucht.' },
    { name: 'Dachstuhlbrand', sehe: 'Dachstuhl eines Einfamilienhauses in Vollbrand, Bewohner sind draußen.', mache: 'Nachbargebäude wird geschützt, Innenangriff über den Treppenraum.', kraefte: { HR: 'Außenangriff über die Drehleiter.' }, anforderung: { HR: [0.6, 'Außenangriff auf den Dachstuhl'] } },
    { name: 'Kellerbrand', sehe: 'Brand im Keller eines Mehrfamilienhauses, Treppenraum stark verraucht.', mache: 'Alle Bewohner im Freien, zwei Trupps unter Atemschutz im Innenangriff.' },
    { name: 'Kaminbrand', sehe: 'Rußbrand im Schornstein, Funkenflug aus der Esse.', mache: 'Schornsteinfeger ist angefordert, wir kontrollieren alle Geschosse mit der Wärmebildkamera.' },
    { name: 'Zimmerbrand', sehe: 'Zimmerbrand im Erdgeschoss, Flammen aus einem Fenster.', mache: 'Wohnung ist geräumt, Innenangriff mit einem C-Rohr läuft.' },
    { name: 'Rauchentwicklung aus Wohnung', sehe: 'Deutliche Rauchentwicklung aus einer Wohnung im dritten Stock, Bewohner nicht erreichbar.', mache: 'Tür wird geöffnet, Trupp unter Atemschutz geht vor.' },
  ],
  F2Y: [
    { name: 'Wohnungsbrand, Person vermisst', sehe: 'Wohnungsbrand im ersten Obergeschoss, eine Person wird noch in der Wohnung vermutet.', mache: 'Zwei Trupps unter Atemschutz zur Menschenrettung eingesetzt.' },
    { name: 'Dachgeschossbrand, Personen am Fenster', sehe: 'Brand im Dachgeschoss, zwei Personen stehen am Fenster und winken.', mache: 'Innenangriff läuft, Personen werden mit Steckleitern erreicht.', kraefte: { HR: 'Menschenrettung über die Drehleiter läuft.', RTW: 'Rettungsdienst übernimmt die geretteten Personen.' }, anforderung: { HR: [0.8, 'Menschenrettung aus dem Dachgeschoss'] } },
    { name: 'Brand in Pflegeheim', sehe: 'Brand in einem Bewohnerzimmer eines Pflegeheims, Station wird evakuiert.', mache: 'Mehrere bettlägerige Bewohner werden getragen, Innenangriff läuft.', kraefte: { RTW: 'Rettungsdienst sichtet die Bewohner.' }, anforderung: { RTW: [0.7, 'mehrere bettlägerige Bewohner mit Rauchkontakt'], NEF: [0.2, 'ein Bewohner mit starker Atemnot'] } },
    { name: 'Kellerbrand, Treppenraum verraucht', sehe: 'Kellerbrand, Treppenraum bis unters Dach verraucht, Bewohner in den Wohnungen eingeschlossen.', mache: 'Fenster werden mit Steckleitern angeleitert.' },
  ],
  F3: [
    { name: 'Brand in Schreinerei', sehe: 'Brand in der Werkhalle einer Schreinerei, Holzlager betroffen, starke Rauchentwicklung.', mache: 'Löschangriff von zwei Seiten, Wasserversorgung über Hydranten aufgebaut.', kraefte: { HR: 'Drehleiter zur Brandbekämpfung von oben in Stellung.' }, anforderung: { HR: [0.5, 'Brandbekämpfung über das Hallendach'] } },
    { name: 'Lagerhallenbrand', sehe: 'Lagerhalle eines Logistikbetriebs in Vollbrand, Dach teilweise eingestürzt.', mache: 'Außenangriff mit mehreren Rohren, Nachbarhalle wird gehalten.', kraefte: { HR: 'Wenderohr über die Drehleiter im Einsatz.', TLF: 'Tanklöschfahrzeug speist die Wasserversorgung.' }, anforderung: { HR: [0.6, 'Außenangriff von oben'], TLF: [0.4, 'Wasserversorgung reicht nicht'] } },
    { name: 'Brand in Kfz-Werkstatt', sehe: 'Brand in einer Kfz-Werkstatt, mehrere Fahrzeuge und Ölfässer betroffen.', mache: 'Schaumangriff läuft, Gasflaschen werden gekühlt.' },
    { name: 'Brand im Hochhaus', sehe: 'Wohnungsbrand im achten Stock eines Hochhauses, Rauch zieht in den Flur.', mache: 'Angriff über die Steigleitung, betroffene Etagen werden kontrolliert.' },
    { name: 'Brand auf Recyclinghof', sehe: 'Brand auf einem Schrottplatz, großer Haufen Altmetall und Reifen in Flammen, Rauchsäule weithin sichtbar.', mache: 'Langwieriger Löscheinsatz, Bagger angefordert.' },
  ],
  F3Y: [
    { name: 'Hotelbrand, Gäste eingeschlossen', sehe: 'Brand im Erdgeschoss eines Hotels, Gäste in den oberen Etagen eingeschlossen.', mache: 'Innenangriff mit drei Trupps, Menschenrettung über den Treppenraum.', kraefte: { HR: 'Menschenrettung über die Drehleiter.', RTW: 'Rettungsdienst versorgt gerettete Gäste.' }, anforderung: { HR: [0.7, 'eingeschlossene Gäste in den oberen Etagen'], RTW: [0.5, 'mehrere Gäste mit Rauchgasvergiftung'] }, verletzte: [2, 6] },
    { name: 'Brand in Produktionshalle, Mitarbeiter vermisst', sehe: 'Brand in einer Produktionshalle, zwei Mitarbeiter laut Schichtleiter noch in der Halle.', mache: 'Suchtrupps unter Atemschutz im Einsatz.' },
    { name: 'Brand in Schule', sehe: 'Brand im Fachtrakt einer Schule, Gebäude wird geräumt, Klassen sammeln sich auf dem Sportplatz.', mache: 'Innenangriff läuft, Schüler mit Rauchvergiftung werden gesammelt.', kraefte: { RTW: 'Rettungsdienst versorgt die Schüler.' }, anforderung: { RTW: [0.8, 'mehrere Schüler mit Rauchvergiftung'], NEF: [0.3, 'ein Schüler bewusstlos'] }, verletzte: [3, 8] },
  ],
  F4: [
    { name: 'Großbrand Industriegebiet', sehe: 'Mehrere Hallen eines Industriebetriebs stehen in Flammen, Gefahr des Übergreifens auf die Nachbarbetriebe.', mache: 'Einsatzabschnitte werden gebildet, Löschwasserversorgung über lange Wegstrecke.' },
    { name: 'Brand Einkaufszentrum', sehe: 'Ausgedehnter Brand in einem Einkaufszentrum, Gebäude ist geräumt, starke Rauchausbreitung.', mache: 'Großangriff über alle Zugänge, Warnung der Bevölkerung läuft.' },
    { name: 'Brand in Reihenhauszeile', sehe: 'Brand greift von Haus zu Haus auf eine Reihenhauszeile über, vier Gebäude betroffen.', mache: 'Riegelstellungen an beiden Enden, Bewohner evakuiert.' },
  ],
  FBMA: [
    { name: 'Brandmeldeanlage Seniorenheim', stabil: true, sehe: 'Brandmeldeanlage im Seniorenheim ausgelöst, Melder im Küchenbereich.', mache: 'Verbranntes Essen, keine Ausbreitung, Anlage wird zurückgestellt.' },
    { name: 'Brandmeldeanlage Gewerbebetrieb', stabil: true, sehe: 'Brandmeldeanlage in einem Gewerbebetrieb, Melder in der Lagerhalle.', mache: 'Kontrolle läuft, bisher kein Feuer und kein Rauch feststellbar.' },
    { name: 'Brandmeldeanlage Hotel', stabil: true, sehe: 'Brandmeldeanlage im Hotel, ausgelöst durch Rauch in einem Zimmer.', mache: 'Gast hat im Zimmer geraucht, keine Gefahr, Zimmer wird gelüftet.' },
    { name: 'Brandmeldeanlage Krankenhaus', stabil: true, sehe: 'Brandmeldeanlage im Krankenhaus, Melder im Technikbereich.', mache: 'Überhitzte Lüftungsanlage, Haustechnik hat abgeschaltet, keine Ausbreitung.' },
    { name: 'Brandmeldeanlage Schule', stabil: true, sehe: 'Brandmeldeanlage in der Schule, Handmelder im Flur gedrückt.', mache: 'Fehlalarm, keine Feststellung, Anlage wird zurückgestellt.' },
  ],
  FRWM: [
    { name: 'Rauchwarnmelder piept', stabil: true, sehe: 'Rauchwarnmelder in einer Wohnung im zweiten Stock, niemand öffnet.', mache: 'Tür wird geöffnet, in der Wohnung angebranntes Essen auf dem Herd.' },
    { name: 'Rauchmelder, Bewohner abwesend', stabil: true, sehe: 'Rauchwarnmelder in einem Einfamilienhaus, Bewohner nicht zu Hause.', mache: 'Kontrolle von außen mit der Wärmebildkamera, keine Feststellung, Batterie wohl leer.' },
    { name: 'Rauchmelder in Dachwohnung', stabil: true, sehe: 'Rauchwarnmelder in einer Dachwohnung, Mieterin öffnet selbst.', mache: 'Verqualmte Küche nach Kochen, Wohnung wird gelüftet.' },
  ],
  FBUSY: [
    { name: 'Reisebus brennt, Fahrgäste an Bord', sehe: 'Reisebus auf der Bundesstraße im Heckbereich in Vollbrand, Fahrgäste zum Teil noch im Bus.', mache: 'Menschenrettung läuft, Löschangriff mit Schaum.', verletzte: [5, 15] },
    { name: 'Linienbus brennt an Haltestelle', sehe: 'Linienbus an einer Haltestelle, Brand im Motorraum greift auf den Innenraum über.', mache: 'Löschangriff mit Schaum, Fahrgäste werden gesichtet.', kraefte: { RTW: 'Rettungsdienst übernimmt die Verletzten.' }, anforderung: { RTW: [0.6, 'mehrere verletzte Fahrgäste'], NEF: [0.4, 'ein Fahrgast mit schweren Verbrennungen'] }, verletzte: [3, 10] },
  ],
  FFLUG1Y: [
    { name: 'Kleinflugzeug abgestürzt', sehe: 'Kleinflugzeug auf einem Feld abgestürzt und in Brand geraten, zwei Insassen.', mache: 'Brand wird mit Schaum bekämpft, Rettung der Insassen läuft.' },
    { name: 'Hubschrauber notgelandet', sehe: 'Hubschrauber nach Notlandung auf einer Wiese, Flammen am Triebwerk.', mache: 'Pilot hat sich selbst gerettet, Löschangriff läuft.' },
  ],
  FFLUG2Y: [
    { name: 'Verkehrsflugzeug verunglückt', sehe: 'Verkehrsflugzeug nach Absturz auf freiem Feld, Wrack brennt.', mache: 'Großlage, Einsatzabschnitte Brandbekämpfung und Verletztenversorgung werden gebildet.', verletzte: [30, 80] },
  ],
  FGAS1: [
    { name: 'Gasflasche brennt am Imbiss', sehe: 'Brennende Propangasflasche an einem Imbisswagen, Umgebung wird geräumt.', mache: 'Flasche wird gekühlt und kontrolliert abgebrannt.' },
    { name: 'Brand an Gasleitung', sehe: 'Beschädigte Gasleitung an einer Baustelle brennt mit etwa zwei Metern Flamme.', mache: 'Versorger ist alarmiert, wir kühlen die Umgebung bis zum Absperren.' },
    { name: 'Gasgrill-Brand auf Terrasse', sehe: 'Brand eines Gasgrills auf einer Terrasse, Flasche angeschlossen.', mache: 'Flasche wurde abgedreht, Restbrand abgelöscht.' },
  ],
  FGAS2: [
    { name: 'Gastankwagen brennt', sehe: 'Gastankwagen nach Unfall mit Flammen am Tank, Absperrung im Umkreis von dreihundert Metern.', mache: 'Tank wird mit mehreren Rohren gekühlt.' },
    { name: 'Flüssiggastank an Gebäude brennt', sehe: 'Brand an einem Flüssiggastank neben einem Wohnhaus, Sicherheitsventil bläst ab.', mache: 'Umgebung evakuiert, Kühlung läuft.' },
  ],
  FLKW: [
    { name: 'LKW brennt auf Autobahn', sehe: 'Sattelzug auf dem Standstreifen, Zugmaschine in Vollbrand, Fahrer unverletzt.', mache: 'Löschangriff mit Schaum, Ladung bisher nicht betroffen.' },
    { name: 'Mähdrescher brennt', sehe: 'Mähdrescher auf einem Feld in Vollbrand, Übergreifen auf das Getreidefeld droht.', mache: 'Zwei C-Rohre und Tanklöschfahrzeug im Einsatz.' },
    { name: 'Müllwagen brennt', sehe: 'Brand in der Ladung eines Müllfahrzeugs, Ladung wird auf der Straße abgekippt.', mache: 'Ablöschen läuft, Straße gesperrt.' },
    { name: 'Leerer Bus brennt im Depot', sehe: 'Brand eines abgestellten Busses auf dem Betriebshof, keine Personen.', mache: 'Löschangriff mit Schaum, Nachbarfahrzeuge werden weggefahren.' },
  ],
  FZUG: [
    { name: 'Güterwagen brennt', sehe: 'Brand in einem Güterwagen auf einem Abstellgleis, keine Gefahrgutladung.', mache: 'Strecke ist gesperrt und geerdet, Löschangriff läuft.' },
    { name: 'Triebwagen brennt am Bahnhof', sehe: 'Brand im Technikraum eines Triebwagens am Bahnsteig, Zug ist geräumt.', mache: 'Oberleitung abgeschaltet, Löschangriff unter Atemschutz.' },
  ],
  FZUGY: [
    { name: 'Zugbrand mit Fahrgästen', sehe: 'Brand in einem besetzten Regionalzug auf freier Strecke, mehrere Wagen verraucht.', mache: 'Fahrgäste werden evakuiert, Rettungswege im Gleisbereich eingerichtet.' },
  ],
  FSCHIFF1: [
    { name: 'Sportboot brennt am Steg', sehe: 'Brand eines Motorboots am Bootssteg, Besatzung an Land.', mache: 'Löschangriff vom Steg aus, Boot wird gesichert.' },
  ],
  FSCHIFF2: [
    { name: 'Frachtschiff brennt im Laderaum', sehe: 'Brand im Laderaum eines Frachtschiffs am Anleger, Besatzung von Bord.', mache: 'Löschangriff über die Pier, Wasserversorgung vom Fluss.' },
  ],
  FSCHIFF2Y: [
    { name: 'Fahrgastschiff brennt', sehe: 'Brand im Maschinenraum eines Ausflugsschiffs mit Fahrgästen an Bord, Schiff liegt am Anleger.', mache: 'Evakuierung über den Steg, Löschangriff über die Pier.', verletzte: [2, 8] },
  ],
  FSCHIFF2G: [
    { name: 'Tankschiff mit Gefahrgut brennt', sehe: 'Brand auf einem Tankschiff mit Gefahrgut, Austritt von Dämpfen.', mache: 'Großräumige Absperrung, Messungen laufen, Löschangriff nur mit Schaum.' },
  ],
  FWALD1: [
    { name: 'Flächenbrand am Feldrand', sehe: 'Brennt eine Stoppelfläche von etwa halbem Hektar am Feldrand, leichter Wind.', mache: 'Brand wird mit D-Rohren und Löschrucksäcken eingegrenzt.' },
    { name: 'Waldbrand klein', sehe: 'Bodenfeuer im Nadelwald auf rund zwanzig mal zwanzig Metern, kein Kronenfeuer.', mache: 'Zugang über einen Waldweg, Wasserversorgung über das Tanklöschfahrzeug.' },
    { name: 'Böschungsbrand an Bahnstrecke', sehe: 'Böschung entlang der Bahnstrecke brennt auf hundert Metern Länge.', mache: 'Strecke ist gesperrt, Brand wird von beiden Seiten abgelöscht.' },
    { name: 'Windrad brennt', sehe: 'Brand in der Gondel einer Windenergieanlage, Teile fallen herab.', mache: 'Löschen nicht möglich, Absperrung und kontrolliertes Abbrennen, Flächenbrand darunter wird bekämpft.' },
  ],
  FWALD2: [
    { name: 'Waldbrand breitet sich aus', sehe: 'Waldbrand auf etwa drei Hektar, starker Wind treibt das Feuer den Hang hinauf.', mache: 'Riegelstellung am Forstweg, Pendelverkehr mit Tanklöschfahrzeugen eingerichtet.' },
    { name: 'Getreidefeld in Vollbrand', sehe: 'Brennt ein Getreidefeld von etwa zehn Hektar, Feuer läuft auf eine Ortschaft zu.', mache: 'Schutz der Bebauung hat Vorrang, Landwirte ziehen Brandschneisen.' },
  ],

  // --- Hilfeleistung ---
  H1: [
    { name: 'Baum auf Fahrbahn', sehe: 'Baum liegt quer über der Fahrbahn, Straße voll gesperrt, kein Fahrzeug beteiligt.', mache: 'Beseitigung mit der Motorsäge läuft, etwa zwanzig Minuten.' },
    { name: 'Wasser im Keller', sehe: 'Keller eines Wohnhauses steht etwa dreißig Zentimeter unter Wasser, Ursache ist ein geplatztes Rohr.', mache: 'Wasserzufuhr ist abgestellt, wir pumpen ab.' },
    { name: 'Ölspur', stabil: true, sehe: 'Ölspur auf etwa zweihundert Metern Länge in einer Kurve, Verursacher unbekannt.', mache: 'Spur wird abgestreut, Straßenmeisterei ist verständigt.' },
    { name: 'Katze auf Baum', stabil: true, sehe: 'Katze sitzt seit gestern in etwa acht Metern Höhe in einem Baum.', mache: 'Rettung mit der Steckleiter läuft, Besitzerin ist vor Ort.' },
    { name: 'Wasserrohrbruch', sehe: 'Wasserrohrbruch in der Straße, Wasser läuft in eine Tiefgarage.', mache: 'Versorger ist alarmiert, Einfahrt wird mit Sandsäcken gesichert.' },
    { name: 'Ast droht abzubrechen', sehe: 'Großer Ast hängt nach dem Sturm abgebrochen über dem Gehweg.', mache: 'Gehweg abgesperrt, Ast wird von der Steckleiter aus abgesägt.' },
    { name: 'Verkehrsunfall, Fahrbahn reinigen', stabil: true, sehe: 'Auffahrunfall ohne Verletzte, Trümmerteile und Kühlwasser auf der Fahrbahn.', mache: 'Fahrbahn wird gereinigt, Polizei nimmt auf.' },
  ],
  H1Y: [
    { name: 'Person im Aufzug', stabil: true, sehe: 'Zwei Personen stecken seit einer halben Stunde zwischen zwei Stockwerken im Aufzug fest.', mache: 'Aufzug wird mit der Notentriegelung geöffnet, Personen wohlauf.' },
    { name: 'Türöffnung, hilflose Person', sehe: 'Angehörige erreichen eine ältere Dame seit zwei Tagen nicht, Tür verschlossen.', mache: 'Tür wurde geöffnet, Person liegt gestürzt im Flur, wird betreut.', kraefte: { RTW: 'Rettungsdienst übernimmt.' }, anforderung: { RTW: [0.8, 'gestürzte Person, seit Tagen hilflos'] } },
    { name: 'Tragehilfe für Rettungsdienst', stabil: true, sehe: 'Rettungsdienst benötigt Tragehilfe für einen Patienten im vierten Stock ohne Aufzug.', mache: 'Patient wird mit dem Tragetuch nach unten gebracht.' },
    { name: 'Kind im Auto eingeschlossen', stabil: true, sehe: 'Kleinkind in einem abgeschlossenen PKW in der Sonne, Schlüssel liegt im Fahrzeug.', mache: 'Scheibe wird eingeschlagen, Kind wohlauf.', kraefte: { RTW: 'Rettungsdienst kontrolliert das Kind.' }, anforderung: { RTW: [0.3, 'Kind zur Kontrolle nach Hitzeeinwirkung'] } },
  ],
  H2: [
    { name: 'LKW umgestürzt', sehe: 'LKW nach Ausweichmanöver auf die Seite gekippt, Fahrer hat sich selbst befreit.', mache: 'Betriebsstoffe laufen aus, Fahrbahn gesperrt, Bergung wird vorbereitet.' },
    { name: 'Gerüst eingestürzt', sehe: 'Baugerüst auf etwa zwanzig Metern Länge auf die Straße gestürzt, niemand verletzt.', mache: 'Gerüst wird gesichert und abgebaut.' },
    { name: 'Traktor im Graben', sehe: 'Traktor mit Anhänger im Straßengraben, droht umzukippen, Fahrer unverletzt.', mache: 'Fahrzeug wird mit der Seilwinde gesichert.' },
    { name: 'Bauunfall, Bagger abgerutscht', sehe: 'Bagger an einer Baugrube abgerutscht, Fahrer konnte aussteigen.', mache: 'Baugrube wird gesichert, Kran zur Bergung angefordert.' },
  ],
  HABSTY: [
    { name: 'Person auf Brücke', sehe: 'Person steht außen am Brückengeländer, Polizei spricht mit ihr.', mache: 'Sprungpolster wird aufgebaut, Straße gesperrt.', kraefte: { HR: 'Drehleiter in Stellung.', RTW: 'Rettungsdienst in Bereitstellung.' }, anforderung: { HR: [0.5, 'Rettung aus der Höhe'], RTW: [0.5, 'Person nach Rettung betreuen'] } },
    { name: 'Person auf Baukran', sehe: 'Person ist nachts auf einen Baukran geklettert und kommt nicht mehr herunter.', mache: 'Höhenrettung vorbereitet, Person wird angesprochen.', kraefte: { HR: 'Rettung über die Drehleiter vorbereitet.' }, anforderung: { HR: [0.7, 'Rettung aus etwa zwanzig Metern Höhe'] } },
    { name: 'Arbeiter auf Dach abgerutscht', sehe: 'Dachdecker hängt im Sicherungsgurt an einer Dachkante, Person ansprechbar.', mache: 'Person wird gesichert und beruhigt.', kraefte: { HR: 'Rettung mit der Drehleiter läuft.', RTW: 'Rettungsdienst übernimmt nach der Rettung.' }, anforderung: { HR: [0.7, 'Rettung aus dem Sicherungsgurt'], RTW: [0.4, 'Verdacht auf Hängetrauma'] } },
  ],
  HELEK: [
    { name: 'Unfall in Trafostation', sehe: 'Monteur in einer Trafostation durch Lichtbogen verletzt, Anlage ist freigeschaltet.', mache: 'Wir sichern die Station und leisten Erste Hilfe.', kraefte: { RTW: 'Rettungsdienst versorgt den Verletzten.', NEF: 'Notarzt übernimmt die Versorgung.' }, anforderung: { RTW: [0.9, 'eine durch Lichtbogen verletzte Person'], NEF: [0.4, 'großflächige Verbrennungen'] } },
    { name: 'Stromleitung auf Fahrzeug', sehe: 'Abgerissene Freileitung liegt auf einem PKW, Insassen bleiben im Fahrzeug.', mache: 'Absperrung, Netzbetreiber schaltet frei.' },
  ],
  HEINSTY: [
    { name: 'Wohnhaus teilweise eingestürzt', sehe: 'Rückwärtiger Teil eines Wohnhauses nach Gasexplosion eingestürzt, zwei Personen werden vermisst.', mache: 'Suche mit Ortungstechnik läuft, Statiker angefordert.' },
    { name: 'Baugrube verschüttet', sehe: 'Baugrube eingebrochen, ein Arbeiter bis zur Brust verschüttet, ansprechbar.', mache: 'Grube wird verbaut, vorsichtige Rettung läuft.' },
  ],
  HFLUSS: [
    { name: 'Treibgut an Brückenpfeiler', sehe: 'Großer Baumstamm hat sich an einem Brückenpfeiler verkeilt, Wasser staut sich auf.', mache: 'Stamm wird von der Brücke aus gesichert und zerlegt.' },
    { name: 'Ölfilm auf dem Fluss', sehe: 'Ölfilm auf etwa fünfzig Metern auf dem Fluss, Quelle unbekannt.', mache: 'Ölsperre wird ausgelegt, Wasserbehörde ist informiert.' },
  ],
  HFLUSSY: [
    { name: 'Person in Fluss gestürzt', sehe: 'Person ist von der Uferböschung in den Fluss gestürzt und treibt ab.', mache: 'Suche entlang beider Ufer, Rettung mit Leinen vorbereitet.' },
  ],
  HWASSY: [
    { name: 'Person im Baggersee', sehe: 'Schwimmer im Baggersee untergegangen, zuletzt etwa fünfzig Meter vom Ufer gesehen.', mache: 'Suche vom Ufer aus, Boot wird zu Wasser gelassen.', kraefte: { RTW: 'Rettungsdienst in Bereitstellung.', NEF: 'Notarzt in Bereitstellung.' }, anforderung: { RTW: [0.6, 'Person nach Ertrinkungsunfall'], NEF: [0.4, 'Reanimationsbereitschaft'] } },
  ],
  HGAS1: [
    { name: 'Gasgeruch im Treppenhaus', sehe: 'Deutlicher Gasgeruch im Treppenhaus eines Mehrfamilienhauses.', mache: 'Messungen laufen, Haus wird vorsorglich geräumt, Versorger kommt.' },
    { name: 'Gasgeruch auf der Straße', sehe: 'Gasgeruch an einer Baustelle auf der Straße, Bagger hat offenbar eine Leitung beschädigt.', mache: 'Absperrung eingerichtet, Messwerte leicht erhöht.' },
    { name: 'Gasgeruch in Wohnung', stabil: true, sehe: 'Mieterin meldet Gasgeruch in der Küche, Herdanschluss undicht.', mache: 'Hauptabsperrung geschlossen, Wohnung gelüftet, Messung unauffällig.' },
  ],
  HGAS2: [
    { name: 'Gasleitung bei Bauarbeiten gerissen', sehe: 'Mitteldruckleitung bei Tiefbauarbeiten abgerissen, Gas strömt hörbar aus.', mache: 'Umkreis von hundert Metern geräumt, Messungen laufen, Versorger sperrt ab.' },
    { name: 'Gasaustritt in Heizungskeller', sehe: 'Gasaustritt im Heizungskeller eines Schulgebäudes, Explosionsgrenze teilweise erreicht.', mache: 'Gebäude geräumt, Belüftung unter Atemschutz.' },
  ],
  HGEFAHR1: [
    { name: 'Chemikalien in Schule ausgetreten', sehe: 'Im Chemieraum einer Schule ist Salzsäure ausgelaufen, Gebäude teilweise geräumt.', mache: 'Trupp unter Chemikalienschutz nimmt den Stoff auf.' },
    { name: 'Fass auf LKW undicht', sehe: 'Undichtes Fass mit Lösungsmittel auf einem LKW, Flüssigkeit tropft auf die Straße.', mache: 'Absperrung, Fass wird abgedichtet und umgefüllt.' },
    { name: 'Unbekannte Flüssigkeit in Bachlauf', sehe: 'Unbekannte Flüssigkeit läuft aus einem Gewerbebetrieb in einen Bach, Fische verendet.', mache: 'Zulauf wird abgedichtet, Proben genommen.' },
  ],
  HGEFAHR2: [
    { name: 'Gefahrgut-LKW verunglückt', sehe: 'Gefahrgut-LKW auf der Bundesstraße umgestürzt, Tank undicht, Ammoniakgeruch.', mache: 'Weiträumige Absperrung, Dekon-Platz wird aufgebaut.' },
    { name: 'Störfall in Chemiebetrieb', sehe: 'Störfall in einem Chemiebetrieb, Gaswolke zieht über das Werksgelände.', mache: 'Warnung der Bevölkerung läuft, Messtrupps im Umfeld.' },
  ],
  HKLEMM1Y: [
    { name: 'Verkehrsunfall, Person eingeklemmt', sehe: 'PKW gegen Baum, Fahrer eingeklemmt und ansprechbar.', mache: 'Patientenorientierte Rettung mit Schere und Spreizer läuft, Dach wird abgenommen.' },
    { name: 'Arbeiter in Maschine eingeklemmt', sehe: 'Arbeiter mit dem Arm in einer Walzmaschine eingeklemmt, Maschine ist stromlos.', mache: 'Befreiung mit hydraulischem Gerät läuft.', kraefte: { NEF: 'Notarzt versorgt den Patienten während der Befreiung.' }, anforderung: { NEF: [0.5, 'Schmerztherapie während der Befreiung'] } },
    { name: 'Frontalzusammenstoß', sehe: 'Frontalzusammenstoß zweier PKW, eine Person eingeklemmt, zweite leicht verletzt.', mache: 'Unfallstelle gesichert, Rettung läuft.' },
  ],
  HKLEMM2Y: [
    { name: 'Massenkarambolage', sehe: 'Mehrere Fahrzeuge auf der Autobahn ineinander geschoben, drei Personen eingeklemmt.', mache: 'Einsatzabschnitte werden gebildet, Sichtung läuft.', verletzte: [5, 12] },
    { name: 'Bus gegen LKW', sehe: 'Zusammenstoß eines Kleinbusses mit einem LKW, mehrere Insassen eingeklemmt.', mache: 'Zwei Rettungsgeräte-Sätze im Einsatz, Verletztensammelstelle eingerichtet.', verletzte: [4, 9] },
  ],
  HRADIO: [
    { name: 'Strahlenquelle bei Transport beschädigt', sehe: 'Transportbehälter mit radioaktivem Messgerät nach Unfall beschädigt.', mache: 'Absperrung nach Messwerten, Fachberater angefordert.' },
  ],
  HSCHIFF: [
    { name: 'Schiff auf Grund gelaufen', stabil: true, sehe: 'Frachtschiff im Fluss auf Grund gelaufen, keine Verletzten, kein Austritt.', mache: 'Schiff wird gesichert, Wasserschutzpolizei vor Ort.' },
  ],
  HSCHIFFY1: [
    { name: 'Boot gekentert, Personen im Wasser', sehe: 'Ruderboot gekentert, zwei Personen klammern sich am Rumpf fest.', mache: 'Rettung vom Ufer mit Leinen läuft.', kraefte: { RTW: 'Rettungsdienst bereit zur Übernahme.' }, anforderung: { RTW: [0.5, 'zwei unterkühlte Personen'] } },
  ],
  HSCHIFFY2: [
    { name: 'Fahrgastschiff havariert', sehe: 'Ausflugsschiff mit Schlagseite nach Kollision, etwa sechzig Fahrgäste an Bord.', mache: 'Evakuierung über die Uferseite, Verletztensammelstelle eingerichtet.', verletzte: [4, 12] },
  ],
  HZUG1Y: [
    { name: 'Person unter Zug', sehe: 'Person am Bahnübergang von einem Zug erfasst und unter dem Fahrzeug eingeklemmt.', mache: 'Strecke gesperrt und geerdet, Rettung mit Hebekissen.' },
    { name: 'PKW am Bahnübergang erfasst', sehe: 'PKW am Bahnübergang von einem Regionalzug erfasst, Fahrer eingeklemmt.', mache: 'Zugverkehr eingestellt, Rettung läuft.' },
  ],
  HZUG2Y: [
    { name: 'Zugentgleisung mit Verletzten', sehe: 'Regionalzug nach Entgleisung mit mehreren Wagen umgekippt.', mache: 'Rettungswege zum Gleis werden eingerichtet, Großlage.', verletzte: [15, 40] },
  ],
  HUNWETTER1: [
    { name: 'Baum auf Straße nach Sturm', sehe: 'Sturm hat einen Baum auf die Kreisstraße geworfen, Fahrbahn blockiert.', mache: 'Beseitigung mit der Motorsäge, weitere Bäume in der Umgebung werden kontrolliert.' },
    { name: 'Dachziegel drohen herabzufallen', sehe: 'Sturm hat Dachziegel gelöst, Teile liegen auf dem Gehweg, weitere drohen zu fallen.', mache: 'Absperrung eingerichtet.', kraefte: { HR: 'Lose Teile werden von der Drehleiter aus entfernt.' }, anforderung: { HR: [0.6, 'lose Teile in zwölf Metern Höhe'] } },
    { name: 'Umgestürzter Bauzaun', sehe: 'Bauzaun auf fünfzig Metern auf die Straße geweht, Fahrbahn halbseitig blockiert.', mache: 'Zaun wird gesichert und beiseite geräumt.' },
    { name: 'Schnee auf Dach, Einsturzgefahr', sehe: 'Schneelast auf dem Flachdach einer Halle, Dach hängt sichtbar durch.', mache: 'Halle geräumt, Dach wird abgeschaufelt.', kraefte: { HR: 'Drehleiter als Zugang und Sicherung in Stellung.' }, anforderung: { HR: [0.3, 'sicherer Zugang auf das Dach'] } },
    { name: 'Werbetafel droht abzustürzen', sehe: 'Große Werbetafel an einer Hausfassade hat sich im Sturm gelöst.', mache: 'Gehweg und Straße gesperrt.', kraefte: { HR: 'Tafel wird mit der Drehleiter gesichert.' }, anforderung: { HR: [0.6, 'Sicherung in der Höhe'] } },
  ],
  HUNWETTER2: [
    { name: 'Straße überflutet', sehe: 'Unterführung nach Starkregen einen Meter tief überflutet, ein PKW steckt fest, Fahrer ist draußen.', mache: 'Abpumpen läuft, Straße gesperrt.' },
    { name: 'Mehrere Keller unter Wasser', sehe: 'Nach Starkregen stehen in der Straße mindestens sechs Keller unter Wasser.', mache: 'Wir arbeiten die Adressen der Reihe nach ab, zwei Tauchpumpen im Einsatz.' },
    { name: 'Bach tritt über die Ufer', sehe: 'Bach tritt nach Starkregen über die Ufer, Wasser läuft in die ersten Grundstücke.', mache: 'Sandsäcke werden verbaut, Pegel steigt noch.' },
  ],

  // --- Rettungsdienst ---
  R0K: [
    { name: 'Krankentransport Verlegung', stabil: true, sehe: 'Patient wird planmäßig in eine andere Klinik verlegt, stabil.', mache: 'Transport beginnt.' },
    { name: 'Rücktransport nach Dialyse', stabil: true, sehe: 'Patientin nach Dialyse auf dem Rückweg nach Hause, Zustand unverändert.', mache: 'Übergabe an die Angehörigen.' },
    { name: 'Sturz ohne Verletzung, Hilfe beim Aufstehen', stabil: true, sehe: 'Ältere Person zu Hause gestürzt, keine Verletzung feststellbar.', mache: 'Person wird zur Kontrolle in die Klinik gefahren.' },
  ],
  R0: [
    { name: 'Rückenschmerzen', sehe: 'Patient mit starken Rückenschmerzen, kann nicht mehr aufstehen, Kreislauf stabil.', mache: 'Transport in die Klinik.', anforderung: { S: [0.2, 'Tragehilfe aus dem dritten Stock ohne Aufzug'] } },
    { name: 'Erbrechen und Schwindel', sehe: 'Patientin mit anhaltendem Erbrechen und Schwindel, ansprechbar und stabil.', mache: 'Transport zur weiteren Abklärung.' },
    { name: 'Verletzung beim Sport', sehe: 'Sportler mit verdrehtem Knie auf dem Fußballplatz, keine weiteren Verletzungen.', mache: 'Ruhigstellung und Transport.' },
    { name: 'Fieber bei Kleinkind', sehe: 'Kleinkind mit hohem Fieber, Eltern sehr besorgt, Kind wach und ansprechbar.', mache: 'Transport mit der Mutter in die Kinderklinik.', anforderung: { NEF: [0.1, 'Fieberkrampf'] } },
  ],
  R1: [
    { name: 'Sturz von Leiter', sehe: 'Mann von einer drei Meter hohen Leiter gestürzt, Verdacht auf Unterarmbruch, ansprechbar.', mache: 'Versorgung läuft, Transport mit Sondersignal.', anforderung: { NEF: [0.3, 'Verdacht auf Kopfverletzung'] } },
    { name: 'Atemnot', sehe: 'Patientin mit akuter Atemnot, bekannte Lungenerkrankung, Sauerstoffsättigung niedrig.', mache: 'Sauerstoffgabe, Transport zügig.', anforderung: { NEF: [0.5, 'Sättigung fällt weiter'], S: [0.15, 'Tragehilfe, Patientin nicht gehfähig'] } },
    { name: 'Verkehrsunfall, Leichtverletzte', sehe: 'Auffahrunfall mit zwei Leichtverletzten, beide gehfähig, Nackenschmerzen.', mache: 'Versorgung läuft, ein Transport.' },
    { name: 'Schnittverletzung', sehe: 'Tiefe Schnittverletzung an der Hand beim Arbeiten mit der Kreissäge, Blutung gestillt.', mache: 'Transport in die Unfallchirurgie.' },
    { name: 'Krampfanfall', sehe: 'Patient nach Krampfanfall, jetzt wieder ansprechbar, bekannte Epilepsie.', mache: 'Überwachung und Transport.', anforderung: { NEF: [0.25, 'erneuter Krampfanfall'] } },
    { name: 'Fahrradsturz', sehe: 'Radfahrer gestürzt, Schürfwunden und Verdacht auf Schlüsselbeinbruch, Helm getragen.', mache: 'Transport in die Klinik.' },
  ],
  R2: [
    { name: 'Verdacht auf Herzinfarkt', sehe: 'Patient mit Brustschmerz und Ausstrahlung in den linken Arm, EKG auffällig.', mache: 'Versorgung läuft, Transport mit Voranmeldung.', kraefte: { NEF: 'Notarzt versorgt.' } },
    { name: 'Bewusstlose Person', sehe: 'Person bewusstlos in der Wohnung aufgefunden, Atmung vorhanden, Ursache unklar.', mache: 'Stabile Seitenlage, Überwachung, Transport zügig.', kraefte: { NEF: 'Notarzt vor Ort.' } },
    { name: 'Schlaganfall-Verdacht', sehe: 'Patientin mit halbseitiger Lähmung und Sprachstörung seit etwa zwanzig Minuten.', mache: 'Zeitkritischer Transport in die Stroke Unit.' },
    { name: 'Schwerer Motorradunfall', sehe: 'Motorradfahrer nach Sturz mit Verdacht auf Beckenverletzung, instabiler Kreislauf.', mache: 'Versorgung läuft, Transport in die Klinik.', kraefte: { NEF: 'Notarzt stabilisiert.' } },
    { name: 'Allergischer Schock', sehe: 'Patient nach Wespenstich mit Schwellung im Gesicht und Atemnot, Kreislauf instabil.', mache: 'Medikamente gegeben, Zustand bessert sich, Transport.' },
  ],
  R3: [
    { name: 'Notarzt zum laufenden Einsatz', sehe: 'Notarzt am Einsatzort eingetroffen, übernimmt die Versorgung vom Rettungswagen.' },
  ],
  RLEBEL: [
    { name: 'Verletzte nach Messerangriff', sehe: 'Person mit Stichverletzung, Täter laut Polizei noch in der Nähe.', mache: 'Versorgung erst nach Freigabe durch die Polizei, Bereitstellungsraum eingerichtet.' },
    { name: 'Schussverletzung', sehe: 'Person mit Schussverletzung vor einer Gaststätte, Lage durch Polizei gesichert.', mache: 'Versorgung läuft, Transport mit Notarzt.' },
  ],
  RMANV: [
    { name: 'Busunfall mit vielen Verletzten', sehe: 'Reisebus von der Straße abgekommen und umgekippt, mehrere Schwerverletzte.', mache: 'Verletztensammelstelle eingerichtet, Sichtung läuft.', verletzte: [20, 35] },
    { name: 'Tribüne eingestürzt', sehe: 'Zuschauertribüne bei einem Sportfest teilweise eingestürzt.', mache: 'Sichtung läuft, Verletztensammelstelle wird aufgebaut.', verletzte: [10, 25] },
    { name: 'Reizgas in Schule', sehe: 'Reizgas in einer Schule versprüht, Schüler mit Augen- und Atemreizungen.', mache: 'Sichtung auf dem Schulhof, Gebäude wird gelüftet.', verletzte: [15, 30] },
  ],
}

export const pickSzenario = (typeId) => {
  const list = SZENARIEN[typeId]
  return list ? list[Math.floor(Math.random() * list.length)] : null
}

// Kurzes Stichwort-Kürzel aus dem Namen ("H1 – Einfache technische Hilfe" -> "H1")
export const typeCode = (type) => type.name.split(' – ')[0]
export const incidentTitle = (inc) => inc.szenario ? `${typeCode(inc.type)} – ${inc.szenario.name}` : inc.type.name

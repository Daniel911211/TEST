// Texte für den Funkverkehr nach einem Sprechwunsch – hier pflegen, die Spiellogik (game.js: answerOptions, quittung,
// Nachfrage) wählt nur aus.
//   ANTWORTEN   Vorschläge der Leitstelle (je Situation ein Text, erscheint als Knopf im Sprechwunsch-Fenster)
//   QUITTUNGEN  Reaktionen des Fahrzeugs auf die Antwort (je Situation mehrere Varianten, eine wird zufällig gewählt)
//   NACHFRAGEN  Sprechwunsch der Einsatzleitung, wenn zugesagte Kräfte nach 5 Spielminuten noch fehlen
// Im Funk gibt es kein „Bitte“ und kein „Danke“ (Funkdisziplin): Texte entsprechend knapp halten.
// Platzhalter: {kraefte} = Fahrzeuge bzw. Rollen (z. B. „1× RTW, 1× NEF“), {eta} = Eintreffzeit, {art} = Art der Meldung, {dauer} = Mehrdauer.

export const ANTWORTEN = {
  anfahrt: 'Ja, {kraefte} auf Anfahrt, Eintreffen in ca. {eta}.',
  zusage: 'Verstanden, {kraefte} wird alarmiert.',
  keine: 'Keine weiteren Kräfte auf Anfahrt.',
  // Es fehlen laut Stichwort noch Kräfte, die Leitstelle hat aber keine: Einsatz wird mit den Kräften vor Ort abgearbeitet (dauert länger)
  keineVerfuegbar: 'Keine weiteren Einsatzfahrzeuge verfügbar. Arbeiten Sie mit den Kräften vor Ort.',
  abschluss: 'Verstanden, Einsatz beendet. Rücken Sie ein.',
  aufgenommen: '{art} aufgenommen, verstanden.',
}

export const QUITTUNGEN = {
  // Leitstelle hat Kräfte zugesagt, die noch fehlen
  zusage: [
    'Verstanden, erwarten {kraefte}.',
    'Verstanden, {kraefte} kommt nach. Wir halten die Lage bis dahin.',
    'Verstanden, erwarten {kraefte} an der Einsatzstelle. Einweiser steht an der Zufahrt.',
  ],
  // Kräfte sind auf Anfahrt
  anfahrt: [
    'Verstanden, erwarten die Kräfte.',
    'Verstanden, Einweiser steht an der Zufahrt.',
    'Verstanden, wir bereiten die Aufstellfläche vor.',
  ],
  // Keine weiteren Kräfte, Lage ist damit abgedeckt
  keineOk: [
    'Verstanden, Kräfte ausreichend.',
    'Verstanden, kommen mit den Kräften vor Ort zurecht.',
    'Verstanden, keine weiteren Kräfte erforderlich.',
  ],
  // Keine weiteren Kräfte verfügbar, obwohl laut Stichwort noch etwas fehlt: Einsatzleitung arbeitet mit dem, was da ist
  reduziert: [
    'Verstanden, arbeiten mit den Kräften vor Ort. Einsatzdauer verlängert sich um etwa {dauer}.',
    'Verstanden, ohne {kraefte} wird es länger dauern, etwa {dauer} mehr. Wir bleiben dran.',
    'Verstanden, Maßnahmen werden mit den vorhandenen Kräften nacheinander abgearbeitet, rechnen mit etwa {dauer} länger.',
  ],
  // Abschlussmeldung quittiert
  abschluss: [
    'Verstanden, rücken ein.',
    'Verstanden, Einsatzstelle wird übergeben, rücken ein.',
    'Verstanden, Fahrzeuge werden aufgerüstet, dann Rückfahrt.',
  ],
  // Alles andere
  standard: [
    'Verstanden.',
    'Verstanden, Ende.',
    'Verstanden, kommen.',
  ],
}

export const NACHFRAGEN = [
  'Nachfrage: Zugesagte Kräfte ({kraefte}) sind noch nicht alarmiert. Wo bleiben sie?',
  'Nachfrage an Leitstelle: {kraefte} wurde zugesagt, bisher nichts auf Anfahrt. Erbitte Rückmeldung.',
  'Nachfrage: Wann ist mit {kraefte} zu rechnen? Lage lässt sich ohne nicht halten.',
]

// Rückfrage an die Besatzung (Rettungsdienst), wenn die Leitstelle eine andere Klinik als die Wunschklinik vorschlägt.
// Die Besatzung antwortet im Sinne des Patienten (der Patient selbst funkt nicht). Platzhalter: {klinik} = Gegenvorschlag, {wunsch} = Wunschklinik, {km} = Mehrweg.
export const PATIENT = {
  zusage: [
    'Patient ist einverstanden, Transport nach {klinik} ist in Ordnung für ihn.',
    'Patient stimmt zu, {klinik} passt für ihn.',
    'Patient akzeptiert den Vorschlag, Hauptsache er wird dort versorgt.',
  ],
  zusageVoll: [
    'Patient versteht, dass {wunsch} voll ist, und ist mit {klinik} einverstanden.',
    'Patient nimmt es hin, {wunsch} hat keine Kapazität, er fährt nach {klinik} mit.',
  ],
  ablehnung: [
    'Patient lehnt ab, er besteht auf {wunsch}. Dort sind seine Familie und sein Hausarzt.',
    'Patient will nicht nach {klinik}, der Weg ist ihm zu weit. Er möchte nach {wunsch}.',
    'Patient ist nicht einverstanden und verlangt {wunsch}, dort ist er schon in Behandlung.',
  ],
}

export const pick = (list) => list[Math.floor(Math.random() * list.length)]
export const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

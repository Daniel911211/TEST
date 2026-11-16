// Texte für den Funkverkehr nach einem Sprechwunsch – hier pflegen, die Spiellogik (game.js: answerOptions, quittung,
// Nachfrage) wählt nur aus.
//   ANTWORTEN   Vorschläge der Leitstelle (je Situation ein Text, erscheint als Knopf im Sprechwunsch-Fenster)
//   QUITTUNGEN  Reaktionen des Fahrzeugs auf die Antwort (je Situation mehrere Varianten, eine wird zufällig gewählt)
//   NACHFRAGEN  Sprechwunsch der Einsatzleitung, wenn zugesagte Kräfte nach 5 Spielminuten noch fehlen
// Im Funk gibt es kein „Bitte“ und kein „Danke“ (Funkdisziplin): Texte entsprechend knapp halten.
// Platzhalter: {kraefte} = Fahrzeuge bzw. Rollen (z. B. „1× RTW, 1× NEF“), {eta} = Eintreffzeit, {art} = Art der Meldung.

export const ANTWORTEN = {
  anfahrt: 'Ja, {kraefte} auf Anfahrt, Eintreffen in ca. {eta}.',
  zusage: 'Verstanden, {kraefte} wird alarmiert.',
  keine: 'Keine weiteren Kräfte auf Anfahrt.',
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
  // Keine weiteren Kräfte, obwohl laut Stichwort noch etwas fehlt
  keineFehlt: [
    'Verstanden. Hinweis: Laut Stichwort fehlt noch {kraefte}.',
    'Verstanden. Weise darauf hin, dass {kraefte} laut Ausrückeordnung noch aussteht.',
    'Verstanden. Hinweis: {kraefte} ist für dieses Stichwort noch nicht alarmiert.',
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

export const pick = (list) => list[Math.floor(Math.random() * list.length)]
export const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

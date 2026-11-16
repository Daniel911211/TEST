// Einsatzstichworte nach dem Gemeinsamen Runderlass des HMdIS/HMSI (Stand 2022, gültig ab 1.1.2023).
// Die "taktischen Einheiten" des Erlasses werden hier auf Rollen abgebildet, die mit Fahrzeugtypen erfüllt werden.
// Vereinfachungen: GABC-Messtrupp = ABC-Erkunder; GABC-Messgruppe = ABC-Erkunder + GW-Messtechnik; GABC-Zug = Messgruppe + Dekon-P;
// GDekon-Zug = Dekon-P. Boote/Taucher/Hebegeräte fehlen noch und werden durch Gruppen/RW angenähert.
// ELW 2: ab F4 (und vergleichbaren Großlagen) von Anfang an nötig; bei F3/F3Y u. ä. fragt die Leitstelle den ELW 1 per Funk (elw2Ask).
// Wasser und Atemschutztrupps werden nur angezeigt.

// Rolle -> akzeptierte Fahrzeugtypen (Reihenfolge = Präferenz bei der automatischen Zuordnung)
export const ROLES = {
  GT: { name: 'Gruppe mit techn. Komponenten', short: 'Gruppe (Technik)', types: ['HLF'] },
  G: { name: 'Löschgruppe', short: 'Gruppe', types: ['HLF', 'LF'] },
  S: { name: 'Staffel', short: 'Staffel', types: ['TSF', 'TLF', 'LF', 'HLF'] },
  TLF: { name: 'Tanklöschfahrzeug', short: 'TLF', types: ['TLF'] },
  HR: { name: 'Hubrettungsfahrzeug', short: 'Hubrettung', types: ['DLK'] },
  ELW1: { name: 'Einsatzleitwagen', short: 'ELW', types: ['ELW1'] },
  RW: { name: 'Rüstwagen', short: 'RW', types: ['RW'] },
  GWL: { name: 'GW-L / Schlauch', short: 'GW-L', types: ['GWL'] },
  GWA: { name: 'GW-A (Atemschutz)', short: 'GW-A', types: ['GWA'] },
  ELW2: { name: 'Einsatzleitwagen 2', short: 'ELW 2', types: ['ELW2'] },
  ABC: { name: 'ABC-Erkunder (GABC-Messtrupp)', short: 'ABC-Erkunder', types: ['ABCE'] },
  GWM: { name: 'GW-Messtechnik', short: 'GW-Mess', types: ['GWM'] },
  DEKON: { name: 'Dekon-P (GDekon)', short: 'Dekon-P', types: ['DEKON'] },
  RTW: { name: 'Rettungswagen', short: 'RTW', types: ['RTW'] },
  NEF: { name: 'Notarzt (NEF)', short: 'NEF', types: ['NEF'] },
  KTW: { name: 'Krankentransport (N-KTW)', short: 'KTW', types: ['KTW'] },
  KT: { name: 'Rettungswagen oder KTW', short: 'RTW/KTW', types: ['RTW', 'KTW'] },
}

// Rettungsdienst-Stichworte
const RD = {
  RKTP: { need: { KTW: 1 } },
  R0K: { need: { KT: 1 } },
  R0: { need: { RTW: 1 } },
  R1: { need: { RTW: 1 } },
  R2: { need: { RTW: 1, NEF: 1 } },
  R3: { need: { NEF: 1 } },
  RLEBEL: { need: { RTW: 1, NEF: 1 } },
  MANV: { need: { RTW: 4, NEF: 2 } },
}

function mk(id, name, bild, o) {
  const cat = id[0] === 'R' && !id.startsWith('RW') ? 'R' : id[0] // F, H oder R
  const need = { ...o.need }
  if (o.rd) for (const [k, n] of Object.entries(RD[o.rd].need)) need[k] = (need[k] || 0) + n
  const size = Object.values(need).reduce((a, b) => a + b, 0)
  const reward = Math.round(((250 + 200 * size) * 1.25) / 10) * 10
  const severity = ['R2', 'R3', 'RLEBEL', 'MANV'].includes(o.rd) ? 3 : cat === 'R' ? 1 : 2
  return {
    id, name, bild, need, extra: o.extra || {}, rd: o.rd || null, weight: o.weight,
    work: o.work, elw2Ask: !!o.elw2Ask, ohneSS: !!o.ohneSS, water: o.water || 0, as: o.as || 0,
    deadline: cat === 'R' ? 600 : cat === 'H' ? 1200 : 900,
    reward, penalty: 0, points: 3 + 2 * size, // vorerst keine Strafe, Einsätze scheitern nicht
    patient: !!o.rd && o.rd !== 'R3', severity,
  }
}

const EXTRA_BRAND = { HR: 1, TLF: 1, GWL: 1 }

export const INCIDENT_TYPES = [
  // --- Brand ---
  mk('F1', 'F1 – Kleinbrand', 'PKW, Mülltonne, Gerümpel im Freien, Nachschau', { need: { S: 1 }, extra: { TLF: 1 }, weight: 6, work: 300, water: 500, as: 1 }),
  mk('F2', 'F2 – Wohnungs-/Zimmerbrand', 'Wohnungs-, Dachstuhl-, Keller-, Zimmer-, Kaminbrand, Rauchentwicklung', { need: { G: 2, ELW1: 1 }, rd: 'R1', extra: EXTRA_BRAND, weight: 4, work: 720, water: 1000, as: 3 }),
  mk('F2Y', 'F2Y – Wohnungsbrand, Menschenleben in Gefahr', 'Brand in Wohngebäude mit Menschenleben in Gefahr', { need: { G: 2, S: 1, ELW1: 1 }, rd: 'R2', extra: EXTRA_BRAND, weight: 1.2, work: 840, water: 1000, as: 4 }),
  mk('F3', 'F3 – Ausgedehnter Brand Sondergebäude', 'Hochhaus, Gewerbebetrieb, Schreinerei, Kfz-Werkstatt, Lagerplatz', { need: { G: 3, ELW1: 1 }, elw2Ask: true, rd: 'R1', extra: { HR: 1, TLF: 1, GWL: 1, RW: 1, ABC: 1, GWM: 1 }, weight: 0.6, work: 1200, water: 3600, as: 5 }),
  mk('F3Y', 'F3Y – Sondergebäude, Menschenleben in Gefahr', 'Ausgedehnter Brand mit Menschenleben in Gefahr', { need: { G: 3, S: 1, ELW1: 1, GWA: 1 }, elw2Ask: true, rd: 'R2', extra: { HR: 1, TLF: 1, GWL: 1, ABC: 1, GWM: 1 }, weight: 0.3, work: 1320, water: 3600, as: 6 }),
  mk('F4', 'F4 – Brand als Großschadenslage', 'Brand als Großschadenslage', { need: { G: 6, HR: 2, GWA: 1, ELW1: 1, ELW2: 1, TLF: 1, ABC: 1, GWM: 1 }, rd: 'R1', extra: { GWL: 1, TLF: 1 }, weight: 0.1, work: 1800, water: 8000, as: 10 }),
  mk('FBMA', 'F BMA – Brandmeldeanlage', 'Meldung einer Brandmeldeanlage', { need: { S: 2, ELW1: 1 }, extra: { HR: 1 }, weight: 5, work: 360, water: 1000, as: 3 }),
  mk('FRWM', 'F RWM – Rauchwarnmelder', 'Ausgelöster (Heim-)Rauchwarnmelder', { need: { S: 1 }, extra: { HR: 1, TLF: 1 }, weight: 3, work: 240, water: 500, as: 2 }),
  mk('FBUSY', 'F BUS Y – Busbrand, Menschenleben in Gefahr', 'Brand eines besetzten Busses', { need: { G: 3, TLF: 1, ELW1: 1 }, elw2Ask: true, rd: 'MANV', weight: 0.15, work: 1200, water: 5000, as: 6 }),
  mk('FFLUG1Y', 'F FLUG 1 Y – Flugunfall (klein)', 'Brand nach Flugunfall: Kleinflugzeug, Hubschrauber, Ballon', { need: { G: 1, GT: 1, ELW1: 1, RW: 1 }, rd: 'R2', extra: { TLF: 1 }, weight: 0.1, work: 900, water: 2500, as: 4 }),
  mk('FFLUG2Y', 'F FLUG 2 Y – Flugunfall (groß)', 'Brand nach Flugunfall mit Großflugzeug', { need: { G: 6, RW: 2, HR: 1, GWL: 1, ELW1: 1, ELW2: 1, TLF: 1, ABC: 1, GWM: 1, DEKON: 1 }, extra: { DEKON: 1 }, rd: 'MANV', weight: 0.05, work: 1800, water: 15000, as: 10 }),
  mk('FGAS1', 'F GAS 1 – Gasflaschen-/Gasleitungsbrand', 'Brand einzelner Gasflaschen oder einer Gasleitung', { need: { G: 2, ELW1: 1, RW: 1 }, extra: { TLF: 1, GWL: 1 }, weight: 0.5, work: 600, water: 1000, as: 3 }),
  mk('FGAS2', 'F GAS 2 – Gastank-/Gaskesselwagenbrand', 'Brand eines Gastanks, Gastankfahrzeugs, Gaskesselwagens', { need: { G: 3, ELW1: 1, RW: 1 }, elw2Ask: true, rd: 'R1', extra: { TLF: 1, GWL: 1, ABC: 1, GWM: 1 }, weight: 0.15, work: 1200, water: 5000, as: 5 }),
  mk('FLKW', 'F LKW – LKW-/Busbrand', 'Brand eines LKW, Busses ohne Personen, Mähdreschers', { need: { G: 2, ELW1: 1, RW: 1 }, extra: { GWA: 1, TLF: 1 }, weight: 1, work: 720, water: 5000, as: 3 }),
  mk('FZUG', 'F Zug – Schienenfahrzeugbrand', 'Brand eines Schienenfahrzeugs ohne Menschenleben in Gefahr', { need: { G: 2, ELW1: 1, RW: 1 }, extra: { GWA: 1, TLF: 1 }, weight: 0.1, work: 900, water: 5000, as: 3 }),
  mk('FZUGY', 'F ZUG Y – Zugbrand, viele Menschenleben in Gefahr', 'Brand eines Zuges mit großer Anzahl Menschenleben in Gefahr', { need: { G: 6, HR: 1, RW: 1, ELW1: 1, ELW2: 1, GWA: 1, ABC: 1, GWM: 1 }, rd: 'MANV', weight: 0.05, work: 1800, water: 8000, as: 10 }),
  mk('FSCHIFF1', 'F SCHIFF 1 – Sportboot-/Yachtbrand', 'Brand eines Sportboots, Segelboots, einer Yacht (Boote fehlen im Spiel)', { need: { G: 2, ELW1: 1 }, rd: 'R1', weight: 0.1, work: 720, water: 1000, as: 3 }),
  mk('FSCHIFF2', 'F SCHIFF 2 – Frachtschiffbrand', 'Brand eines Frachtschiffes', { need: { G: 3, ELW1: 1 }, elw2Ask: true, rd: 'R1', extra: { HR: 1, GWA: 1, TLF: 1 }, weight: 0.05, work: 1200, water: 3600, as: 5 }),
  mk('FSCHIFF2Y', 'F SCHIFF 2 Y – Personenschiff/Fähre', 'Brand eines Personenschiffs mit vielen Menschenleben in Gefahr', { need: { G: 3, ELW1: 1, HR: 1 }, elw2Ask: true, rd: 'MANV', extra: { GWA: 1 }, weight: 0.03, work: 1320, water: 3600, as: 6 }),
  mk('FSCHIFF2G', 'F SCHIFF 2 GEFAHR – Schiff mit Gefahrgut', 'Brand eines Tank-/Container-/Frachtschiffes mit Gefahrgut', { need: { G: 6, ELW1: 1, ELW2: 1, RW: 1, GWA: 1, ABC: 1, GWM: 1, DEKON: 1 }, extra: { DEKON: 1 }, rd: 'R1', weight: 0.03, work: 1500, water: 5000, as: 5 }),
  mk('FWALD1', 'F WALD 1 – Wald-/Flächenbrand klein', 'Wald, Wiese oder Feld, geringe Ausbreitungsgefahr; Windenergieanlage', { need: { G: 2, TLF: 1 }, weight: 1.5, work: 900, water: 2500, as: 2 }),
  mk('FWALD2', 'F WALD 2 – Wald-/Flächenbrand groß', 'Wald, Wiese oder Feld mit Gefahr der weiteren Ausdehnung', { need: { G: 3, TLF: 2, ELW1: 1, GWL: 1 }, elw2Ask: true, extra: { HR: 1 }, weight: 0.3, work: 1500, water: 8000, as: 4 }),

  // --- Hilfeleistung ---
  mk('H1', 'H1 – Einfache technische Hilfe', 'Wasser im Keller, Wasserrohrbruch, Baum auf Straße, Tier in Not, Ölspur', { need: { S: 1 }, extra: { HR: 1, RW: 1 }, weight: 5, work: 300 }),
  mk('H1Y', 'H1Y – Türöffnung / Person im Aufzug', 'Notfall-Türöffnung, Person im Aufzug, Tragehilfe', { need: { S: 1 }, rd: 'R1', extra: { HR: 1 }, weight: 4, work: 240 }),
  mk('H2', 'H2 – Technische Hilfe (mittel)', 'Fahrzeug umgestürzt, Bauunfall, Gerüsteinsturz ohne Menschenleben', { need: { GT: 1, ELW1: 1 }, extra: { RW: 1, GWL: 1 }, weight: 1.5, work: 600 }),
  mk('HABSTY', 'H ABST Y – Person in Absturzgefahr', 'Person in Absturzgefahr oder droht zu springen', { need: { G: 2, HR: 1, ELW1: 1 }, weight: 0.2, work: 600 }),
  mk('HELEK', 'H ELEK – Elektrounfall', 'Unfall in großen elektrischen Anlagen', { need: { G: 1 }, weight: 0.4, work: 480 }),
  mk('HEINSTY', 'H EINST Y – Gebäudeeinsturz', 'Gebäudeeinsturz mit Menschenleben in Gefahr', { need: { GT: 3, ELW1: 1, RW: 1 }, elw2Ask: true, rd: 'R2', extra: { GWL: 1 }, weight: 0.15, work: 1500 }),
  mk('HFLUSS', 'H FLUSS – Technische Hilfe an Gewässern', 'Einfache technische Hilfe am Fluss (Boote fehlen im Spiel)', { need: { G: 1 }, weight: 0.3, work: 480 }),
  mk('HFLUSSY', 'H FLUSS Y – Person in Fluss', 'Person in Fluss (Boote/Taucher fehlen im Spiel)', { need: { G: 2 }, rd: 'R2', weight: 0.1, work: 720 }),
  mk('HWASSY', 'H WASS Y – Person in Wasser', 'Person in Wasser (Boote/Taucher fehlen im Spiel)', { need: { G: 2 }, rd: 'R2', weight: 0.1, work: 720 }),
  mk('HGAS1', 'H GAS 1 – Gasgeruch', 'Gasgeruch', { need: { G: 1 }, weight: 1.2, work: 360 }),
  mk('HGAS2', 'H GAS 2 – Gasunfall', 'Unfall mit Gas, Verdacht auf Gefahr', { need: { G: 2, ELW1: 1, RW: 1, ABC: 1, GWM: 1 }, weight: 0.2, work: 720 }),
  mk('HGEFAHR1', 'H GEFAHR 1 – Gefahrstoffunfall', 'Unfall mit Gefahrstoffaustritt', { need: { GT: 2, GWA: 1, ELW1: 1 }, extra: { DEKON: 1, ABC: 1 }, weight: 0.5, work: 720 }),
  mk('HGEFAHR2', 'H GEFAHR 2 – Gefahrstoffunfall (groß)', 'Größerer Unfall mit Gefahrstoffaustritt', { need: { GT: 2, GWL: 1, ELW1: 1, ELW2: 1, RW: 1, ABC: 1, GWM: 1, DEKON: 2 }, rd: 'R1', weight: 0.15, work: 1200 }),
  mk('HKLEMM1Y', 'H KLEMM 1 Y – Person eingeklemmt', 'Person eingeklemmt in Fahrzeug oder Maschine', { need: { GT: 2, RW: 1, ELW1: 1 }, rd: 'R2', weight: 1.5, work: 720 }),
  mk('HKLEMM2Y', 'H KLEMM 2 Y – Mehrere Personen eingeklemmt', 'Mehrere Personen eingeklemmt oder verschüttet', { need: { GT: 4, RW: 2, ELW1: 1, ELW2: 1 }, rd: 'MANV', weight: 0.3, work: 1200 }),
  mk('HRADIO', 'H RADIOAKTIV – Radioaktive Stoffe', 'Unfall mit radioaktiven Stoffen (GABC fehlt im Spiel)', { need: { G: 2, ELW1: 1, GWA: 1, ABC: 1 }, elw2Ask: true, extra: { GWM: 1, DEKON: 2 }, weight: 0.02, work: 1200 }),
  mk('HSCHIFF', 'H SCHIFF – Schiffshavarie', 'Havarie oder Kollision eines Schiffes (Boote fehlen im Spiel)', { need: { G: 3 }, weight: 0.05, work: 900 }),
  mk('HSCHIFFY1', 'H SCHIFF Y 1 – Schiffshavarie mit Personen', 'Havarie mit Menschenleben in Gefahr', { need: { G: 3 }, rd: 'R2', weight: 0.03, work: 1200 }),
  mk('HSCHIFFY2', 'H SCHIFF Y 2 – Schiffshavarie groß', 'Havarie mit großer Anzahl Menschenleben in Gefahr', { need: { G: 6, ELW1: 1, ELW2: 1 }, rd: 'MANV', weight: 0.02, work: 1500 }),
  mk('HZUG1Y', 'H ZUG 1 Y – Person unter Zug', 'Person unter Zug / eingeklemmt', { need: { G: 2, RW: 1, ELW1: 1 }, rd: 'R2', weight: 0.1, work: 900 }),
  mk('HZUG2Y', 'H ZUG 2 Y – Zugunfall', 'Unfall eines Zuges mit vielen Menschenleben in Gefahr', { need: { G: 6, RW: 2, ELW1: 1, ELW2: 1 }, rd: 'MANV', weight: 0.03, work: 1800 }),
  mk('HUNWETTER1', 'H UNWETTER 1 – Unwetterschäden', 'Wind-, Schnee-, Hagelschäden', { need: { S: 1 }, weight: 2, work: 300 }),
  mk('HUNWETTER2', 'H UNWETTER 2 – Unwetter, Wasserschäden', 'Wasserschäden durch Unwetter / Starkregen', { need: { S: 2 }, weight: 1, work: 420 }),

  // --- Rettungsdienst ---
  mk('RKTP', 'KTP – Krankentransport', 'Krankentransport ohne Sondersignal (KTW)', { need: {}, rd: 'RKTP', ohneSS: true, weight: 1, work: 240 }),
  mk('R0K', 'R0K – Minderdringlicher Notfall', 'Minderdringlicher Notfalleinsatz (RTW oder N-KTW)', { need: {}, rd: 'R0K', ohneSS: true, weight: 2, work: 180 }),
  mk('R0', 'R0 – Notfall ohne Sondersignal', 'Notfalleinsatz unterhalb der Notarzt-Indikation', { need: {}, rd: 'R0', ohneSS: true, extra: { NEF: 1 }, weight: 3, work: 240 }),
  mk('R1', 'R1 – Notfall mit Sondersignal', 'Dringlicher Notfalleinsatz', { need: {}, rd: 'R1', extra: { NEF: 1 }, weight: 5, work: 240 }),
  mk('R2', 'R2 – Notfall mit Notarzt', 'Akut lebensbedrohliche Situation', { need: {}, rd: 'R2', weight: 3, work: 420 }),
  mk('R3', 'R3 – Notarzt allein', 'Notarzt allein – Nachforderung zu laufendem Einsatz oder bereichsübergreifend', { need: {}, rd: 'R3', weight: 0, work: 300 }),
  mk('RLEBEL', 'R LEBEL – Lebensbedrohliche Einsatzlage', 'Lebensbedrohliche Lage für Einsatzpersonal (bewaffnete Täter)', { need: {}, rd: 'RLEBEL', weight: 0.1, work: 600 }),
  mk('RMANV', 'R MANV – Massenanfall von Verletzten', 'Große Anzahl von Verletzten', { need: {}, rd: 'MANV', weight: 0.1, work: 1200 }),
]

// Welche Rollen können mit den gegebenen Fahrzeugen nicht besetzt werden? ({} = alles besetzt)
export function matchSlots(need, vehicles) {
  const pool = [...vehicles]
  const unfilled = {}
  const roles = Object.keys(need).sort((a, b) => ROLES[a].types.length - ROLES[b].types.length)
  for (const r of roles) {
    for (let i = 0; i < need[r]; i++) {
      let idx = -1
      for (const t of ROLES[r].types) {
        idx = pool.findIndex((v) => v.type === t)
        if (idx >= 0) break
      }
      if (idx >= 0) pool.splice(idx, 1)
      else unfilled[r] = (unfilled[r] || 0) + 1
    }
  }
  return unfilled
}

export const addNeeds = (a, b) => {
  const out = { ...a }
  for (const [k, n] of Object.entries(b)) out[k] = (out[k] || 0) + n
  return out
}

// --- Einsatzentwicklung ---
// Grundwahrscheinlichkeit, dass ein Einsatz "wächst" (Nachforderung), nach Stufe des Stichworts.
const TIERS = {
  1: ['F1', 'FRWM', 'H1', 'H1Y', 'HUNWETTER1', 'HUNWETTER2', 'RKTP', 'R0K', 'R0', 'R3', 'HFLUSS', 'HGAS1', 'HELEK'],
  3: ['F2Y', 'F3', 'F3Y', 'FGAS2', 'FWALD2', 'HGEFAHR2', 'HKLEMM2Y', 'HEINSTY', 'FBUSY', 'FFLUG1Y', 'FSCHIFF2', 'FSCHIFF2Y'],
  4: ['F4', 'FFLUG2Y', 'FZUGY', 'FSCHIFF2G', 'HRADIO', 'HSCHIFFY2', 'HZUG2Y', 'RMANV'],
} // alles andere: Stufe 2
const TIER_P = { 1: 0.03, 2: 0.1, 3: 0.2, 4: 0.35 }
export const growProb = (id) => TIER_P[Object.entries(TIERS).find(([, l]) => l.includes(id))?.[0] ?? 2]

// Wenn ein Einsatz "eskaliert", erhöht der Einsatzleiter vor Ort das Stichwort. Je nach Erkundungsergebnis (why) gibt es mehrere Ziele.
export const ESCALATE = {
  F1: [{ to: 'F2', why: 'Das Feuer hat bereits auf ein Gebäude übergegriffen' }, { to: 'FWALD1', why: 'Der Brand hat sich auf eine größere Fläche ausgebreitet' }],
  FBMA: [{ to: 'F2', why: 'Echtbrand im Gebäude festgestellt' }, { to: 'F3', why: 'Echtbrand im Sondergebäude, Ausbreitung über mehrere Räume' }],
  FRWM: [{ to: 'F2', why: 'Wohnungsbrand festgestellt' }],
  F2: [{ to: 'F3', why: 'Brand hat auf Nachbargebäude / ausgedehntes Objekt übergegriffen' }],
  F2Y: [{ to: 'F3Y', why: 'Weitere Personen vermisst, Brand breitet sich aus' }],
  F3: [{ to: 'F4', why: 'Großschadenslage, Brand nicht unter Kontrolle' }],
  F3Y: [{ to: 'F4', why: 'Großschadenslage mit vielen Betroffenen' }],
  FLKW: [{ to: 'FWALD1', why: 'Brand hat auf die Böschung neben der Fahrbahn übergegriffen' }, { to: 'FGAS2', why: 'Gasflaschen auf der Ladefläche, Brand nicht unter Kontrolle' }],
  FZUG: [{ to: 'FZUGY', why: 'Noch Fahrgäste im Zug, starke Rauchentwicklung' }],
  FFLUG1Y: [{ to: 'FFLUG2Y', why: 'Größeres Luftfahrzeug, weitere Personen an Bord' }],
  FSCHIFF2: [{ to: 'FSCHIFF2G', why: 'Gefahrgut an Bord festgestellt' }],
  FWALD1: [{ to: 'FWALD2', why: 'Flächenbrand breitet sich aus' }],
  FGAS1: [{ to: 'FGAS2', why: 'Gastank beteiligt' }],
  H1: [{ to: 'H2', why: 'Lage komplexer als gemeldet' }],
  H1Y: [{ to: 'H2', why: 'Zugang nur mit schwerem Gerät möglich' }],
  H2: [{ to: 'HKLEMM1Y', why: 'Person eingeklemmt festgestellt' }, { to: 'HGEFAHR1', why: 'Gefahrstoff tritt aus' }],
  HELEK: [{ to: 'F2', why: 'Kabelbrand hat auf das Gebäude übergegriffen' }],
  HUNWETTER1: [{ to: 'HUNWETTER2', why: 'Weitere Wasserschäden im Umfeld gemeldet' }],
  HZUG1Y: [{ to: 'HZUG2Y', why: 'Zug entgleist, mehrere Fahrgäste verletzt' }],
  HSCHIFF: [{ to: 'HSCHIFFY1', why: 'Personen an Bord, Schiff nimmt Wasser' }],
  HSCHIFFY1: [{ to: 'HSCHIFFY2', why: 'Viele Personen an Bord, Schiff kentert' }],
  HGAS1: [{ to: 'HGAS2', why: 'Gasaustritt größer als gemeldet' }],
  HGEFAHR1: [{ to: 'HGEFAHR2', why: 'Gefahrstoffaustritt größer als gemeldet' }],
  HKLEMM1Y: [{ to: 'HKLEMM2Y', why: 'Weitere Personen eingeklemmt' }],
  FSCHIFF1: [{ to: 'FSCHIFF2', why: 'Brand breitet sich auf das Schiff aus' }],
  HFLUSS: [{ to: 'HFLUSSY', why: 'Person im Wasser gesichtet' }],
  R0K: [{ to: 'R0', why: 'Zustand des Patienten hat sich verschlechtert' }],
  R0: [{ to: 'R1', why: 'Zustand des Patienten hat sich verschlechtert' }],
  R1: [{ to: 'R2', why: 'Patient instabil, Notarzt erforderlich' }],
  R3: [{ to: 'R2', why: 'Patient muss transportiert werden' }],
  RKTP: [{ to: 'R0', why: 'Zustand des Patienten hat sich verschlechtert, Rettungswagen erforderlich' }],
}

export const maxNeeds = (a, b) => {
  const out = { ...a }
  for (const [k, n] of Object.entries(b)) out[k] = Math.max(out[k] || 0, n)
  return out
}
export const diffNeeds = (a, b) => {
  const out = {}
  for (const [k, n] of Object.entries(a)) if (n > (b[k] || 0)) out[k] = n - (b[k] || 0)
  return out
}

# Moorhuhn

Ein Browser-Nachbau des Klassikers von 1999, gebaut mit React und Vite. Alle Grafiken werden direkt auf dem Canvas gezeichnet, alle Sounds werden per Web Audio API synthetisiert. Es gibt keine Bild- oder Audiodateien.

## Spielprinzip

- 90 Sekunden Zeit
- 8 Schuss im Magazin, danach nachladen (`R`, Leertaste oder Rechtsklick)
- Drei Entfernungsebenen: weit entfernte Hühner bringen 50 Punkte, mittlere 20, nahe 10
- Der Rekord wird im Browser gespeichert

## Starten

```bash
npm install
npm run dev
```

Dann die angezeigte Adresse im Browser öffnen.

## Produktions-Build

```bash
npm run build
npm run preview
```

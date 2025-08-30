# TetriXapp

Una Tetris PWA **in un'unica cartella**: leggera, offline, open‑source.  
Perfetta da pubblicare su GitHub Pages con un *fork* e due click.

## ✨ Caratteristiche
- **Vanilla JS**: nessuna dipendenza.
- **PWA completa**: `manifest.json` + `sw.js` per funzionare anche **offline**.
- **Una sola cartella**: semplice da clonare, copiare, hostare ovunque (anche su Pages).
- **Mobile‑friendly**: pulsanti touch e installazione come app.
- **7‑bag random**: estrazione dei pezzi stile Tetris moderno.
- **Ghost piece, next preview, livelli e punteggio** con salvataggio **Best** in `localStorage`.

## ▶️ Avvio locale
Basta servire la cartella con un server statico (necessario per i Service Worker):
```bash
# con Python
python3 -m http.server -d TetriXapp 8080
# poi apri http://localhost:8080
```

## 🚀 Pubblicazione su GitHub Pages
1. Crea il repo **TetriXapp** e carica i file di questa cartella nella root.
2. Vai su **Settings → Pages** e scegli **Deploy from a branch** (branch `main`, folder `/`).
3. Attendi il deploy, poi apri l’URL che GitHub ti fornisce.  
   Il browser proporrà l’**Install** (PWA) e l’app funzionerà **offline**.

## 🎮 Comandi
- **Freccia ◀︎ / ▶︎**: muovi
- **Freccia ▼**: scendi (soft drop)
- **Z / W / ↑**: ruota
- **Spazio**: **hard drop**
- **P**: pausa
- **R**: nuova partita

## 🧱 Struttura
```
TetriXapp/
├─ index.html
├─ style.css
├─ app.js
├─ sw.js
├─ manifest.json
└─ icons/
   ├─ icon-192.png
   ├─ icon-512.png
   └─ favicon.ico
```

## 🧪 Note tecniche
- Canvas con **devicePixelRatio** per resa nitida su display ad alta densità.
- Ciclo di gioco via `requestAnimationFrame`, `dropInterval` che si riduce a ogni livello.
- **Wall kick** semplice in rotazione, **ghost** calcolato via collisione progressiva.
- Cache strategy **Cache‑First** per gli asset statici, con *runtime caching* per risorse same‑origin.

## 👐 Licenza
MIT — fai un *fork*, cambia i colori, aggiungi suoni, firma la tua versione.  
Se vuoi, cita: **PezzaliAPP / TetriXapp**.

> “Ogni strumento è un gesto di fiducia.” — PezzaliAPP

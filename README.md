# RiceCare: Philippine Rice Disease Detector

RiceCare is a mobile-first Progressive Web App for diagnosing rice leaf diseases offline in the browser. It uses TensorFlow.js with a local TensorFlow Lite model, camera or gallery input, and IndexedDB scan history so farmers and field users can keep using the app with limited connectivity.

## Features

- Offline rice disease classification with a local `.tflite` model.
- Camera capture and image upload workflows.
- Diagnosis output with confidence, severity, disease description, and recommended action.
- Local scan history stored in IndexedDB.
- PWA install support through a web manifest and service worker.
- Vite build setup with Tailwind CSS 4 theme tokens.
- Cross-origin isolation headers for TensorFlow Lite WASM execution.

## Quick Start

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:3000` by default.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server with forced dependency refresh. |
| `npm run build` | Build the production app into `dist/`. |
| `npm run preview` | Preview the production build locally. |

## Project Structure

```text
.
|-- index.html             # Mobile PWA shell and UI markup
|-- src/
|   |-- main.js            # App state, model loading, camera, inference, history
|   `-- index.css          # Tailwind CSS theme tokens and app styling
|-- public/
|   |-- sw.js              # Offline cache service worker
|   |-- manifest.json      # PWA metadata
|   |-- *.tflite           # Local rice disease model
|   |-- *.wasm             # TensorFlow Lite WASM runtime assets
|   `-- tflite-wasm/       # Alternate TensorFlow Lite runtime asset path
|-- vite.config.js         # Vite, Tailwind, TFJS TFLite shims, dev headers
|-- vercel.json            # Deployment headers, asset caching, SPA rewrites
`-- DESIGN.md              # Product and interface design notes
```

## Architecture

The app is intentionally client-only. `src/main.js` loads the local model from `public/philippines_rice_disease_edge_v2.tflite`, configures the TensorFlow Lite WASM path, and enables camera and upload controls after the model is ready.

When a user captures or uploads an image, the app center-crops it to the model input shape, creates a TensorFlow tensor, runs prediction with the TFLite model, then maps the highest scoring output to a disease label and recommendation. Results are shown in the UI and saved locally with a thumbnail in IndexedDB.

Offline behavior is handled by `public/sw.js`, which precaches the app shell, model, and TensorFlow Lite runtime files. `vercel.json` and `vite.config.js` set cross-origin isolation headers required by threaded or SIMD WASM runtimes.

## Model and Runtime Assets

The model and WASM files are served from `public/` so they are copied directly to the production build root. Keep these filenames stable unless you also update:

- `src/main.js`
- `public/sw.js`
- `vercel.json`
- any runtime asset path expected by `@tensorflow/tfjs-tflite`

The app currently expects the main model at:

```text
/philippines_rice_disease_edge_v2.tflite
```

## Deployment

This project includes Vercel configuration for:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- long-lived cache headers for `.tflite` and `.wasm` files
- SPA rewrites to `index.html`

For other hosts, configure equivalent headers and ensure all files in `public/` are served from the site root.

## Notes

- The app runs inference locally; no image upload to a server is required by the current implementation.
- Camera access requires HTTPS in production or localhost during development.
- Browser support depends on TensorFlow.js, WebAssembly, IndexedDB, and service worker availability.

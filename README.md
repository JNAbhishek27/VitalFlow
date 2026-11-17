# VITALFLOW

**Your body. Your rhythm. Your world.**

VITALFLOW is an interactive ambient digital garden desktop application built for the **Presage SmartSpectra SDK Challenge 2026**. It uses real-time optical human sensing from your camera via the official Presage SmartSpectra Node.js/Electron SDK (`@smartspectra/node-sdk`) to drive a responsive generative HTML5 Canvas environment.

> **Wellness Disclaimer:** VITALFLOW is a personal wellness and self-awareness experience. It is not a medical device and does not provide diagnosis, health screening, or treatment recommendations.

---

## Features

- **Real-Time SmartSpectra Integration:** Captures camera frames through Electron's renderer `MediaStream` and processes physiological metrics in the main process via `@smartspectra/node-sdk` (`breathingMetrics` and `cardioMetrics`).
- **Three Signal-Responsive Generative Worlds:**
  - **Living Garden:** Bioluminescent breathing halos, branching organic filaments, and pulse-driven particles.
  - **Cosmic Waves:** Multi-layered harmonic wave interference and orbital starfields.
  - **Breathing Mandala:** Symmetrical geometric lotus petals expanding and contracting with respiratory cadence.
- **Honest Signal & Quality Handling:**
  - Pulse rate, breathing rate, and waveform traces appear only when the SDK produces valid readings.
  - Heart Rate Variability (HRV) is displayed and used to modulate visual complexity **only** when genuinely emitted by the SDK (never inferred from pulse rate).
  - Real-time `ValidationCode` feedback guides lighting, centering, distance, and stillness.
- **Explicit Consent & Privacy Controls:**
  - Camera activates only after explicit user consent and session start.
  - Zero video recording, zero external AI frame uploads, and strictly in-memory session data with one-click clearing.
  - Includes an opt-out toggle for SDK diagnostic telemetry (`enableTelemetry: false`).
- **Browser Preview Mode (Demo Data):** When opened in a standard browser outside Electron, VITALFLOW offers an explicitly labeled **DEMO DATA** mode so the interface and generative garden can be previewed safely without pretending simulated signals are live SDK output.

---

## Architecture

```text
Camera (MediaStream)
  └─> @smartspectra/node-sdk/renderer
        └─> MessagePort IPC (@smartspectra/node-sdk/preload + bindSmartSpectraIpc)
              └─> Native SmartSpectra Engine (Electron Main Process)
                    └─> Protobuf Metrics Buffer (decodeMetrics)
                          └─> SignalProcessor (EMA smoothing & interpolation)
                                └─> DigitalGardenEngine (HTML5 Canvas 2D)
```

### Key Directories & Files

```text
├── electron/
│   ├── main.ts                # Electron main process, bindSmartSpectraIpc, consent-gated camera permissions
│   └── preload.ts             # Preload bridge (@smartspectra/node-sdk/preload + runtime IPC)
├── src/
│   ├── components/            # CameraPreview, DigitalGardenCanvas, HeaderNav, TraceSparkline
│   ├── hooks/
│   │   └── useVitalFlowSession.ts
│   ├── pages/                 # Welcome, ConsentSetup, Measurement, SessionSummary, Privacy, HowItWorks
│   ├── services/
│   │   ├── smartSpectraService.ts
│   │   ├── signalProcessor.ts
│   │   └── gardenEngine.ts
│   ├── types/vitals.ts
│   └── utils/validationGuidance.ts
├── .env.example               # Environment variable template (no secrets)
├── package.json
└── vite.config.ts
```

---

## Security & Credential Hygiene

- **Never commit `.env`** (already excluded via `.gitignore`).
- `SMARTSPECTRA_API_KEY` is read exclusively in `electron/main.ts` via Node environment variables or entered transiently into main-process memory during a session.
- **Never** prefix your Presage API key with `VITE_`—doing so would embed the credential into the client browser bundle.

---

## Prerequisites

- **Node.js 20+** (recommended Node.js 20 or 22 LTS)
- **npm**
- A **Presage SmartSpectra API key** (for live native SDK sensing in Electron)
- A connected **webcam**

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your Presage SmartSpectra API key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SMARTSPECTRA_API_KEY="your_presage_smartspectra_api_key"
SMARTSPECTRA_DIAGNOSTICS="0"
```

*(Alternatively, you can leave `.env` unconfigured and paste a session-only API key inside the Consent & Setup screen when launching the Electron app.)*

### 3. Run the Electron Desktop App (Genuine SmartSpectra SDK)

Build the renderer and Electron main/preload bundles and start Electron:

```bash
npm run electron:start
```

For active development on macOS/Linux (run Vite dev server in one terminal and Electron in another):

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run electron:dev
```

### 4. Run Web Preview (Browser / Demo Mode)

To preview the UI and generative environments in a standard browser (uses explicitly labeled `DEMO DATA` since native SmartSpectra IPC requires Electron):

```bash
npm run dev
```

---

## Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start Vite web development server on port 3000 |
| `npm run build` | Build production renderer bundle into `dist/` |
| `npm run build:electron` | Bundle `electron/main.ts` and `electron/preload.ts` into `dist-electron/` |
| `npm run electron:start` | Build renderer + Electron and launch the desktop application |
| `npm run electron:dev` | Build Electron scripts and launch against `http://localhost:3000` |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Remove build artifacts (`dist/`, `dist-electron/`) |

---

## Privacy & Telemetry Notice

- Camera frames are never saved to disk or uploaded to third-party AI services.
- Session measurements reside only in application memory and are cleared when you click **Clear Session** or close the app.
- Per [Presage SmartSpectra documentation](https://smartspectra.presagetech.com/docs), SDK telemetry transmits only aggregate session diagnostics and readiness summaries (never raw video or vital sign measurements) and can be disabled in the app's **Consent & Setup** or **Privacy** pages (`enableTelemetry: false`).

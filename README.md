# Even Realities G2 — EvenHub Exploration

Exploring the EvenHub SDK, CLI, and simulator for building apps on the Even Realities G2 smart glasses.

## Architecture

EvenHub apps are **WebView-based web apps** (HTML/CSS/JS). Your app runs inside a WebView embedded in the Even Realities mobile app (Flutter). The SDK is a JavaScript bridge — you never touch BLE directly.

```
Your Web App (HTML/JS) → SDK Bridge → Even App (Flutter) → BLE → G2 Glasses
```

## Toolkit

| Package | Version | Purpose |
|---------|---------|---------|
| `@evenrealities/even_hub_sdk` | 0.0.7 | TypeScript SDK — bridge between web app and Even App |
| `@evenrealities/evenhub-cli` | 0.1.5 | CLI — `init`, `login`, `qr`, `pack` commands |
| `@evenrealities/evenhub-simulator` | 0.4.1 | Desktop simulator — native binary for testing without glasses |

## Quick Start

```bash
# Install tools globally
npm install -g @evenrealities/evenhub-cli @evenrealities/evenhub-simulator

# Run the hello world app
cd hello-world
npm install
npm run dev              # starts Vite dev server on :5173
evenhub-simulator http://localhost:5173   # opens simulator window
```

## Display Constraints

- Canvas coordinate system: 576x288 (origin top-left)
- Up to 4 containers per page (list, text, image)
- Only ONE container can have `isEventCapture=1` (receives input)
- Text: max 2000 chars, container name max 16 chars
- Images: 20-200px wide, 20-100px tall, 1-bit, no concurrent sends
- Use `createStartUpPageContainer()` once, then `rebuildPageContainer()` for updates

## SDK API Summary

**Bridge init:** `waitForEvenAppBridge()` → `EvenAppBridge`

**Data:** `getUserInfo()`, `getDeviceInfo()`, `setLocalStorage()`, `getLocalStorage()`

**Display:** `createStartUpPageContainer()`, `rebuildPageContainer()`, `textContainerUpgrade()`, `updateImageRawData()`, `shutDownPageContainer()`

**Audio:** `audioControl(isOpen)` — PCM: 16kHz, 40 bytes/frame, little-endian

**Events:** `onDeviceStatusChanged()`, `onEvenHubEvent()` — list/text/sys/audio events

**Input events:** CLICK, SCROLL_TOP, SCROLL_BOTTOM, DOUBLE_CLICK, FOREGROUND_ENTER/EXIT, ABNORMAL_EXIT

## CLI Workflow

```bash
evenhub init                              # generates app.json manifest
evenhub qr -p 5173                        # QR code for dev-mode sideloading
evenhub login -e you@example.com          # authenticate
evenhub pack app.json ./dist -o app.ehpk  # bundle for submission
```

## Project Structure

```
hello-world/          # Vite + TypeScript hello world app
  app.json            # EvenHub app manifest
  index.html          # Web entrypoint
  src/main.ts         # SDK bridge init, containers, event handling
  dist/               # Build output
```

## What Can Be Built

Given the constraints (monochrome display, text/list/image containers, mic input, TouchBar/Ring navigation):

- HUD dashboards (stocks, weather, calendar, notifications)
- Voice-to-AI assistants (mic → STT → LLM → display)
- Reading/teleprompter apps
- List-based tools (checklists, quick reference)
- Translation tools (mic → transcribe → translate → display)
- Clinical/medical HUDs

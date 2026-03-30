<p align="center">
  <img src="src-tauri/icons/icon.svg" width="128" height="128" alt="Sloppy PDF Viewer icon">
</p>

<h1 align="center">Sloppy PDF Viewer</h1>

A lightweight desktop PDF viewer built with [Tauri](https://tauri.app/) and [pdf.js](https://mozilla.github.io/pdf.js/). Features include page navigation, zoom, text search, thumbnails, document outline, presentation mode, and drag-and-drop file opening.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (for npm and frontend tooling)
- [Rust toolchain](https://rustup.rs/) (for the Tauri backend)
- Linux system dependencies for Tauri — see [Tauri prerequisites](https://tauri.app/start/prerequisites/#linux)

### Setup

```sh
npm install
```

### Running

**Full desktop app (Tauri + frontend):**
```sh
npm run tauri:dev
```

**Frontend only (browser, no Tauri APIs):**
```sh
npm run dev
```

### Building

```sh
npm run tauri:build
```

Produces an AppImage in `src-tauri/target/release/bundle/appimage/`.

### Testing

Tests are Playwright e2e tests that run against the Vite dev server (no Tauri required):

```sh
npm run test
```

To regenerate the PDF test fixtures:
```sh
npm run test:gen-fixtures
```

## Disclaimer

This application is entirely AI-generated slop. Every line of code, configuration, and even this README was produced by an LLM. Use at your own risk.

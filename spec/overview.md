# AoE4 Draft Overlay — End-to-End Overview (Current App)

## What the app is
The app is a Vite + React + TypeScript single-page application that uses a single Zustand store (`draftStore`) for draft data, session metadata, and studio layout state, with persistence to `localStorage` via `zustand/persist` and a custom broadcast wrapper for cross-tab synchronization.【F:src/store/draftStore.ts†L1-L119】【F:src/store/draftStore.ts†L2360-L2449】【F:src/store/customStorage.ts†L1-L200】

## Primary runtime views
### 1) Technical Interface (control room)
The Technical Interface is the operator UI for importing civ/map drafts, editing match metadata (names, scores, colors, flags), managing presets, and configuring the Best‑of series planner (maps, civs, winner).【F:src/pages/TechnicalInterface.tsx†L1-L120】【F:src/pages/TechnicalInterface.tsx†L430-L520】

Key visible capabilities:
- Draft IDs/URLs input for civ + map drafts and connection actions (through store actions).【F:src/pages/TechnicalInterface.tsx†L22-L60】
- Session metadata controls: host/guest names, score increment/decrement, swap sides, colors, and flags (flags are seeded from `countryplayers.txt` or localStorage).【F:src/pages/TechnicalInterface.tsx†L22-L120】【F:src/pages/TechnicalInterface.tsx†L120-L220】
- Preset save/load/delete and dirty-state logic against the currently active preset.【F:src/pages/TechnicalInterface.tsx†L430-L520】
- Best‑of planner uses draft pick lists with optional manual map additions to build the “available maps” list for games.【F:src/pages/TechnicalInterface.tsx†L430-L520】

### 2) Studio Interface (layout editor)
The Studio Interface is a 1920×1080 layout editor that lets the operator add overlay elements, drag/resize them, and edit settings per element. It also supports multiple canvases, save/load/delete of named layouts, and JSON import/export of layouts.【F:src/pages/StudioInterface.tsx†L1-L120】【F:src/pages/StudioInterface.tsx†L120-L220】

Key visible capabilities:
- Toolbox buttons that add overlay elements (ScoreOnly, NicknamesOnly, BoXSeriesOverview, CountryFlags, ColorGlow, MapPool, CivPool, PickedCivs, BannedCivs, Maps, DeciderMap, BackgroundImage).【F:src/pages/StudioInterface.tsx†L1-L120】
- Drag/resize behaviors with support for pivot locking and horizontal split offsets (specific to pool/pick/ban elements).【F:src/pages/StudioInterface.tsx†L120-L220】
- Multi-canvas system with active canvas selection, rename, removal, background color, and a broadcast border toggle.【F:src/pages/StudioInterface.tsx†L1-L120】
- Import/export layouts to JSON via `importLayoutsFromFile` and export payloads composed of saved layouts and current canvases.【F:src/pages/StudioInterface.tsx†L1-L120】

### 3) Broadcast View (render-only overlay)
The Broadcast View renders a selected canvas in a fixed 1920×1080 space, selecting the canvas by URL parameter (or falling back to active/first canvas). It renders each overlay element type as a read-only view suitable for capture by OBS Browser Source.【F:src/pages/BroadcastView.tsx†L1-L140】【F:src/pages/BroadcastView.tsx†L140-L220】

Key visible capabilities:
- Render of a target canvas by ID with fallbacks when missing/invalid IDs.【F:src/pages/BroadcastView.tsx†L46-L104】
- For each element in the canvas, selects the matching component and scales/positions it according to element settings.【F:src/pages/BroadcastView.tsx†L120-L220】
- Handles a `newSessionDataLoaded` event (from the store) by reloading the broadcast view to update state across sessions.【F:src/pages/BroadcastView.tsx†L21-L44】

## Draft ingestion and derived data
Draft data is fetched from AoE2CM via HTTP (`/api/draft/:id`) and optionally via Socket.IO for live updates. The raw data is normalized into “picks/bans” arrays for civs and maps, and those arrays drive both studio preview and broadcast output.【F:src/store/draftStore.ts†L1240-L1510】

## State persistence and cross-tab sync
The store persists selected fields to localStorage (`aoe4-draft-overlay-storage-v1`) and uses a custom BroadcastChannel + storage event strategy to rehydrate updates between tabs (studio, technical, broadcast).【F:src/store/draftStore.ts†L2360-L2449】【F:src/store/customStorage.ts†L1-L200】

# Rewriting the AoE4 Draft Overlay into a Stable Desktop + OBS System

## Current application feature map

The repository is a Vite + React + TypeScript application that runs a multi-view “controller + overlay” workflow and relies on a centralized Zustand store for both UI state and “live draft” state. fileciteturn44file16L1-L1 fileciteturn44file3L1-L1

At runtime it effectively behaves like three applications sharing the same state model:

- **TechnicalInterface**: a “control room” for importing drafts by ID, managing match session metadata (names, flags, colors, scores), managing a Best-of-X series plan, and saving/loading “presets”. fileciteturn44file1L1-L1  
- **StudioInterface**: a layout editor that composes a broadcast layout inside a fixed 1920×1080 coordinate system, supports multiple canvases (tabs), drag/resize, element-specific settings, named layout saves, and JSON import/export. fileciteturn44file5L1-L1 fileciteturn24file1L1-L1  
- **BroadcastView**: a “render-only” view opened with a query like `?view=broadcast&canvasId=...` that draws the selected canvas with the configured elements for OBS capture. fileciteturn44file10L1-L1 fileciteturn24file1L1-L1

### Draft ingestion model

The store (`draftStore.ts`) provides “connect/import” logic: given a civ draft ID and/or a map draft ID, it fetches draft data from AoE Captains Mode endpoints and subscribes to live updates using Socket.IO. All UI/overlay components render from derived arrays like `civPicksHost`, `civBansGuest`, `mapPicksGlobal`, etc., which are computed from AoE2CM “raw draft options” and “raw draft events”. fileciteturn24file3L1-L1 fileciteturn24file1L1-L1

The dev server is configured to proxy `/api` requests to `https://aoe2cm.net`, which is how the UI can call endpoints like `/api/draft/<id>` without running into typical CORS barriers during development. fileciteturn12file4L1-L1

### Session state, presets, and per-game planning

The TechnicalInterface is not just “draft IDs”. It also manages:

- **Session-level metadata**: host/guest names, scores, player colors, and player flags used by overlay elements (Score, Nicknames, Flags, Glow). fileciteturn44file1L1-L1  
- **Per-game planning** for a Best-of series: a list of games, each with map / civ selections, visibility toggles, and an optional winner marker (host/guest). This is rendered in the overlay through `BoXSeriesOverviewElement` and its `GameEntry` component. fileciteturn44file1L1-L1 fileciteturn16file14L1-L1

### Layout system and overlay modules

The layout editor supports multiple **canvases** and multiple **saved studio layouts**. Each canvas contains a list of elements (type + position + size + settings). The types are defined in `src/types/draft.ts` and include many element-level configuration properties (scale, fontFamily, show/hide toggles, pivot locking, background color, border color, etc.). fileciteturn24file1L1-L1

One special element is a background image element: it persists images in IndexedDB (via the `idb` library) and stores only an image key (`bg-...`) in the layout element settings. fileciteturn44file5L1-L1 fileciteturn44file5L1-L1

The editor exports/imports layouts as JSON (layouts + canvases + active canvas selection). fileciteturn44file5L1-L1

## Why it becomes unstable and why it fails in OBS

Your described failure modes—draft import resets, duplicates, “different visual modules reading different data stores”, and OBS incompatibility—are consistent with two structural properties of the current approach.

### Multi-tab state synchronization via localStorage is brittle

The project implements cross-tab synchronization using:

- Zustand persist (localStorage) for long-lived state, and  
- a custom storage wrapper that writes to localStorage and broadcasts update signals via `BroadcastChannel`, plus a `storage` event listener as another sync path. fileciteturn44file9L1-L1

This pattern is fragile for a broadcast workflow because you typically end up with **multiple browser contexts** (Technical tab, Studio tab, one or more Broadcast tabs). Even small timing differences (who writes first, who rehydrates first, who applies merges first) can cause “last write wins” overwrite behavior and partial rehydration that feels like resets or inconsistent modules. The code itself contains multiple protections and flags for these contexts (`IS_TECHNICAL_INTERFACE`, `IS_BROADCAST_STUDIO`, `IS_BROADCAST_VIEW`), which is a practical sign that the system is already fighting self-induced sync loops. fileciteturn44file9L1-L1 fileciteturn44file5L1-L1

### Some overlay components violate React hook rules

Two key “pool” overlay components (`MapPoolElement.tsx` and `CivPoolElement.tsx`) call a custom hook inside a `.map(...)` render loop. This is explicitly against React’s Rules of Hooks (hooks are required to be called unconditionally in the same order on every render). In practice, this can produce intermittent problems that get worse as the underlying lists change with draft updates. fileciteturn44file15L1-L1 fileciteturn44file17L1-L1 fileciteturn26file0L1-L1

A stable pattern already exists elsewhere in the code: the “picked/banned item” elements render a dedicated child component (`CivItem`, `MapItem`) which calls `useDraftAnimation` inside the component (valid), not inside the parent loop. fileciteturn32file0L1-L1

### Draft option normalization and derived-state drift

The pool components contain extensive comments/debug logging around the problem of getting consistent names between raw draft options and pick/ban arrays. This indicates a known correctness risk: if normalization differs anywhere (e.g., stripping prefixes, using `opt.name` vs `opt.id`), the UI can show “wrong” statuses, missing maps/civs, or inconsistent “affected/picked/banned” rendering. fileciteturn44file15L1-L1 fileciteturn44file17L1-L1

### Why OBS breaks with the current strategy

The current design expects the “broadcast view” to be another browser tab sharing the same persisted store and cross-tab sync system. That works if all views run inside the same browser profile.

OBS Browser Source is a separate embedded browser (CEF-based) and is configured as its own “Browser Source” inside OBS. Official documentation shows that the Browser Source has its own rendering settings and its own default CSS (transparent background by default), reinforcing that OBS is rendering the web content in its own environment. citeturn7search0

Because localStorage/IndexedDB scopes are tied to the browser environment and its profile, a controller running in Chrome/Edge cannot reliably “share” localStorage with the OBS embedded browser. This makes the current “sync by localStorage + BroadcastChannel” architecture a poor fit for OBS: OBS will load the overlay page, but it will not magically receive the controller state. The result looks exactly like what you described: a “dummy” overlay with missing draft/session state.

## OBS integration strategies that actually work at production level

In practice, you have three viable integration strategies. Each is valid; the “best” depends on whether you want OBS to host the overlay (browser source) or whether you want the app to render its own transparent window.

### Browser Source overlay with a central local state server

This is the most common production pattern because OBS Browser Source can be transparent by default and is designed for overlays. The official Browser Source page describes default transparent background behavior and the default CSS it injects (rgba(0,0,0,0) with hidden overflow). citeturn7search0

**Key point:** in this design the browser source does *not* need localStorage sync. Instead, the browser source loads a URL like:

- `http://127.0.0.1:<port>/overlay/<canvasId>` (or similar)

and then receives state through WebSocket/SSE from a local server process.

A concrete precedent for “controller UI in a normal browser + overlay in OBS + local server” exists in the wild: projects that run a local web server and then add it as an OBS browser source and optionally also as a custom browser dock. citeturn8search3

### Programmatic OBS control via obs-websocket

If you want the app to automatically create/update OBS sources, toggle scene items, set URL parameters, etc., you can integrate with obs-websocket. The obs-websocket project notes it is built into OBS 28+ and provides a protocol for controlling OBS. citeturn1view0

Crucially, the protocol supports creating inputs (`CreateInput`) and updating input settings (`SetInputSettings`). This is enough to automatically create a Browser Source input (using OBS’s browser source kind) and then configure its URL/width/height and refresh behavior by setting settings. citeturn6view2turn6view5

This approach upgrades your UX: “one button: create my overlay source(s) in OBS”, rather than manual OBS source setup.

### Desktop transparent window captured in OBS

If you instead want a standalone executable window with transparency (your “own exe оболочка-окно”), you can capture it in OBS using capture modes that support transparency. A real example: veadotube documents that with Game Capture you can tick “Allow Transparency” to preserve alpha when your app background is set to transparent. citeturn0search8

This approach avoids browser source constraints but introduces its own OS/capture-specific pitfalls (GPU capture compatibility, window layering, click-through, always-on-top behavior). It’s viable, but it tends to be more work than the Browser Source method—especially if your UI is already web-based.

### A very high-leverage hybrid: obs-browser custom events

OBS’s browser plugin (`obs-browser`) exposes a `window.obsstudio` API to pages running inside OBS, and it explicitly supports “any custom event emitted via obs-websocket vendor requests”. That means you can push structured data into browser sources by emitting vendor events over obs-websocket, without standing up a separate web server for state distribution. citeturn9view0

This is particularly attractive if you already plan to integrate via obs-websocket: your desktop app can connect to obs-websocket and emit “state updated” events; the overlay listens and re-renders.

## Target architecture for the rewrite

Given your goals (simpler code, stable draft import, works in OBS, and can become a desktop app with one-button launch), the most robust architecture is:

**One desktop “controller app” + one local backend process + one overlay renderer (browser-source-first), all sharing a single authoritative state store.**

The core mistake in the current implementation is trying to use browser local state replication as if it were a real multi-process state bus. `customStorage.ts` is essentially building a distributed system on top of localStorage. fileciteturn44file9L1-L1

### Recommended rewrite stack

**Backend (authoritative state + draft ingestion)**  
A small local server process that:

- Stores state in SQLite (projects, presets, layouts, player profiles, cached draft snapshots, asset metadata)
- Connects to AoE2CM draft endpoints and socket updates
- Exposes a local WebSocket (or SSE) stream for “render state”
- Exposes a local HTTP API for the desktop UI

Your existing code already depends on “raw draft options/events → derived render arrays”, so the new backend should treat this transformation as pure, deterministic functions and version them. fileciteturn24file3L1-L1

**Frontend (desktop)**  
A single-window desktop UI (technical + studio) that talks to the backend over localhost and does not need cross-tab syncing at all. Your current repository’s StudioInterface and TechnicalInterface can be used as behavioral reference, but they should be merged into one cohesive app flow. fileciteturn44file5L1-L1 fileciteturn44file1L1-L1

**Overlay renderer**  
A local web page served by your backend, designed specifically for OBS Browser Source:

- minimal dependencies
- no editing logic
- no persistence
- just “subscribe to render state and draw”

This maps cleanly to what BroadcastView currently does. fileciteturn44file10L1-L1

### Draft import correctness contract

To avoid resets/duplicates forever, the rewrite needs an explicit “draft ingestion contract”:

- Store **raw snapshots** and **raw events** exactly as received.
- Maintain a monotonic “ingestion cursor” (last processed event index or equivalent) per draft connection.
- Derive **render state** from raw inputs using a deterministic transformer that is idempotent.

Right now, drift can occur because state is mutated in place across multiple components and then mirrored across contexts. fileciteturn44file9L1-L1

### Auto-discovery from aoe2cm.net/spectate

You asked to automatically find new drafts from AoE2CM’s spectate page:

```text
https://aoe2cm.net/spectate
```

That page is a JS app; when opened without JS execution you only get a “You need to enable JavaScript to run this app.” placeholder. citeturn10view0

So the rewrite should plan for one of these two approaches:

- **Preferred**: reverse engineer the underlying JSON endpoints used by the spectate frontend and call them directly (fast, stable).
- **Fallback**: use a headless browser (Playwright) inside the backend to load the page, capture network responses, extract draft IDs, and feed them into your importer.

## Optimal interface and workflow redesign

The current system forces you to juggle multiple browser tabs and mentally map which tab is “source of truth.” The redesign should eliminate that by centering everything around a single object: a **Project**.

A Project is: “everything needed to run a match on stream.”

It contains:
- Draft sources: civ draft + map draft (IDs or URLs)
- Match metadata: players, scores, flags, colors
- BoX series plan: games, visibility, winners, per-game civ/map picks
- Layout: one or more canvases with overlay elements, plus background assets
- OBS integration settings: target scene, source names, connection info

This is consistent with how your current `types/draft.ts` is already combining these concerns into a single store structure; the rewrite just formalizes it and prevents partial persistence. fileciteturn44file11L1-L1

### Concrete UX layout

A single window with a left sidebar and main content:

- **Projects**  
  Create/open project, duplicate project, export/import project bundle.
- **Drafts**  
  Civ draft import, map draft import, status, live connection, event log, “reset draft parsing cache”, and spectate auto-discovery panel.
- **Match**  
  Player profiles, flags/colors, score controls, “swap sides”.
- **Series**  
  BoX planner table, map list management, quick winner toggles.
- **Layout**  
  Canvas list, element library, property inspector, alignment tools, safe-area guides, preview toggle, “open overlay preview window”.
- **OBS**  
  Connect to obs-websocket, one-button “Create/Update sources”, show overlay URL(s), and a “Verify overlay loaded” indicator.

This removes the need for the current `customLocalStorageWithBroadcast` cross-tab sync entirely. fileciteturn44file9L1-L1

### Automation you should add at the application level

Based on how the current TechnicalInterface is already guiding workflow (preset selection, dirty detection, and “session awaiting first draft” logic), the rewrite should add automation that reduces operator load:

- “When draft becomes finished, freeze it and stop reconnect loops; allow manual reconnect”
- “When only one map remains, automatically ping the overlay to show it as a decider” (the current overlay already treats the last global pick as a decider map). fileciteturn44file13L1-L1
- “If draft ID changed, clear derived arrays *atomically* and re-render”
- “Project snapshots”: one keypress to timestamp-save the whole project state in case you need to roll back during production.

## Codex 5.3 development plan and master prompt

Below is a single “master prompt” you can paste into Codex 5.3. It is written to prevent the “муляж” outcome by forcing a strict feature-parity checklist, explicit acceptance criteria, and an incremental implementation order.

Use it as-is, then iterate only on the parts you decide to change (stack choice, naming, etc.).

```text
You are Codex 5.3. Your task is to rewrite an existing app from scratch with full feature parity and improved architecture.

REFERENCE REPO (READ-ONLY SOURCE OF TRUTH FOR CURRENT BEHAVIOR):
- overbait/Aoe4-Draft-Overlay_v02 (GitHub)
You MUST read and understand at minimum these files and their behavior:
- src/store/draftStore.ts
- src/store/customStorage.ts
- src/pages/TechnicalInterface.tsx
- src/pages/StudioInterface.tsx
- src/pages/BroadcastView.tsx
- src/types/draft.ts
- src/services/imageDb.ts
- vite.config.ts
- package.json
- src/components/studio/* (all overlay modules)

GOALS:
1) Preserve ALL functional capabilities from the current app, but redesign architecture to be stable and simpler.
2) Fix the core reliability issues: draft import resets/duplicates, inconsistent data across modules, and OBS incompatibility.
3) Provide OBS integration in one of:
   A) Browser Source overlay fed by a local backend (preferred),
   B) obs-websocket automation + vendor event updates for obs-browser,
   C) A transparent desktop window capture mode.

NON-NEGOTIABLE REQUIREMENTS:
- No stubs. No placeholder functions that “simulate” behavior.
- If something cannot be implemented immediately (e.g., AoE2CM spectate auto-discovery), you must implement a working fallback + mark it clearly.
- All state must have a single authoritative source. No cross-tab localStorage broadcasting.
- The overlay renderer must work inside OBS Browser Source.

STACK (RECOMMENDED; you can propose an alternative but must justify):
- Desktop wrapper: Tauri OR Electron (choose one; justify with stability and packaging).
- Local backend: run a localhost HTTP + WebSocket server that holds authoritative state and persists to SQLite.
- UI: React + TypeScript (can reuse patterns, but NOT reuse the old code directly).
- Storage:
  - SQLite for structured data (projects, layouts, presets, player profiles, cached drafts)
  - Filesystem for images (store background images as files with references), not IndexedDB.
- Overlay rendering:
  - Minimal React page served by the backend at /overlay/:canvasId
  - Transparent background (no body background), designed for OBS.

DELIVERABLES:
- A new repository layout with:
  /apps/desktop-ui
  /apps/overlay-renderer
  /apps/backend
  /packages/shared-types
  /packages/shared-draft-transform
- A single command to run in dev (one script) and a single executable build output per OS.
- A “feature parity matrix” markdown file listing every feature from the old app and where it exists in the new app.
- Automated tests for draft transformation logic (unit tests), plus smoke tests for backend endpoints.

FEATURE PARITY (MUST IMPLEMENT ALL):
A) Draft ingestion:
- Import civ draft and map draft by ID and/or URL parsing.
- Fetch AoE2CM draft JSON via HTTP.
- Live updates via websocket/socket.io (or polling fallback) without duplicates.
- Deterministic transformation:
  - raw options + raw events -> derived render state (picks/bans per player, global picks, map decider).
- Provide “draft status” and error detail visible in UI.

B) Match/session editor:
- Host/guest names
- Scores with increment/decrement
- Host/guest color selection
- Host/guest country flag selection with search and persistence
- Swap host/guest
- Save/load/delete named presets (now “Projects” or “Sessions”)
- Dirty detection (show “unsaved changes”)

C) Best-of series planner:
- Bo1/Bo3/Bo5/Bo7 selection
- List of game entries with:
  - visibility toggle
  - host civ, guest civ, map selection
  - winner toggle
- Map list management: allow manual map additions outside draft

D) Layout editor (Studio):
- Multiple canvases per layout
- Add/remove/rename canvas
- Canvas background color
- Add elements from toolbox
- Drag/resize elements in 1920x1080 coordinate system
- Element settings inspector:
  - scale
  - font family
  - show/hide text, glow
  - pivot locking and horizontal split offset where relevant
  - background element settings: image import + opacity + stretch mode
- Save/load/delete named layouts
- Import/export layouts JSON

E) Broadcast overlay renderer:
- Render a specific canvas by id
- Must support transparent background
- Must render all element types supported by current app:
  - ScoreOnly
  - NicknamesOnly
  - CountryFlags
  - ColorGlow
  - BoXSeriesOverview
  - MapPool
  - CivPool
  - PickedCivs
  - BannedCivs
  - Maps (picked+banned)
  - DeciderMap
  - BackgroundImage
- Animation behavior:
  - last action highlight / fade-in behavior
  - hidden ban reveal animation (if implemented in current app)

OBS INTEGRATION (MUST IMPLEMENT ONE FULLY, PREFER A):
Option A (preferred):
- Backend serves overlay at:
  http://127.0.0.1:<port>/overlay/<canvasId>
- UI shows a “Copy OBS URL” button per canvas.
- Provide an OBS help panel with recommended browser source settings (width=1920 height=1080 fps=30).

Option B (bonus):
- Integrate with obs-websocket v5:
  - Connect/disconnect to OBS
  - Create/update Browser Source inputs using CreateInput + SetInputSettings
  - Emit vendor events (obs-browser) to push state updates

Option C (optional alternative):
- Render overlay into a transparent always-on-top window with click-through toggle
- Document OBS capture settings (game capture allow transparency)

NEW FUNCTIONALITY (ADD BUT DO NOT BREAK CORE):
- “Spectate auto-discovery”:
  - A panel that monitors:
    https://aoe2cm.net/spectate
  - Because it is JS-only, implement:
    1) Preferred: call the JSON API used by the page (discover by devtools/network or by code analysis).
    2) Fallback: Playwright headless browser to extract draft IDs periodically.
  - Provide a filter: show only drafts involving players from a watchlist.
  - One-click “import both civ + map drafts” when available.

IMPLEMENTATION ORDER (STRICT):
1) Shared types + draft transformation library + unit tests.
2) Backend state model + persistence + HTTP/WebSocket API.
3) Overlay renderer that subscribes to render-state and can render one canvas.
4) Desktop UI: Projects + Draft import + Match editor.
5) Desktop UI: Series planner.
6) Desktop UI: Layout editor + element inspector.
7) OBS integration option A end-to-end.
8) Add spectate auto-discovery.

QUALITY GATES (DO NOT SKIP):
- Every major feature must include:
  - acceptance criteria
  - a short manual test script (“click here, expect this”)
- No React hooks inside loops or conditional branches.
- No localStorage-based cross-window sync.
- All derived render arrays must be computed in ONE place (backend transformer), not scattered across components.

OUTPUT FORMAT FOR EACH STEP:
- Explain what you implemented
- Show key files created/changed
- Provide how to run/test it locally
- Update the feature parity matrix
```

This prompt is intentionally strict to keep Codex from “forgetting” features like (a) the ID-based import model, (b) the separation of civ vs map drafts, and (c) the overlay module list that must be preserved. fileciteturn44file1L1-L1 fileciteturn44file10L1-L1
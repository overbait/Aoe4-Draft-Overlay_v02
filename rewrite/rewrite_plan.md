# Rewrite Plan (Phase 2)

## Ground rules
- The `/spec/*.md` files are the contract for feature parity and current behavior.
- No legacy refactors; all new work lives under the new monorepo structure.
- Overlay must work in OBS Browser Source without relying on localStorage or BroadcastChannel.
- Every milestone includes acceptance criteria and a manual test checklist.

## Milestone 0 — Stack selection + repo bootstrap (docs-only)
**Scope**
- Decide between Tauri+Rust or Electron+Node.
- Author API contract, UI spec, and parity checklist.

**Acceptance criteria**
- `/rewrite/ui_spec.md`, `/rewrite/api_contract.md`, `/rewrite/parity_checklist.md` are complete.
- Selected stack includes explicit packaging and OBS overlay strategy.

**Manual test checklist**
- Not applicable (docs-only milestone).

## Milestone 1 — Monorepo scaffold
**Scope**
- Create monorepo structure:
  - `/apps/desktop`
  - `/apps/backend`
  - `/apps/overlay`
  - `/packages/shared-types`
  - `/packages/draft-transform`
- Configure workspace tooling (package manager, scripts) and base TS configs.

**Acceptance criteria**
- `pnpm install` (or chosen package manager) installs all workspaces.
- `pnpm lint` (or equivalent) runs with no missing-workspace errors.
- `pnpm dev` stubs are wired but do **not** include placeholder runtime logic.

**Manual test checklist**
- `pnpm -w install`
- `pnpm -w lint`

## Milestone 2 — Shared types + draft-transform library (first real code)
**Scope**
- Implement shared types in `/packages/shared-types` using `/spec/data_model.md`.
- Implement draft-transform library in `/packages/draft-transform`:
  - Input: raw AoE2CM draft data
  - Output: normalized render state (picks/bans per player, global picks, status)
- Add unit tests covering event transforms, hidden bans, and decider map logic.

**Acceptance criteria**
- All transform tests pass.
- Transform output aligns with the derived arrays used in the legacy app.

**Manual test checklist**
- `pnpm -w test --filter draft-transform`

## Milestone 3 — Backend (authoritative state)
**Scope**
- Implement backend store with SQLite persistence.
- Implement HTTP API and WebSocket/SSE stream per `/rewrite/api_contract.md`.
- Implement draft ingestion:
  - HTTP fetch to AoE2CM
  - Socket.IO subscription for live updates
  - Deterministic transform via `/packages/draft-transform`

**Acceptance criteria**
- Backend can import a civ or map draft by ID/URL.
- Backend produces deterministic render state snapshots.
- WebSocket/SSE emits state updates on changes.

**Manual test checklist**
- `pnpm -w dev --filter backend`
- Use curl to import a draft and confirm response shape.
- Connect a WS client and observe updates.

## Milestone 4 — Overlay renderer
**Scope**
- Implement `/apps/overlay` as a minimal transparent UI.
- Subscribe to backend state stream (WS/SSE).
- Render a single canvas by ID and render all element types.

**Acceptance criteria**
- Overlay renders with transparent background.
- Overlay renders every element type listed in `/spec/data_model.md`.
- Overlay updates on live state changes without localStorage sync.

**Manual test checklist**
- Open overlay URL in browser and verify transparency.
- Trigger state changes from backend and observe updates.

## Milestone 5 — Desktop UI (single window)
**Scope**
- Build desktop UI matching `/rewrite/ui_spec.md`.
- Implement projects, draft import, match editor, series planner, layout editor.
- Integrate backend API for state control and persistence.

**Acceptance criteria**
- All FeatureIDs in `/rewrite/parity_checklist.md` are implemented.
- UI can create/edit projects and control draft ingest.

**Manual test checklist**
- Launch desktop app.
- Import civ + map drafts; verify UI updates.
- Save project, reopen, ensure state restores.

## Milestone 6 — OBS integration
**Scope**
- Provide overlay URL per canvas (copy button).
- Document OBS Browser Source settings (1920×1080, FPS).
- Optional: OBS websocket automation (stretch goal).

**Acceptance criteria**
- OBS Browser Source displays live overlay with data from backend.
- No localStorage sync required for overlay updates.

**Manual test checklist**
- Add Browser Source in OBS pointing to overlay URL.
- Verify updates when changing state in desktop app.

## Milestone 7 — Spectate auto-discovery (new feature)
**Scope**
- Implement spectate discovery per spec:
  - Prefer direct JSON endpoint
  - Fallback to headless browser
- Watchlist filtering + one-click import.

**Acceptance criteria**
- Drafts are discovered and importable.
- Watchlist filters work reliably.

**Manual test checklist**
- Enable discovery and verify imported drafts appear.

## Stack proposals and final choice
### Option A — Tauri + Rust backend + React UI + SQLite
**Packaging**
- Native installer per OS via Tauri tooling.
- Smaller binary size, lower runtime overhead.

**OBS overlay strategy**
- Backend runs local HTTP + WS/SSE server.
- Overlay served as `http://127.0.0.1:<port>/overlay/:canvasId`.

**Risk areas**
- Rust ecosystem friction for rapid UI iteration.
- Cross‑platform file/asset handling and SQLite migrations.
- Socket.IO client/server alignment in Rust.

### Option B — Electron + Node backend + React UI + SQLite
**Packaging**
- Electron builder/forge for per‑OS bundles.
- Larger binary footprint but faster JS iteration.

**OBS overlay strategy**
- Node backend hosts local HTTP + WS/SSE server.
- Overlay served as `http://127.0.0.1:<port>/overlay/:canvasId`.

**Risk areas**
- Larger bundle size.
- Ensuring secure local server defaults.

### Final choice: **Option B (Electron + Node)**
**Justification**
- Fastest path to parity with existing TS/React codebase.
- Easier reuse of AoE2CM draft ingestion logic (Axios, Socket.IO) already in JS.
- Lower integration risk for real‑time WS updates and overlay rendering.

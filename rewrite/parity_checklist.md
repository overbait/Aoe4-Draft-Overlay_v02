# Parity Checklist (FeatureID → Implementation Plan)

> Source of truth: `/spec/feature_matrix.md`
>
> **Milestone 4 status:** overlay + desktop UI implemented with OBS URL workflow (F-008 through F-040). Remaining FeatureIDs are pending.

| FeatureID | Implementation location (new repo) | How to verify |
| --- | --- | --- |
| F-001 | ✅ `/apps/backend` draft connect API | `curl -X POST /api/projects/:id/drafts/connect` (civ) |
| F-002 | ✅ `/apps/backend` draft connect API | `curl -X POST /api/projects/:id/drafts/connect` (map) |
| F-003 | ✅ `/packages/shared-types` + `/packages/draft-transform` (transform module) | `pnpm -w test --filter draft-transform` |
| F-004 | ✅ `/apps/backend` AoE2CM HTTP client | `curl /api/projects/:id/render-state` after connect |
| F-005 | ✅ `/apps/backend` Socket.IO listener | Observe `/sse` render_state updates |
| F-006 | ✅ `/apps/backend` reconnect policy | `POST /api/projects/:id/drafts/reconnect` |
| F-007 | ✅ `/packages/draft-transform` (transform + tests) | `pnpm -w test --filter draft-transform` |
| F-008 | ✅ `/apps/desktop` Match panel | Update names and confirm overlay text |
| F-009 | ✅ `/apps/desktop` Match panel + backend state | Increment/decrement and confirm overlay score |
| F-010 | ✅ `/apps/desktop` Match panel | Swap sides (manual edits) and verify fields |
| F-011 | ✅ `/apps/desktop` Match panel | Choose colors and verify overlay glow elements |
| F-012 | ✅ `/apps/desktop` Match panel + backend persistence | Select flags and verify overlay flags |
| F-013 | ✅ `/apps/desktop` Projects panel + backend | Save/load/delete projects |
| F-014 | ✅ `/apps/desktop` Projects panel | Dirty indicator toggles on edits |
| F-015 | ✅ `/apps/desktop` Series panel + backend | Set format and verify game list |
| F-016 | ✅ `/apps/desktop` Series panel | Set winner and confirm scores update |
| F-017 | ✅ `/apps/desktop` Series panel | Toggle visibility and verify overlay |
| F-018 | ✅ `/apps/desktop` Series panel | Add manual map and verify selection list |
| F-019 | ✅ `/apps/desktop` Layout panel | Add/switch canvases |
| F-020 | ✅ `/apps/desktop` Layout panel + backend | Export layout, re-import, verify canvases |
| F-021 | ✅ `/apps/desktop` Layout panel | Set canvas background color and verify overlay |
| F-022 | ✅ `/apps/desktop` Layout panel | Toggle broadcast border and verify preview |
| F-023 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add ScoreOnly and verify render |
| F-024 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add NicknamesOnly and verify render |
| F-025 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add BoXSeriesOverview and verify render |
| F-026 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add CountryFlags and verify render |
| F-027 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add ColorGlowElement and verify render |
| F-028 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add MapPoolElement and verify render |
| F-029 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add CivPoolElement and verify render |
| F-030 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add PickedCivs and verify render |
| F-031 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add BannedCivs and verify render |
| F-032 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add Maps and verify render |
| F-033 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add DeciderMap and verify title/glow |
| F-034 | ✅ `/apps/desktop` Layout panel + `/apps/overlay` | Add BackgroundImage and verify render |
| F-035 | ✅ `/apps/desktop` Layout panel | Adjust element settings and verify changes |
| F-036 | ✅ `/apps/desktop` Layout panel | Toggle showText/showGlow and verify render |
| F-037 | ✅ `/apps/desktop` Layout panel | Toggle BoX civ/map title settings |
| F-038 | ✅ `/apps/desktop` Layout panel | Change decider map title/glow and verify |
| F-039 | ✅ `/apps/desktop` Layout panel | Drag/resize elements and verify positions |
| F-040 | ✅ `/apps/overlay` renderer | Load overlay for canvas ID and verify render |
| F-041 | ✅ `/apps/backend` SSE stream (`/sse`) | Observe render_state events |
| F-042 | `/apps/backend` HTTP proxy (if needed) | Confirm AoE2CM calls without CORS issues |

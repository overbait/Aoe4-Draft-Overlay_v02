# Data Model (Current App)

## Core types
### Aoe2cmRawDraftData
Represents raw AoE2CM draft JSON responses, including preset actions, options, and event history. These fields are the source of truth for draft transforms in the store.【F:src/types/draft.ts†L24-L55】

### SingleDraftData
Normalized draft output (host/guest names plus civ/map pick/ban arrays). This is the transformation target for the HTTP fetch path and is used to update store state for civ/map drafts.【F:src/types/draft.ts†L34-L55】

### StudioElement
Represents any overlay element placed on a canvas, including position, size, font, scale, background/border styles, and element‑specific settings such as glow or decider map title. The `StudioElement` type includes optional fields for all element-specific settings and is used across studio and broadcast views.【F:src/types/draft.ts†L57-L92】

### StudioCanvas / SavedStudioLayout
A `StudioCanvas` is a named canvas with an ordered list of `StudioElement`s and optional background/border settings. A `SavedStudioLayout` is a named grouping of canvases with a saved active canvas ID.【F:src/types/draft.ts†L94-L106】

### CombinedDraftState
The store schema combines draft IDs and status, normalized pick/ban arrays, session metadata, layout state, preset lists, and animation state tracking (last action, revealed bans).【F:src/types/draft.ts†L68-L93】【F:src/store/draftStore.ts†L68-L118】

## Store initial state (selected highlights)
The store initializes with default player names, empty pick/ban arrays, draft status fields, layout/canvas state, and presets. It also tracks flags, colors, and derived draft indicators like `draftIsLikelyFinished` and `isNewSessionAwaitingFirstDraft`.【F:src/store/draftStore.ts†L68-L118】

## Draft transformation and derived arrays
### Transform from raw events → derived arrays
The `transformRawDataToSingleDraft` helper reads `raw.events` and translates them into civ/map pick and ban arrays based on action type and player. This logic is used by the HTTP fetch path for draft import and determines the derived render state used throughout the UI.【F:src/store/draftStore.ts†L116-L214】

### Draft event handling via Socket.IO
When a live draft is connected, `draft_state` events are reprocessed into temp arrays and reconciled with the current store state, updating picks/bans and options and recalculating the BoX series games when changes occur.【F:src/store/draftStore.ts†L360-L520】

## Persistence model (localStorage)
The persist layer writes a curated subset of store state to localStorage under `aoe4-draft-overlay-storage-v1`, including:
- Draft IDs and pick/ban arrays
- Session metadata (names, scores, colors, flags)
- BoX series settings
- Layouts, canvases, and selected element
- Draft options and socket status metadata
This persisted state is the basis for cross‑tab synchronization.【F:src/store/draftStore.ts†L2360-L2449】

## Asset storage model
Background images are stored in IndexedDB (`Aoe4LayoutImages`) and referenced in `StudioElement.imageUrl` by a generated key (e.g., `bg-...`). The app saves, loads, and deletes images through `imageDb.ts` with `idb` APIs.【F:src/services/imageDb.ts†L1-L112】

## Overlay element inventory (types + defaults)
The overlay element types are instantiated in `addStudioElement` with defaults and rendered in BroadcastView by `element.type`. This list is the authoritative set of supported element types in the current app:
- `BackgroundImage`
- `BoXSeriesOverview`
- `ScoreOnly`
- `NicknamesOnly`
- `CountryFlags`
- `ColorGlowElement`
- `MapPoolElement`
- `PickedCivs`
- `BannedCivs`
- `Maps`
- `DeciderMap`
- `CivPoolElement`

Each is configured by `StudioElement` fields (size, position, scale, fonts, pivot options) plus element‑specific properties like `showGlow`, `showText`, `deciderMapTitle`, and `glowColor` where applicable.【F:src/store/draftStore.ts†L1701-L1936】【F:src/pages/BroadcastView.tsx†L120-L210】【F:src/types/draft.ts†L57-L92】

# UI Specification (Single Desktop Window)

## Layout overview
Single-window desktop UI with a left navigation rail and a main content area. All functionality from Technical + Studio + Broadcast is consolidated into one cohesive application view.

```
+--------------------------------------------------------------+
| Sidebar                                                     |
| - Projects                                                  |
| - Drafts                                                    |
| - Match                                                     |
| - Series                                                    |
| - Layout                                                    |
| - OBS                                                      |
+---------------------------+----------------------------------+
| Main content area                                           |
| (active section panel)                                     |
+--------------------------------------------------------------+
```

## Global UI rules
- Always show project name + save state indicator (dirty vs saved).
- All changes write to the backend authoritative store.
- The overlay preview is a separate renderer (embedded preview or external browser) but never uses localStorage sync.

## Section specs
### 1) Projects
**Purpose**: Create/open/save/export full project state.

**Key controls**
- Create new project
- Open project
- Duplicate project
- Export/import project bundle
- Project metadata (name, last updated)

**Primary flows**
- Create → auto-save initial empty project.
- Duplicate → clone all draft settings, layouts, and metadata.
- Export → JSON/ZIP bundle from backend.

### 2) Drafts
**Purpose**: Import civ + map drafts and monitor live status.

**Key controls**
- Civ draft ID/URL input + connect/reconnect
- Map draft ID/URL input + connect/reconnect
- Status indicators (connecting/live/completed/error)
- Event log and error details
- “Reset draft parsing cache”
- Spectate auto‑discovery panel (Phase 7)

**Primary flows**
- Enter ID → connect → view status + picks/bans update.
- Reconnect → restarts live ingest and refreshes arrays.

### 3) Match
**Purpose**: Edit session metadata that drives overlay elements.

**Key controls**
- Host/guest names
- Scores (increment/decrement)
- Colors
- Country flags with search
- Swap sides

**Primary flows**
- Update names/colors/flags → overlay updates immediately.
- Swap → all dependent fields swap atomically.

### 4) Series
**Purpose**: Best‑of series planner.

**Key controls**
- Select format (bo1/bo3/bo5/bo7)
- Game entries:
  - Map selection
  - Host civ / guest civ selection
  - Winner toggle
  - Visibility toggle
- Manual map list manager

**Primary flows**
- Draft picks auto-fill list of available maps/civs.
- Manual maps can be added and used in games.

### 5) Layout
**Purpose**: Full layout editor (Studio replacement).

**Key controls**
- Canvas list (add, rename, remove)
- Background color per canvas
- Element toolbox (all element types)
- Drag/resize with pivot lock
- Properties panel per element
- Save/load named layouts
- Import/export layout JSON
- Preview toggle (broadcast border)

**Primary flows**
- Add element → drag/resize → edit settings.
- Save layout → assign name → available in list.

### 6) OBS
**Purpose**: Overlay delivery and integration.

**Key controls**
- Copy overlay URL per canvas
- OBS setup guide (resolution, FPS, transparency)
- Optional: obs‑websocket connect/disconnect

**Primary flows**
- Copy URL → paste into OBS Browser Source.
- Verify overlay updates live when state changes.

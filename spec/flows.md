# Data Flows (Current App)

## 1) Draft import → store → render
### HTTP import path
1. Operator enters a draft ID/URL in the Technical Interface and triggers `connectToDraft` for civ or map drafts.【F:src/pages/TechnicalInterface.tsx†L22-L60】
2. `connectToDraft` extracts the ID (supports AoE2CM draft URLs and observer URLs) and attempts HTTP fetch from `https://aoe2cm.net/api/draft/:id` via Axios.【F:src/store/draftStore.ts†L1240-L1394】
3. The HTTP response is normalized by `transformRawDataToSingleDraft`, producing pick/ban arrays and host/guest names, which are then stored in the Zustand state for civ or map context.【F:src/store/draftStore.ts†L116-L214】【F:src/store/draftStore.ts†L1340-L1436】
4. After successful import, the store recalculates BoX series game slots based on current picks and maps.【F:src/store/draftStore.ts†L1396-L1426】

### WebSocket live update path (Socket.IO)
1. If the draft response indicates it is ongoing, the store attempts a Socket.IO connection to `wss://aoe2cm.net` with `draftId` in the query string.【F:src/store/draftStore.ts†L312-L352】【F:src/store/draftStore.ts†L1429-L1446】
2. `draft_state` events update names, draft options, and reprocess event history into pick/ban arrays while attempting to avoid duplicates by checking existing entries.【F:src/store/draftStore.ts†L360-L520】
3. If the connection drops for specific error reasons, the store triggers an HTTP fallback by re-calling `connectToDraft` after a delay.【F:src/store/draftStore.ts†L1240-L1260】

## 2) Store → Studio rendering
1. The Studio Interface reads `currentCanvases`, `activeCanvasId`, and `selectedElementId` from the store to render the active 1920×1080 canvas.【F:src/pages/StudioInterface.tsx†L1-L120】
2. Each element is rendered through its corresponding component, and the user can drag/resize elements. Updates are written back to the store via `updateStudioElementPosition`, `updateStudioElementSize`, and `updateStudioElementSettings`.【F:src/pages/StudioInterface.tsx†L120-L220】
3. Layouts are saved as `SavedStudioLayout` objects in store state and can be exported/imported through JSON payloads.【F:src/pages/StudioInterface.tsx†L1-L120】

## 3) Store → Broadcast rendering
1. BroadcastView selects a canvas by the `targetCanvasId` parameter, falling back to the store’s active canvas or first canvas if needed.【F:src/pages/BroadcastView.tsx†L46-L104】
2. Each element is rendered at its stored position and scale and mapped to a known overlay component by its `type` field.【F:src/pages/BroadcastView.tsx†L120-L220】
3. The broadcast view listens for a `newSessionDataLoaded` event and reloads the page to force full rehydrate when a new session is created in the store.【F:src/pages/BroadcastView.tsx†L21-L44】

## 4) Cross-tab synchronization flow
1. The store persists a subset of state to localStorage via `zustand/persist` (`aoe4-draft-overlay-storage-v1`).【F:src/store/draftStore.ts†L2360-L2449】
2. `customStorage` wraps localStorage writes and emits cross-tab updates through a BroadcastChannel named `zustand_store_sync_channel`.
3. Other tabs listen for BroadcastChannel messages and use `applyStateFromLocalStorage` to selectively rehydrate from localStorage into the store state, including draft picks/bans and layouts.【F:src/store/customStorage.ts†L1-L200】
4. BroadcastView also listens on the same BroadcastChannel for `NEW_PRESET_CREATED` events to trigger a reload without manual refresh.【F:src/pages/BroadcastView.tsx†L46-L82】

## 5) Asset flow for Background Image
1. Studio uploads a background image, which is stored in IndexedDB under `Aoe4LayoutImages` with a generated key (e.g., `bg-...`).【F:src/services/imageDb.ts†L1-L66】
2. `StudioElement.imageUrl` stores the key to retrieve the file during rendering; images are fetched from IndexedDB at render time.【F:src/services/imageDb.ts†L67-L112】

## 6) Dev server proxy for API calls
During local development, Vite proxies `/api` requests to `https://aoe2cm.net`, which allows the app to call `/api/draft/:id` without CORS issues when running the dev server.【F:vite.config.ts†L1-L27】

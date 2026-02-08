# OBS Gap Analysis (Current App)

## Current overlay delivery model
The Broadcast View is a browser page that renders from the same persisted Zustand store as the Technical/Studio views. It relies on the store’s localStorage persistence and BroadcastChannel‑based synchronization to share state across tabs, and will reload when it sees events that indicate a new session or preset change.【F:src/pages/BroadcastView.tsx†L21-L82】【F:src/store/draftStore.ts†L2360-L2449】【F:src/store/customStorage.ts†L1-L200】

## Why OBS Browser Source does not receive state
OBS Browser Source runs in a separate embedded browser context, which does **not** share the same localStorage or BroadcastChannel namespace as the operator’s Chrome/Edge session. This codebase does not provide a backend service or networked state API for the overlay to subscribe to. The current architecture assumes shared localStorage and cross‑tab BroadcastChannel events, which only work within the same browser profile and origin.【F:src/store/draftStore.ts†L2360-L2449】【F:src/store/customStorage.ts†L1-L200】

## Specific architectural gaps
1. **No external state server for overlays**: The overlay renders exclusively from in‑browser persisted state (`zustand/persist`) and shared localStorage. There is no HTTP/WebSocket endpoint to feed OBS directly with updated render state.【F:src/store/draftStore.ts†L2360-L2449】
2. **Cross‑tab sync assumes a shared browser context**: The `customStorage` BroadcastChannel + storage event loop is explicitly tab‑to‑tab and tied to the same localStorage namespace, which OBS does not share with the operator browser.【F:src/store/customStorage.ts†L1-L200】
3. **OBS overlay is not a dedicated view with an external state input**: BroadcastView uses the same store and only reacts to `newSessionDataLoaded` and preset messages coming from the BroadcastChannel, which again requires a shared browser context.【F:src/pages/BroadcastView.tsx†L21-L82】

## Requirements to make OBS integration work (evidence‑based)
Based on the current design, OBS needs one of the following to work reliably:
- A **local backend** that exposes the current render state via HTTP/WebSocket, so OBS can subscribe without relying on localStorage or BroadcastChannel.
- A mechanism that **pushes state** into the OBS Browser Source (e.g., custom events or a web socket), because the current design never sends state across processes.

These requirements are implied by the current dependency on localStorage and BroadcastChannel for state propagation, which are not accessible to OBS Browser Source.【F:src/store/customStorage.ts†L1-L200】【F:src/store/draftStore.ts†L2360-L2449】

## Desync/reset/duplicate risk factors (code‑evidenced)
1. **Cross‑tab replication on localStorage**: The app rehydrates state across tabs by reading and writing to localStorage on every persisted change, then selectively applying fields via `applyStateFromLocalStorage`. This is inherently race‑prone when multiple tabs update the same fields concurrently, causing last‑write‑wins overwrites or partial merges across canvases and draft arrays.【F:src/store/customStorage.ts†L1-L200】
2. **Multiple browser contexts with shared flags**: Each view sets a global `IS_*` flag to identify its context, indicating the system is explicitly aware of multi‑context synchronization complexity. These flags do not prevent state drift across contexts, only annotate them.【F:src/pages/TechnicalInterface.tsx†L120-L140】【F:src/pages/StudioInterface.tsx†L40-L70】【F:src/pages/BroadcastView.tsx†L21-L44】
3. **Derived name normalization differences**: The store normalizes option names via `getOptionNameFromStore`, but `MapPoolElement` includes separate, partially duplicated normalization logic and comments about mismatch risk. This creates opportunities for pick/ban arrays to diverge from the map pool display if naming rules differ or draft options change shape.【F:src/store/draftStore.ts†L250-L284】【F:src/components/studio/MapPoolElement.tsx†L110-L178】
4. **Rules‑of‑hooks violations in pool elements**: `useDraftAnimation` is called inside `.map(...)` loops in both map and civ pool elements, which violates React’s Rules of Hooks and can cause nondeterministic render issues when list lengths change during updates.【F:src/components/studio/MapPoolElement.tsx†L212-L256】【F:src/components/studio/CivPoolElement.tsx†L220-L265】

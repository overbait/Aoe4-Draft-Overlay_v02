# Backend API Contract

> All payloads are JSON. WebSocket/SSE events mirror the same render-state schema.

## Base concepts
- **Project**: a complete unit of state (drafts + match + series + layouts + settings).
- **RenderState**: normalized overlay data derived from raw drafts and project settings.

## HTTP API
### Projects
- `GET /api/projects` → list projects
- `POST /api/projects` → create new project
- `GET /api/projects/:projectId` → get full project
- `PUT /api/projects/:projectId` → replace project
- `PATCH /api/projects/:projectId` → partial update
- `DELETE /api/projects/:projectId`

### Drafts
- `POST /api/projects/:projectId/drafts/connect`
  - **Body**: `{ "type": "civ"|"map", "draftIdOrUrl": "..." }`
  - **Response**: `{ "status": "connecting"|"connected"|"error", "message"?: "..." }`

- `POST /api/projects/:projectId/drafts/disconnect`
  - **Body**: `{ "type": "civ"|"map" }`

- `POST /api/projects/:projectId/drafts/reconnect`
  - **Body**: `{ "type": "civ"|"map" }`

### Layouts
- `GET /api/projects/:projectId/layouts` → list layouts
- `POST /api/projects/:projectId/layouts` → save current layout (name + canvases)
- `PUT /api/projects/:projectId/layouts/:layoutId` → update layout name/contents
- `DELETE /api/projects/:projectId/layouts/:layoutId`
- `POST /api/projects/:projectId/layouts/import` → import layout JSON
- `GET /api/projects/:projectId/layouts/export` → export layout JSON

### Overlay
- `GET /overlay/:projectId/:canvasId` → overlay HTML/JS bundle
- `GET /api/projects/:projectId/render-state` → current render-state snapshot

## WebSocket/SSE
### `GET /ws` or `GET /sse`
Events broadcast whenever render state changes.

**Event: `render_state`**
```json
{
  "projectId": "...",
  "timestamp": 1700000000000,
  "renderState": {
    "session": {
      "hostName": "...",
      "guestName": "...",
      "scores": { "host": 0, "guest": 0 },
      "hostColor": "#RRGGBB",
      "guestColor": "#RRGGBB",
      "hostFlag": "us",
      "guestFlag": "de"
    },
    "draft": {
      "civ": {
        "picksHost": [], "bansHost": [],
        "picksGuest": [], "bansGuest": [],
        "picksGlobal": []
      },
      "map": {
        "picksHost": [], "bansHost": [],
        "picksGuest": [], "bansGuest": [],
        "picksGlobal": [], "bansGlobal": []
      },
      "status": {
        "civ": "disconnected|connecting|connected|live|error",
        "map": "disconnected|connecting|connected|live|error"
      }
    },
    "series": {
      "format": "bo1|bo3|bo5|bo7|null",
      "games": [
        { "map": "...", "hostCiv": "...", "guestCiv": "...", "winner": "host|guest|null", "isVisible": true }
      ]
    },
    "layouts": {
      "activeCanvasId": "...",
      "canvases": [
        {
          "id": "...",
          "name": "...",
          "backgroundColor": "transparent",
          "showBroadcastBorder": true,
          "elements": [
            {
              "id": "...",
              "type": "ScoreOnly|NicknamesOnly|BoXSeriesOverview|CountryFlags|ColorGlowElement|MapPoolElement|CivPoolElement|PickedCivs|BannedCivs|Maps|DeciderMap|BackgroundImage",
              "position": { "x": 0, "y": 0 },
              "size": { "width": 0, "height": 0 },
              "scale": 1,
              "fontFamily": "...",
              "textColor": "...",
              "showGlow": true,
              "showText": true,
              "deciderMapTitle": "Decider Map",
              "glowColor": "#FFFF00"
            }
          ]
        }
      ]
    }
  }
}
```

## Error model
Standard error payload:
```json
{ "error": { "code": "...", "message": "...", "details": {} } }
```

import express from 'express';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import type {
  Aoe2cmRawDraftData,
  ConnectionStatus,
  SavedStudioLayout,
  StudioCanvas,
} from '@aoe4/shared-types';
import { transformRawDataToSingleDraft } from '@aoe4/draft-transform';
import {
  deleteProjectRow,
  getProjectRow,
  insertProject,
  listProjectRows,
  updateProjectRow,
} from './db';

const API_BASE = 'https://aoe2cm.net/api';
const SOCKET_BASE = 'wss://aoe2cm.net';
const DEFAULT_HOST_NAME = 'Player 1';
const DEFAULT_GUEST_NAME = 'Player 2';

interface DraftState {
  id: string | null;
  status: ConnectionStatus;
  error: string | null;
  data: ReturnType<typeof transformRawDataToSingleDraft> | null;
}

interface ProjectState {
  id: string;
  name: string;
  session: {
    hostName: string;
    guestName: string;
    scores: { host: number; guest: number };
    hostColor: string | null;
    guestColor: string | null;
    hostFlag: string | null;
    guestFlag: string | null;
  };
  drafts: {
    civ: DraftState;
    map: DraftState;
  };
  series: {
    format: 'bo1' | 'bo3' | 'bo5' | 'bo7' | null;
    games: Array<{
      map: string | null;
      hostCiv: string | null;
      guestCiv: string | null;
      winner: 'host' | 'guest' | null;
      isVisible: boolean;
    }>;
  };
  layouts: {
    activeCanvasId: string | null;
    canvases: StudioCanvas[];
    savedLayouts: SavedStudioLayout[];
  };
}

const defaultProjectState = (id: string, name: string): ProjectState => ({
  id,
  name,
  session: {
    hostName: DEFAULT_HOST_NAME,
    guestName: DEFAULT_GUEST_NAME,
    scores: { host: 0, guest: 0 },
    hostColor: null,
    guestColor: null,
    hostFlag: null,
    guestFlag: null,
  },
  drafts: {
    civ: { id: null, status: 'disconnected', error: null, data: null },
    map: { id: null, status: 'disconnected', error: null, data: null },
  },
  series: {
    format: null,
    games: [],
  },
  layouts: {
    activeCanvasId: null,
    canvases: [],
    savedLayouts: [],
  },
});

const projectStateFromRow = (row: { state: string }): ProjectState =>
  JSON.parse(row.state) as ProjectState;

const persistProjectState = async (state: ProjectState) => {
  const payload = JSON.stringify(state);
  await updateProjectRow(state.id, state.name, payload);
};

const ensureProject = async (id: string, name?: string): Promise<ProjectState> => {
  const existing = await getProjectRow(id);
  if (existing) {
    return projectStateFromRow(existing);
  }
  const resolvedName = name || `Project ${id.substring(0, 6)}`;
  const state = defaultProjectState(id, resolvedName);
  const now = new Date().toISOString();
  await insertProject({ id, name: resolvedName, state: JSON.stringify(state), created_at: now, updated_at: now });
  return state;
};

const extractDraftId = (draftIdOrUrl: string): string | null => {
  try {
    if (draftIdOrUrl.startsWith('http://') || draftIdOrUrl.startsWith('https://')) {
      const urlObj = new URL(draftIdOrUrl);
      if (urlObj.hostname.includes('aoe2cm.net')) {
        const draftMatch = /\/draft\/([a-zA-Z0-9]+)/.exec(urlObj.pathname);
        if (draftMatch?.[1]) return draftMatch[1];
        const observerMatch = /\/observer\/([a-zA-Z0-9]+)/.exec(urlObj.pathname);
        if (observerMatch?.[1]) return observerMatch[1];
      }
      const segments = urlObj.pathname.split('/');
      const candidate = segments.pop() || segments.pop();
      if (candidate && /^[a-zA-Z0-9_-]+$/.test(candidate) && candidate.length > 3) return candidate;
      const draftParam = urlObj.searchParams.get('draftId') || urlObj.searchParams.get('id');
      if (draftParam) return draftParam;
    }
    if (/^[a-zA-Z0-9_-]+$/.test(draftIdOrUrl) && draftIdOrUrl.length > 3) return draftIdOrUrl;
    return null;
  } catch {
    if (/^[a-zA-Z0-9_-]+$/.test(draftIdOrUrl) && draftIdOrUrl.length > 3) return draftIdOrUrl;
    return null;
  }
};

const sockets = new Map<string, Socket>();

type DraftType = 'civ' | 'map';

const socketKey = (projectId: string, draftType: DraftType) => `${projectId}:${draftType}`;

const buildRenderState = (state: ProjectState) => ({
  projectId: state.id,
  timestamp: Date.now(),
  renderState: {
    session: state.session,
    draft: {
      civ: state.drafts.civ.data
        ? {
            picksHost: state.drafts.civ.data.civPicksHost,
            bansHost: state.drafts.civ.data.civBansHost,
            picksGuest: state.drafts.civ.data.civPicksGuest,
            bansGuest: state.drafts.civ.data.civBansGuest,
            picksGlobal: state.drafts.civ.data.mapPicksGlobal,
          }
        : {
            picksHost: [],
            bansHost: [],
            picksGuest: [],
            bansGuest: [],
            picksGlobal: [],
          },
      map: state.drafts.map.data
        ? {
            picksHost: state.drafts.map.data.mapPicksHost,
            bansHost: state.drafts.map.data.mapBansHost,
            picksGuest: state.drafts.map.data.mapPicksGuest,
            bansGuest: state.drafts.map.data.mapBansGuest,
            picksGlobal: state.drafts.map.data.mapPicksGlobal,
            bansGlobal: state.drafts.map.data.mapBansGlobal,
          }
        : {
            picksHost: [],
            bansHost: [],
            picksGuest: [],
            bansGuest: [],
            picksGlobal: [],
            bansGlobal: [],
          },
      status: {
        civ: state.drafts.civ.status,
        map: state.drafts.map.status,
      },
    },
    series: state.series,
    layouts: {
      activeCanvasId: state.layouts.activeCanvasId,
      canvases: state.layouts.canvases.map(canvas => ({
        id: canvas.id,
        name: canvas.name,
        backgroundColor: canvas.backgroundColor ?? 'transparent',
        showBroadcastBorder: canvas.showBroadcastBorder ?? true,
        elements: canvas.layout,
      })),
    },
  },
});

const subscribers = new Set<express.Response>();

const broadcastRenderState = (state: ProjectState) => {
  const payload = JSON.stringify(buildRenderState(state));
  for (const res of subscribers) {
    res.write(`event: render_state\n`);
    res.write(`data: ${payload}\n\n`);
  }
};

const updateProject = async (state: ProjectState) => {
  await persistProjectState(state);
  broadcastRenderState(state);
};

const connectSocket = (project: ProjectState, draftType: DraftType, draftId: string) => {
  const key = socketKey(project.id, draftType);
  const existing = sockets.get(key);
  if (existing) {
    existing.disconnect();
  }

  const socket = io(SOCKET_BASE, {
    path: '/socket.io/',
    query: { draftId, EIO: '4' },
    transports: ['websocket'],
    reconnection: true,
  });

  socket.on('connect', async () => {
    project.drafts[draftType].status = 'live';
    await updateProject(project);
  });

  socket.on('draft_state', async (data: Aoe2cmRawDraftData) => {
    if (!data || typeof data !== 'object') return;
    const normalized = transformRawDataToSingleDraft(data);
    project.drafts[draftType] = {
      id: draftId,
      status: 'live',
      error: null,
      data: normalized,
    };
    if (data.nameHost) project.session.hostName = data.nameHost;
    if (data.nameGuest) project.session.guestName = data.nameGuest;
    await updateProject(project);
  });

  socket.on('connect_error', async (err: Error) => {
    project.drafts[draftType].status = 'error';
    project.drafts[draftType].error = err.message;
    await updateProject(project);
  });

  socket.on('disconnect', async () => {
    if (project.drafts[draftType].status === 'live') {
      project.drafts[draftType].status = 'reconnecting';
      await updateProject(project);
    }
  });

  sockets.set(key, socket);
};

const app = express();
app.use(express.json());

app.get('/api/projects', async (_req, res) => {
  const rows = await listProjectRows();
  res.json(rows.map(row => ({ id: row.id, name: row.name, updatedAt: row.updated_at })));
});

app.post('/api/projects', async (req, res) => {
  const id = uuidv4();
  const name = typeof req.body?.name === 'string' ? req.body.name : `Project ${id.substring(0, 6)}`;
  const state = defaultProjectState(id, name);
  const now = new Date().toISOString();
  await insertProject({ id, name, state: JSON.stringify(state), created_at: now, updated_at: now });
  res.status(201).json(state);
});

app.get('/api/projects/:projectId', async (req, res) => {
  const row = await getProjectRow(req.params.projectId);
  if (!row) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    return;
  }
  res.json(projectStateFromRow(row));
});

app.put('/api/projects/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const state = req.body as ProjectState;
  if (!state?.id || state.id !== projectId) {
    res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'Project payload missing id' } });
    return;
  }
  const existing = await getProjectRow(projectId);
  if (!existing) {
    const now = new Date().toISOString();
    await insertProject({ id: projectId, name: state.name, state: JSON.stringify(state), created_at: now, updated_at: now });
  } else {
    await updateProjectRow(projectId, state.name, JSON.stringify(state));
  }
  res.json(state);
});

app.patch('/api/projects/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const row = await getProjectRow(projectId);
  if (!row) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    return;
  }
  const state = projectStateFromRow(row);
  const payload = req.body as Partial<ProjectState>;
  const merged = {
    ...state,
    ...payload,
    session: { ...state.session, ...payload.session },
    drafts: { ...state.drafts, ...payload.drafts },
    series: { ...state.series, ...payload.series },
    layouts: { ...state.layouts, ...payload.layouts },
  } as ProjectState;
  await updateProjectRow(projectId, merged.name, JSON.stringify(merged));
  broadcastRenderState(merged);
  res.json(merged);
});

app.delete('/api/projects/:projectId', async (req, res) => {
  await deleteProjectRow(req.params.projectId);
  res.status(204).send();
});

app.post('/api/projects/:projectId/drafts/connect', async (req, res) => {
  const { projectId } = req.params;
  const draftType = req.body?.type as DraftType;
  const draftIdOrUrl = req.body?.draftIdOrUrl as string;
  if (draftType !== 'civ' && draftType !== 'map') {
    res.status(400).json({ error: { code: 'INVALID_TYPE', message: 'Draft type must be civ or map' } });
    return;
  }
  const extractedId = extractDraftId(draftIdOrUrl || '');
  if (!extractedId) {
    res.status(400).json({ status: 'error', message: 'Invalid draft ID or URL provided.' });
    return;
  }

  const project = await ensureProject(projectId);
  project.drafts[draftType] = { id: extractedId, status: 'connecting', error: null, data: null };
  await updateProject(project);

  try {
    const response = await axios.get<Aoe2cmRawDraftData>(`${API_BASE}/draft/${extractedId}`);
    const normalized = transformRawDataToSingleDraft(response.data);
    project.drafts[draftType] = {
      id: extractedId,
      status: 'connected',
      error: null,
      data: normalized,
    };
    if (response.data.nameHost) project.session.hostName = response.data.nameHost;
    if (response.data.nameGuest) project.session.guestName = response.data.nameGuest;

    await updateProject(project);
    connectSocket(project, draftType, extractedId);
    res.json({ status: 'connected' });
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? `Server responded with status ${error.response?.status || 'N/A'}: ${error.message}`
      : (error as Error).message;
    project.drafts[draftType].status = 'error';
    project.drafts[draftType].error = message;
    await updateProject(project);
    res.status(500).json({ status: 'error', message });
  }
});

app.post('/api/projects/:projectId/drafts/disconnect', async (req, res) => {
  const { projectId } = req.params;
  const draftType = req.body?.type as DraftType;
  const project = await ensureProject(projectId);
  const key = socketKey(projectId, draftType);
  const socket = sockets.get(key);
  if (socket) {
    socket.disconnect();
    sockets.delete(key);
  }
  project.drafts[draftType] = { id: null, status: 'disconnected', error: null, data: null };
  await updateProject(project);
  res.json({ status: 'disconnected' });
});

app.post('/api/projects/:projectId/drafts/reconnect', async (req, res) => {
  const { projectId } = req.params;
  const draftType = req.body?.type as DraftType;
  const project = await ensureProject(projectId);
  const draftId = project.drafts[draftType]?.id;
  if (!draftId) {
    res.status(400).json({ status: 'error', message: 'No draft ID to reconnect.' });
    return;
  }
  connectSocket(project, draftType, draftId);
  project.drafts[draftType].status = 'connecting';
  await updateProject(project);
  res.json({ status: 'connecting' });
});

app.get('/api/projects/:projectId/layouts', async (req, res) => {
  const project = await ensureProject(req.params.projectId);
  res.json({ savedLayouts: project.layouts.savedLayouts, activeCanvasId: project.layouts.activeCanvasId });
});

app.post('/api/projects/:projectId/layouts', async (req, res) => {
  const project = await ensureProject(req.params.projectId);
  const name = req.body?.name as string;
  const canvases = req.body?.canvases as StudioCanvas[];
  if (!name || !Array.isArray(canvases)) {
    res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'name and canvases are required' } });
    return;
  }
  const layout: SavedStudioLayout = {
    id: uuidv4(),
    name,
    canvases,
    activeCanvasId: req.body?.activeCanvasId ?? null,
  };
  project.layouts.savedLayouts.push(layout);
  await updateProject(project);
  res.status(201).json(layout);
});

app.put('/api/projects/:projectId/layouts/:layoutId', async (req, res) => {
  const project = await ensureProject(req.params.projectId);
  const layout = project.layouts.savedLayouts.find(l => l.id === req.params.layoutId);
  if (!layout) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Layout not found' } });
    return;
  }
  if (typeof req.body?.name === 'string') layout.name = req.body.name;
  if (Array.isArray(req.body?.canvases)) layout.canvases = req.body.canvases;
  if (req.body?.activeCanvasId !== undefined) layout.activeCanvasId = req.body.activeCanvasId;
  await updateProject(project);
  res.json(layout);
});

app.delete('/api/projects/:projectId/layouts/:layoutId', async (req, res) => {
  const project = await ensureProject(req.params.projectId);
  project.layouts.savedLayouts = project.layouts.savedLayouts.filter(layout => layout.id !== req.params.layoutId);
  await updateProject(project);
  res.status(204).send();
});

app.post('/api/projects/:projectId/layouts/import', async (req, res) => {
  const project = await ensureProject(req.params.projectId);
  const { savedLayouts, activeCanvasId, currentCanvases } = req.body || {};
  if (!Array.isArray(savedLayouts) || !Array.isArray(currentCanvases)) {
    res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'savedLayouts and currentCanvases are required' } });
    return;
  }
  project.layouts.savedLayouts = savedLayouts;
  project.layouts.activeCanvasId = activeCanvasId ?? null;
  project.layouts.canvases = currentCanvases;
  await updateProject(project);
  res.json({ savedLayouts, activeCanvasId, currentCanvases });
});

app.get('/api/projects/:projectId/layouts/export', async (req, res) => {
  const project = await ensureProject(req.params.projectId);
  res.json({
    version: 1,
    savedLayouts: project.layouts.savedLayouts,
    currentCanvases: project.layouts.canvases,
    activeCanvasId: project.layouts.activeCanvasId,
  });
});

app.get('/api/projects/:projectId/render-state', async (req, res) => {
  const project = await ensureProject(req.params.projectId);
  res.json(buildRenderState(project));
});

app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  });
  res.write('\n');
  subscribers.add(res);

  req.on('close', () => {
    subscribers.delete(res);
  });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Backend listening on http://127.0.0.1:${port}`);
});

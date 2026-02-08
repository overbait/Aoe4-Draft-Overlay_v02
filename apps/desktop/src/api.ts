import type { LayoutImportPayload, ProjectState, ProjectSummary } from './types';

const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:4000';

export const listProjects = async (): Promise<ProjectSummary[]> => {
  const res = await fetch(`${baseUrl}/api/projects`);
  return res.json();
};

export const createProject = async (name?: string): Promise<ProjectState> => {
  const res = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
};

export const getProject = async (id: string): Promise<ProjectState> => {
  const res = await fetch(`${baseUrl}/api/projects/${id}`);
  return res.json();
};

export const patchProject = async (id: string, payload: Partial<ProjectState>): Promise<ProjectState> => {
  const res = await fetch(`${baseUrl}/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteProject = async (id: string) => {
  await fetch(`${baseUrl}/api/projects/${id}`, { method: 'DELETE' });
};

export const connectDraft = async (projectId: string, type: 'civ' | 'map', draftIdOrUrl: string) => {
  const res = await fetch(`${baseUrl}/api/projects/${projectId}/drafts/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, draftIdOrUrl }),
  });
  return res.json();
};

export const reconnectDraft = async (projectId: string, type: 'civ' | 'map') => {
  const res = await fetch(`${baseUrl}/api/projects/${projectId}/drafts/reconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  return res.json();
};

export const disconnectDraft = async (projectId: string, type: 'civ' | 'map') => {
  const res = await fetch(`${baseUrl}/api/projects/${projectId}/drafts/disconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  return res.json();
};

export const saveLayout = async (
  projectId: string,
  name: string,
  canvases: ProjectState['layouts']['canvases'],
  activeCanvasId: string | null
) => {
  const res = await fetch(`${baseUrl}/api/projects/${projectId}/layouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, canvases, activeCanvasId }),
  });
  return res.json();
};

export const updateLayout = async (projectId: string, layoutId: string, payload: Partial<LayoutImportPayload>) => {
  const res = await fetch(`${baseUrl}/api/projects/${projectId}/layouts/${layoutId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteLayout = async (projectId: string, layoutId: string) => {
  await fetch(`${baseUrl}/api/projects/${projectId}/layouts/${layoutId}`, { method: 'DELETE' });
};

export const exportLayouts = async (projectId: string): Promise<LayoutImportPayload> => {
  const res = await fetch(`${baseUrl}/api/projects/${projectId}/layouts/export`);
  return res.json();
};

export const importLayouts = async (projectId: string, payload: LayoutImportPayload) => {
  const res = await fetch(`${baseUrl}/api/projects/${projectId}/layouts/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const overlayUrl = (canvasId: string) => {
  const base = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:4000';
  return `${base}/overlay/${canvasId}`;
};

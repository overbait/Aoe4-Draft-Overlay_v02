import React, { useEffect, useMemo, useState } from 'react';
import { Rnd } from 'react-rnd';
import {
  connectDraft,
  createProject,
  deleteLayout,
  deleteProject,
  disconnectDraft,
  exportLayouts,
  getProject,
  importLayouts,
  listProjects,
  overlayUrl,
  patchProject,
  reconnectDraft,
  saveLayout,
} from './api';
import type { Canvas, ElementItem, LayoutImportPayload, ProjectState, ProjectSummary } from './types';

const sections = ['Projects', 'Drafts', 'Match', 'Series', 'Layout', 'OBS'] as const;

const elementTypes = [
  'ScoreOnly',
  'NicknamesOnly',
  'BoXSeriesOverview',
  'CountryFlags',
  'ColorGlowElement',
  'MapPoolElement',
  'CivPoolElement',
  'PickedCivs',
  'BannedCivs',
  'Maps',
  'DeciderMap',
  'BackgroundImage',
];

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]>('Projects');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectState | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [civDraftInput, setCivDraftInput] = useState('');
  const [mapDraftInput, setMapDraftInput] = useState('');
  const [layoutName, setLayoutName] = useState('');
  const [importPayload, setImportPayload] = useState('');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const activeCanvas = useMemo(() => {
    if (!currentProject) return null;
    return (
      currentProject.layouts.canvases.find(c => c.id === currentProject.layouts.activeCanvasId) ||
      currentProject.layouts.canvases[0] ||
      null
    );
  }, [currentProject]);

  const refreshProjects = async () => {
    const data = await listProjects();
    setProjects(data);
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const loadProject = async (id: string) => {
    const data = await getProject(id);
    setCurrentProject(data);
  };

  const ensureCanvas = () => {
    if (!currentProject) return;
    if (currentProject.layouts.canvases.length === 0) {
      const canvas: Canvas = {
        id: crypto.randomUUID(),
        name: 'Default',
        layout: [],
        backgroundColor: '#000000',
        showBroadcastBorder: true,
      };
      const updated = {
        ...currentProject,
        layouts: {
          ...currentProject.layouts,
          canvases: [canvas],
          activeCanvasId: canvas.id,
        },
      };
      setCurrentProject(updated);
      patchProject(updated.id, updated);
    }
  };

  useEffect(() => {
    ensureCanvas();
  }, [currentProject]);

  const updateCurrentProject = async (update: Partial<ProjectState>) => {
    if (!currentProject) return;
    setIsDirty(true);
    const updated = await patchProject(currentProject.id, update);
    setCurrentProject(updated);
    setIsDirty(false);
  };

  const handleAddElement = (type: string) => {
    if (!currentProject || !activeCanvas) return;
    const newElement: ElementItem = {
      id: crypto.randomUUID(),
      type,
      position: { x: 10, y: 10 },
      size: { width: 200, height: 80 },
      scale: 1,
      textColor: '#ffffff',
      showGlow: true,
      showText: true,
      deciderMapTitle: 'Decider Map',
      glowColor: '#FFFF00',
    };
    const updatedCanvas = {
      ...activeCanvas,
      layout: [...activeCanvas.layout, newElement],
    };
    const updatedCanvases = currentProject.layouts.canvases.map(c =>
      c.id === updatedCanvas.id ? updatedCanvas : c
    );
    const updated = {
      ...currentProject,
      layouts: { ...currentProject.layouts, canvases: updatedCanvases },
    };
    setCurrentProject(updated);
    patchProject(updated.id, updated);
  };

  const updateElement = (elementId: string, updates: Partial<ElementItem>) => {
    if (!currentProject || !activeCanvas) return;
    const updatedCanvas = {
      ...activeCanvas,
      layout: activeCanvas.layout.map(el => (el.id === elementId ? { ...el, ...updates } : el)),
    };
    const updated = {
      ...currentProject,
      layouts: {
        ...currentProject.layouts,
        canvases: currentProject.layouts.canvases.map(c => (c.id === updatedCanvas.id ? updatedCanvas : c)),
      },
    };
    setCurrentProject(updated);
    patchProject(updated.id, updated);
  };

  const selectedElement = activeCanvas?.layout.find(el => el.id === selectedElementId) ?? null;

  const renderProjects = () => (
    <div className="section">
      <div className="card">
        <div className="input-row">
          <input
            placeholder="Project name"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
          />
          <button
            className="button"
            onClick={async () => {
              const project = await createProject(newProjectName || undefined);
              setCurrentProject(project);
              setNewProjectName('');
              refreshProjects();
            }}
          >
            Create
          </button>
        </div>
      </div>
      {projects.map(project => (
        <div key={project.id} className="card">
          <div>{project.name}</div>
          <div className="input-row">
            <button className="button" onClick={() => loadProject(project.id)}>
              Open
            </button>
            <button
              className="button"
              onClick={async () => {
                await deleteProject(project.id);
                if (currentProject?.id === project.id) {
                  setCurrentProject(null);
                }
                refreshProjects();
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDrafts = () => (
    <div className="section">
      <div className="card">
        <h3>Civ Draft</h3>
        <div className="input-row">
          <input
            placeholder="Draft ID or URL"
            value={civDraftInput}
            onChange={e => setCivDraftInput(e.target.value)}
          />
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              await connectDraft(currentProject.id, 'civ', civDraftInput);
              loadProject(currentProject.id);
            }}
          >
            Connect
          </button>
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              await reconnectDraft(currentProject.id, 'civ');
              loadProject(currentProject.id);
            }}
          >
            Reconnect
          </button>
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              await disconnectDraft(currentProject.id, 'civ');
              loadProject(currentProject.id);
            }}
          >
            Disconnect
          </button>
        </div>
        <div>Status: {currentProject?.drafts.civ.status}</div>
      </div>
      <div className="card">
        <h3>Map Draft</h3>
        <div className="input-row">
          <input
            placeholder="Draft ID or URL"
            value={mapDraftInput}
            onChange={e => setMapDraftInput(e.target.value)}
          />
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              await connectDraft(currentProject.id, 'map', mapDraftInput);
              loadProject(currentProject.id);
            }}
          >
            Connect
          </button>
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              await reconnectDraft(currentProject.id, 'map');
              loadProject(currentProject.id);
            }}
          >
            Reconnect
          </button>
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              await disconnectDraft(currentProject.id, 'map');
              loadProject(currentProject.id);
            }}
          >
            Disconnect
          </button>
        </div>
        <div>Status: {currentProject?.drafts.map.status}</div>
      </div>
    </div>
  );

  const renderMatch = () => (
    <div className="section">
      <div className="card">
        <button
          className="button"
          onClick={() => {
            if (!currentProject) return;
            const swapped = {
              ...currentProject.session,
              hostName: currentProject.session.guestName,
              guestName: currentProject.session.hostName,
              hostColor: currentProject.session.guestColor,
              guestColor: currentProject.session.hostColor,
              hostFlag: currentProject.session.guestFlag,
              guestFlag: currentProject.session.hostFlag,
              scores: {
                host: currentProject.session.scores.guest,
                guest: currentProject.session.scores.host,
              },
            };
            updateCurrentProject({ session: swapped });
          }}
        >
          Swap Sides
        </button>
        <div className="input-row">
          <input
            placeholder="Host name"
            value={currentProject?.session.hostName ?? ''}
            onChange={e =>
              updateCurrentProject({
                session: { ...currentProject!.session, hostName: e.target.value },
              })
            }
          />
          <input
            placeholder="Guest name"
            value={currentProject?.session.guestName ?? ''}
            onChange={e =>
              updateCurrentProject({
                session: { ...currentProject!.session, guestName: e.target.value },
              })
            }
          />
        </div>
        <div className="input-row">
          <input
            type="number"
            placeholder="Host score"
            value={currentProject?.session.scores.host ?? 0}
            onChange={e =>
              updateCurrentProject({
                session: {
                  ...currentProject!.session,
                  scores: { ...currentProject!.session.scores, host: Number(e.target.value) },
                },
              })
            }
          />
          <input
            type="number"
            placeholder="Guest score"
            value={currentProject?.session.scores.guest ?? 0}
            onChange={e =>
              updateCurrentProject({
                session: {
                  ...currentProject!.session,
                  scores: { ...currentProject!.session.scores, guest: Number(e.target.value) },
                },
              })
            }
          />
        </div>
        <div className="input-row">
          <input
            placeholder="Host color"
            value={currentProject?.session.hostColor ?? ''}
            onChange={e =>
              updateCurrentProject({
                session: { ...currentProject!.session, hostColor: e.target.value },
              })
            }
          />
          <input
            placeholder="Guest color"
            value={currentProject?.session.guestColor ?? ''}
            onChange={e =>
              updateCurrentProject({
                session: { ...currentProject!.session, guestColor: e.target.value },
              })
            }
          />
        </div>
        <div className="input-row">
          <input
            placeholder="Host flag"
            value={currentProject?.session.hostFlag ?? ''}
            onChange={e =>
              updateCurrentProject({
                session: { ...currentProject!.session, hostFlag: e.target.value },
              })
            }
          />
          <input
            placeholder="Guest flag"
            value={currentProject?.session.guestFlag ?? ''}
            onChange={e =>
              updateCurrentProject({
                session: { ...currentProject!.session, guestFlag: e.target.value },
              })
            }
          />
        </div>
      </div>
    </div>
  );

  const renderSeries = () => (
    <div className="section">
      <div className="card">
        <div className="input-row">
          <select
            value={currentProject?.series.format ?? ''}
            onChange={e => {
              const value = e.target.value as ProjectState['series']['format'] | '';
              updateCurrentProject({
                series: { ...currentProject!.series, format: value === '' ? null : value },
              });
            }}
          >
            <option value="">Select format</option>
            <option value="bo1">Bo1</option>
            <option value="bo3">Bo3</option>
            <option value="bo5">Bo5</option>
            <option value="bo7">Bo7</option>
          </select>
        </div>
        {currentProject?.series.games.map((game, index) => (
          <div key={index} className="input-row">
            <input
              placeholder="Map"
              value={game.map ?? ''}
              onChange={e => {
                const games = [...currentProject.series.games];
                games[index] = { ...game, map: e.target.value };
                updateCurrentProject({ series: { ...currentProject.series, games } });
              }}
            />
            <input
              placeholder="Host civ"
              value={game.hostCiv ?? ''}
              onChange={e => {
                const games = [...currentProject.series.games];
                games[index] = { ...game, hostCiv: e.target.value };
                updateCurrentProject({ series: { ...currentProject.series, games } });
              }}
            />
            <input
              placeholder="Guest civ"
              value={game.guestCiv ?? ''}
              onChange={e => {
                const games = [...currentProject.series.games];
                games[index] = { ...game, guestCiv: e.target.value };
                updateCurrentProject({ series: { ...currentProject.series, games } });
              }}
            />
            <select
              value={game.winner ?? ''}
              onChange={e => {
                const value = e.target.value as ProjectState['series']['games'][number]['winner'] | '';
                const games = [...currentProject.series.games];
                games[index] = { ...game, winner: value === '' ? null : value };
                updateCurrentProject({ series: { ...currentProject.series, games } });
              }}
            >
              <option value="">Winner</option>
              <option value="host">Host</option>
              <option value="guest">Guest</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={game.isVisible}
                onChange={e => {
                  const games = [...currentProject.series.games];
                  games[index] = { ...game, isVisible: e.target.checked };
                  updateCurrentProject({ series: { ...currentProject.series, games } });
                }}
              />
              Visible
            </label>
          </div>
        ))}
        <button
          className="button"
          onClick={() => {
            if (!currentProject) return;
            const games = [
              ...currentProject.series.games,
              {
                map: null,
                hostCiv: null,
                guestCiv: null,
                winner: null,
                isVisible: true,
              },
            ];
            updateCurrentProject({ series: { ...currentProject.series, games } });
          }}
        >
          Add Game
        </button>
      </div>
    </div>
  );

  const renderLayout = () => (
    <div className="section">
      <div className="card">
        <div className="input-row">
          <button
            className="button"
            onClick={() => {
              if (!currentProject) return;
              const canvas: Canvas = {
                id: crypto.randomUUID(),
                name: `Canvas ${currentProject.layouts.canvases.length + 1}`,
                layout: [],
                backgroundColor: '#000000',
                showBroadcastBorder: true,
              };
              updateCurrentProject({
                layouts: {
                  ...currentProject.layouts,
                  canvases: [...currentProject.layouts.canvases, canvas],
                  activeCanvasId: canvas.id,
                },
              });
            }}
          >
            Add Canvas
          </button>
          {activeCanvas && (
            <button
              className="button"
              onClick={() => {
                if (!currentProject) return;
                const remaining = currentProject.layouts.canvases.filter(c => c.id !== activeCanvas.id);
                const nextActive = remaining[0]?.id ?? null;
                updateCurrentProject({
                  layouts: {
                    ...currentProject.layouts,
                    canvases: remaining,
                    activeCanvasId: nextActive,
                  },
                });
                setSelectedElementId(null);
              }}
            >
              Delete Canvas
            </button>
          )}
        </div>
        {activeCanvas && (
          <div className="input-row">
            <input
              placeholder="Canvas background"
              value={activeCanvas.backgroundColor ?? ''}
              onChange={e =>
                updateCurrentProject({
                  layouts: {
                    ...currentProject!.layouts,
                    canvases: currentProject!.layouts.canvases.map(c =>
                      c.id === activeCanvas.id ? { ...c, backgroundColor: e.target.value } : c
                    ),
                  },
                })
              }
            />
            <label>
              <input
                type="checkbox"
                checked={activeCanvas.showBroadcastBorder ?? true}
                onChange={e =>
                  updateCurrentProject({
                    layouts: {
                      ...currentProject!.layouts,
                      canvases: currentProject!.layouts.canvases.map(c =>
                        c.id === activeCanvas.id ? { ...c, showBroadcastBorder: e.target.checked } : c
                      ),
                    },
                  })
                }
              />
              Broadcast Border
            </label>
          </div>
        )}
        <div className="input-row">
          {currentProject?.layouts.canvases.map(canvas => (
            <button
              key={canvas.id}
              className={`button ${currentProject.layouts.activeCanvasId === canvas.id ? 'active' : ''}`}
              onClick={() =>
                updateCurrentProject({
                  layouts: { ...currentProject.layouts, activeCanvasId: canvas.id },
                })
              }
            >
              {canvas.name}
            </button>
          ))}
        </div>
        <div className="input-row">
          {elementTypes.map(type => (
            <button key={type} className="button" onClick={() => handleAddElement(type)}>
              {type}
            </button>
          ))}
        </div>
        {activeCanvas && (
          <div className="canvas-stage">
            {activeCanvas.layout.map(element => (
              <Rnd
                key={element.id}
                bounds="parent"
                size={{ width: element.size.width, height: element.size.height }}
                position={{ x: element.position.x, y: element.position.y }}
                onDragStop={(_, data) => updateElement(element.id, { position: { x: data.x, y: data.y } })}
                onResizeStop={(_, __, ref, ___, position) =>
                  updateElement(element.id, {
                    size: { width: ref.offsetWidth, height: ref.offsetHeight },
                    position,
                  })
                }
              >
                <div
                  className="element-item"
                  onClick={() => setSelectedElementId(element.id)}
                  style={{
                    outline: selectedElementId === element.id ? '2px solid #4a90e2' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {element.type}
                </div>
              </Rnd>
            ))}
          </div>
        )}
        {selectedElement && (
          <div className="card">
            <h4>Element настройки</h4>
            <div className="input-row">
              <input
                placeholder="Text color"
                value={selectedElement.textColor ?? ''}
                onChange={e => updateElement(selectedElement.id, { textColor: e.target.value })}
              />
              <input
                placeholder="Glow color"
                value={selectedElement.glowColor ?? ''}
                onChange={e => updateElement(selectedElement.id, { glowColor: e.target.value })}
              />
            </div>
            <div className="input-row">
              <label>
                <input
                  type="checkbox"
                  checked={selectedElement.showGlow ?? true}
                  onChange={e => updateElement(selectedElement.id, { showGlow: e.target.checked })}
                />
                Show Glow
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedElement.showText ?? true}
                  onChange={e => updateElement(selectedElement.id, { showText: e.target.checked })}
                />
                Show Text
              </label>
            </div>
            {selectedElement.type === 'DeciderMap' && (
              <div className="input-row">
                <input
                  placeholder="Decider title"
                  value={selectedElement.deciderMapTitle ?? ''}
                  onChange={e => updateElement(selectedElement.id, { deciderMapTitle: e.target.value })}
                />
              </div>
            )}
            <button
              className="button"
              onClick={() => {
                if (!activeCanvas) return;
                const updatedCanvas = {
                  ...activeCanvas,
                  layout: activeCanvas.layout.filter(el => el.id !== selectedElement.id),
                };
                const updated = {
                  ...currentProject!,
                  layouts: {
                    ...currentProject!.layouts,
                    canvases: currentProject!.layouts.canvases.map(c =>
                      c.id === updatedCanvas.id ? updatedCanvas : c
                    ),
                  },
                };
                setSelectedElementId(null);
                setCurrentProject(updated);
                patchProject(updated.id, updated);
              }}
            >
              Remove Element
            </button>
          </div>
        )}
        <div className="input-row">
          <input
            placeholder="Layout name"
            value={layoutName}
            onChange={e => setLayoutName(e.target.value)}
          />
          <button
            className="button"
            onClick={async () => {
              if (!currentProject || !layoutName) return;
              await saveLayout(
                currentProject.id,
                layoutName,
                currentProject.layouts.canvases,
                currentProject.layouts.activeCanvasId
              );
              setLayoutName('');
              loadProject(currentProject.id);
            }}
          >
            Save Layout
          </button>
        </div>
        <div className="input-row">
          <textarea
            placeholder="Paste layout JSON to import"
            value={importPayload}
            onChange={e => setImportPayload(e.target.value)}
          />
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              const payload = JSON.parse(importPayload) as LayoutImportPayload;
              await importLayouts(currentProject.id, payload);
              setImportPayload('');
              loadProject(currentProject.id);
            }}
          >
            Import
          </button>
          <button
            className="button"
            onClick={async () => {
              if (!currentProject) return;
              const data = await exportLayouts(currentProject.id);
              navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            }}
          >
            Export
          </button>
        </div>
        <div className="section">
          {currentProject?.layouts.savedLayouts.map(layout => (
            <div key={layout.id} className="card">
              <div>{layout.name}</div>
              <button className="button" onClick={() => deleteLayout(currentProject.id, layout.id)}>
                Delete Layout
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderObs = () => (
    <div className="section">
      <div className="card">
        <h3>OBS Browser Source</h3>
        <p>Размер: 1920×1080, включить прозрачность, отключить кэширование.</p>
        {currentProject?.layouts.canvases.map(canvas => (
          <div key={canvas.id} className="input-row">
            <span>{canvas.name}</span>
            <button
              className="button"
              onClick={() => navigator.clipboard.writeText(overlayUrl(canvas.id))}
            >
              Copy URL
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSection = () => {
    if (!currentProject && activeSection !== 'Projects') {
      return <div>Select or create a project first.</div>;
    }

    switch (activeSection) {
      case 'Projects':
        return renderProjects();
      case 'Drafts':
        return renderDrafts();
      case 'Match':
        return renderMatch();
      case 'Series':
        return renderSeries();
      case 'Layout':
        return renderLayout();
      case 'OBS':
        return renderObs();
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div className="sidebar">
        {sections.map(section => (
          <button
            key={section}
            className={`nav-button ${activeSection === section ? 'active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </div>
      <div className="main">
        <h2>
          {currentProject ? `${currentProject.name}` : 'No Project Selected'}
          {currentProject && <span style={{ marginLeft: 12, fontSize: 14 }}>{isDirty ? 'Saving…' : 'Saved'}</span>}
        </h2>
        {renderSection()}
      </div>
    </div>
  );
};

export default App;

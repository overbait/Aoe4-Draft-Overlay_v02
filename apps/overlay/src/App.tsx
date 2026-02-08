import React from 'react';
import { useRenderState } from './useRenderState';
import type { RenderStatePayload } from './types';

const findActiveCanvas = (payload: RenderStatePayload | null, canvasIdOverride: string | null) => {
  if (!payload) return null;
  const { canvases, activeCanvasId } = payload.renderState.layouts;
  if (canvasIdOverride) {
    return canvases.find(canvas => canvas.id === canvasIdOverride) ?? null;
  }
  if (activeCanvasId) {
    return canvases.find(canvas => canvas.id === activeCanvasId) ?? canvases[0] ?? null;
  }
  return canvases[0] ?? null;
};

const renderElementContent = (element: RenderStatePayload['renderState']['layouts']['canvases'][number]['elements'][number], payload: RenderStatePayload) => {
  const { session, draft, series } = payload.renderState;
  const labelStyle = { color: element.textColor || '#ffffff' };
  if (element.showText === false) {
    return null;
  }

  switch (element.type) {
    case 'ScoreOnly':
      return (
        <div className="element-label" style={labelStyle}>
          {session.scores.host} - {session.scores.guest}
        </div>
      );
    case 'NicknamesOnly':
      return (
        <div className="element-label" style={labelStyle}>
          {session.hostName} vs {session.guestName}
        </div>
      );
    case 'BoXSeriesOverview':
      return (
        <div className="element-label" style={labelStyle}>
          <div className="section-title">Series {series.format ?? ''}</div>
          {series.games
            .filter(game => game.isVisible)
            .map((game, index) => (
              <div key={`${element.id}-game-${index}`}>Game {index + 1}: {game.map ?? 'TBD'}</div>
            ))}
        </div>
      );
    case 'CountryFlags':
      return (
        <div className="element-label" style={labelStyle}>
          {session.hostFlag ?? '??'} | {session.guestFlag ?? '??'}
        </div>
      );
    case 'ColorGlowElement':
      return (
        <div className="element-label" style={labelStyle}>
          Colors: {session.hostColor ?? 'none'} / {session.guestColor ?? 'none'}
        </div>
      );
    case 'MapPoolElement':
      return (
        <div className="element-label" style={labelStyle}>
          <div className="section-title">Map Pool</div>
          <div className="list">
            {draft.map.picksHost.concat(draft.map.bansHost, draft.map.picksGuest, draft.map.bansGuest).map(item => (
              <span key={`${element.id}-${item}`} className="item">{item}</span>
            ))}
          </div>
        </div>
      );
    case 'CivPoolElement':
      return (
        <div className="element-label" style={labelStyle}>
          <div className="section-title">Civ Pool</div>
          <div className="list">
            {draft.civ.picksHost.concat(draft.civ.bansHost, draft.civ.picksGuest, draft.civ.bansGuest).map(item => (
              <span key={`${element.id}-${item}`} className="item">{item}</span>
            ))}
          </div>
        </div>
      );
    case 'PickedCivs':
      return (
        <div className="element-label" style={labelStyle}>
          Picks: {draft.civ.picksHost.join(', ')} | {draft.civ.picksGuest.join(', ')}
        </div>
      );
    case 'BannedCivs':
      return (
        <div className="element-label" style={labelStyle}>
          Bans: {draft.civ.bansHost.join(', ')} | {draft.civ.bansGuest.join(', ')}
        </div>
      );
    case 'Maps':
      return (
        <div className="element-label" style={labelStyle}>
          Maps: {draft.map.picksHost.concat(draft.map.picksGuest, draft.map.picksGlobal).join(', ')}
        </div>
      );
    case 'DeciderMap':
      return (
        <div className="element-label" style={labelStyle}>
          {element.deciderMapTitle ?? 'Decider Map'}: {draft.map.picksGlobal[0] ?? 'TBD'}
        </div>
      );
    case 'BackgroundImage':
      return null;
    default:
      return (
        <div className="element-label" style={labelStyle}>
          {element.type}
        </div>
      );
  }
};

const App: React.FC = () => {
  const { payload, error } = useRenderState();
  const params = new URLSearchParams(window.location.search);
  const canvasIdOverride = params.get('canvasId');
  const canvas = findActiveCanvas(payload, canvasIdOverride);

  if (error) {
    return <div className="element-label">Overlay error: {error}</div>;
  }

  if (!payload || !canvas) {
    return <div className="element-label">Waiting for render_state…</div>;
  }

  return (
    <div
      className="overlay-root"
      style={{ background: canvas.backgroundColor ?? 'transparent' }}
    >
      {canvas.elements.map(element => {
        const scale = element.scale ?? 1;
        const style: React.CSSProperties = {
          left: element.position.x,
          top: element.position.y,
          width: element.size.width * scale,
          height: element.size.height * scale,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        };

        if (element.type === 'BackgroundImage' && element.imageUrl) {
          return (
            <div
              key={element.id}
              className="element-box"
              style={{
                ...style,
                backgroundImage: `url(${element.imageUrl})`,
                backgroundSize: 'cover',
                opacity: element.opacity ?? 1,
              }}
            />
          );
        }

        const content = renderElementContent(element, payload);
        if (!content) return null;

        return (
          <div key={element.id} className={`element-box ${element.showGlow ? 'glow' : ''}`} style={style}>
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { StudioElement, BroadcastState } from '../types/draft';
import ScoreOnlyElement from '../components/studio/ScoreOnlyElement';
import NicknamesOnlyElement from '../components/studio/NicknamesOnlyElement';
import BoXSeriesOverviewElement from '../components/studio/BoXSeriesOverviewElement';
import CountryFlagsElement from '../components/studio/CountryFlagsElement';
import ColorGlowElement from '../components/studio/ColorGlowElement';
import MapPoolElement from '../components/studio/MapPoolElement';
import CivPoolElement from '../components/studio/CivPoolElement';
import PickedCivsElement from '../components/studio/PickedCivsElement';
import BannedCivsElement from '../components/studio/BannedCivsElement';
import MapsElement from '../components/studio/MapsElement';
import BackgroundImageElement from '../components/studio/BackgroundImageElement';

interface BroadcastViewProps {
  targetCanvasId: string;
}

const BroadcastView: React.FC<BroadcastViewProps> = ({ targetCanvasId }) => {
  const [broadcastState, setBroadcastState] = useState<BroadcastState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    const root = document.getElementById('root');
    if (root) {
      root.style.backgroundColor = 'transparent';
    }
    (window as any).IS_BROADCAST_VIEW = true;

    if (!targetCanvasId) {
      setError("Error: No Canvas ID specified in the URL.");
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/broadcast_state`);
        if (!response.ok) throw new Error(`Server responded with ${response.status}`);
        const initialState = await response.json();
        if (initialState && Object.keys(initialState).length > 0) {
          setBroadcastState(initialState);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(`Could not connect to the overlay server at http://localhost:4000. Details: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const socket = io('http://localhost:4000');

    socket.on('canvasUpdated', (data) => {
      if (data && data.canvasId) {
        setBroadcastState(prevState => {
          if (!prevState) return null;
          const newCanvases = { ...prevState.canvases };
          newCanvases[data.canvasId] = {
            ...newCanvases[data.canvasId],
            ...data
          };
          return { ...prevState, canvases: newCanvases };
        });
      }
    });

    socket.on('draftDataUpdated', (data) => {
      if (data && typeof data === 'object') {
        setBroadcastState(prevState => {
          if (!prevState) return null;
          return { ...prevState, ...data };
        });
      }
    });

    socket.on('connect_error', (err) => {
      if (!error) {
        setError(`Socket.io connection failed: ${err.message}.`);
      }
    });

    return () => {
      document.body.style.backgroundColor = '';
      if (root) {
        root.style.backgroundColor = '';
      }
      (window as any).IS_BROADCAST_VIEW = false;
      socket.disconnect();
    };
  }, [targetCanvasId, error]);

  if (isLoading) {
    return <div style={messageBoxStyle}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ ...messageBoxStyle, backgroundColor: 'rgba(200, 50, 50, 0.85)', color: 'white', whiteSpace: 'pre-wrap', fontFamily: 'monospace', padding: '40px' }}>
        {error}
      </div>
    );
  }

  const canvasLayout = broadcastState?.canvases[targetCanvasId];

  if (!canvasLayout) {
    return (
      <div style={messageBoxStyle}>
        Waiting for data from Studio Interface for canvas ID: {targetCanvasId}
      </div>
    );
  }

  return (
    <div
      className="broadcast-view"
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: canvasLayout.backgroundColor || 'transparent',
        border: canvasLayout.showBroadcastBorder === false ? '1px dashed transparent' : '1px dashed #777',
      }}
    >
      {canvasLayout.layout.map((element: StudioElement) => {
        const currentScale = element.scale || 1;
        const outerDivStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${element.position.x}px`,
          top: `${element.position.y}px`,
          width: `${element.size.width * currentScale}px`,
          height: `${element.size.height * currentScale}px`,
          boxSizing: 'border-box',
        };
        const currentOverflow = (element.type === "MapPoolElement" || element.type === "CivPoolElement" || element.type === "PickedCivs" || element.type === "BannedCivs" || element.type === "Maps") ? 'visible' : 'hidden';
        const innerDivStyle: React.CSSProperties = {
          width: `${element.size.width}px`,
          height: `${element.size.height}px`,
          transform: `scale(${currentScale})`,
          transformOrigin: 'top left',
          overflow: currentOverflow,
          boxSizing: 'border-box',
        };

        let content = null;
        if (element.type === "ScoreOnly") content = <ScoreOnlyElement element={element} scores={broadcastState.scores} />;
        else if (element.type === "NicknamesOnly") content = <NicknamesOnlyElement element={element} hostName={broadcastState.hostName} guestName={broadcastState.guestName} />;
        else if (element.type === "BoXSeriesOverview") content = <BoXSeriesOverviewElement element={element} boxSeriesFormat={broadcastState.boxSeriesFormat} boxSeriesGames={broadcastState.boxSeriesGames} />;
        else if (element.type === "CountryFlags") content = <CountryFlagsElement element={element} hostFlag={broadcastState.hostFlag} guestFlag={broadcastState.guestFlag} />;
        else if (element.type === "ColorGlowElement") content = <ColorGlowElement element={element} hostColor={broadcastState.hostColor} guestColor={broadcastState.guestColor} />;
        else if (element.type === "MapPoolElement") content = <MapPoolElement element={element} mapPicksHost={broadcastState.mapPicksHost} mapBansHost={broadcastState.mapBansHost} mapPicksGuest={broadcastState.mapPicksGuest} mapBansGuest={broadcastState.mapBansGuest} mapPicksGlobal={broadcastState.mapPicksGlobal} aoe2cmRawDraftOptions={broadcastState.aoe2cmRawDraftOptions} forceMapPoolUpdate={broadcastState.forceMapPoolUpdate} />;
        else if (element.type === "CivPoolElement") content = <CivPoolElement element={element} civPicksHost={broadcastState.civPicksHost} civBansHost={broadcastState.civBansHost} civPicksGuest={broadcastState.civPicksGuest} civBansGuest={broadcastState.civBansGuest} civPicksGlobal={broadcastState.civPicksGlobal} aoe2cmRawDraftOptions={broadcastState.aoe2cmRawDraftOptions} />;
        else if (element.type === "PickedCivs") content = <PickedCivsElement element={element} civPicksHost={broadcastState.civPicksHost} civPicksGuest={broadcastState.civPicksGuest} />;
        else if (element.type === "BannedCivs") content = <BannedCivsElement element={element} civBansHost={broadcastState.civBansHost} civBansGuest={broadcastState.civBansGuest} />;
        else if (element.type === "Maps") content = <MapsElement element={element} mapPicksHost={broadcastState.mapPicksHost} mapBansHost={broadcastState.mapBansHost} mapPicksGuest={broadcastState.mapPicksGuest} mapBansGuest={broadcastState.mapBansGuest} />;
        else if (element.type === "BackgroundImage") content = <BackgroundImageElement element={element} isBroadcast={true} />;
        else content = <div>Unknown Element: {element.type}</div>;

        if (!content) return null;

        return (
          <div key={element.id} style={outerDivStyle}>
            <div style={innerDivStyle}>
               {content}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const messageBoxStyle: React.CSSProperties = {
  width: '1920px',
  height: '1080px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ccc',
  fontSize: '24px',
  backgroundColor: 'transparent',
  fontFamily: 'sans-serif',
};

export default BroadcastView;

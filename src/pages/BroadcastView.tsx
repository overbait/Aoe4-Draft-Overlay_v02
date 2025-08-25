import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { StudioElement, StudioCanvas as Canvas } from '../types/draft';
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
  const [canvasData, setCanvasData] = useState<Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (window as any).IS_BROADCAST_VIEW = true;

    if (!targetCanvasId) {
      setError("Error: No Canvas ID specified in the URL.\nPlease use a valid link from the 'Copy OBS Link' button.");
      setIsLoading(false);
      return;
    }

    // 1. Initial Data Fetch from Server
    const fetchCanvasData = async () => {
      try {
        const response = await fetch(`http://localhost:4000/canvas/${targetCanvasId}`);
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}.`);
        }
        const data = await response.json();
        if (data && Object.keys(data).length > 0) {
          setCanvasData(data);
        } else {
          // This is not a connection error, but a "not found" state.
          // The UI will show a "waiting" message.
          console.log(`Canvas ${targetCanvasId} not yet cached on server. Waiting for update from Studio...`);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(`Could not connect to the overlay server at http://localhost:4000.\n\n- Is the main application running ('npm run dev')?\n- Is a firewall or ad-blocker preventing the connection?\n\nDetails: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanvasData();

    // 2. Real-time Updates with Socket.io
    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
      // Connected
    });

    socket.on('canvasUpdated', (updatedData: Canvas) => {
      if (updatedData.id === targetCanvasId) {
        setCanvasData(updatedData);
        if (error) setError(null); // Clear error on first successful update.
      }
    });

    socket.on('connect_error', (err) => {
        if (!error) { // Don't overwrite a more specific fetch error
            setError(`Socket.io connection failed: ${err.message}. The server might be down or unreachable.`);
        }
    });

    return () => {
      (window as any).IS_BROADCAST_VIEW = false;
      socket.disconnect();
    };
  }, [targetCanvasId, error]);

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div style={messageBoxStyle}>
        Loading canvas...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...messageBoxStyle, backgroundColor: 'rgba(200, 50, 50, 0.85)', color: 'white', whiteSpace: 'pre-wrap', fontFamily: 'monospace', padding: '40px' }}>
        {error}
      </div>
    );
  }

  if (!canvasData) {
    return (
      <div style={messageBoxStyle}>
        Waiting for data from Studio Interface for canvas ID: {targetCanvasId}
      </div>
    );
  }

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: canvasData.backgroundColor || 'transparent',
        border: canvasData.showBroadcastBorder === false ? '1px dashed transparent' : '1px dashed #777',
      }}
    >
      {canvasData.layout.map((element: StudioElement) => {
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
        if (element.type === "ScoreOnly") content = <ScoreOnlyElement element={element} isBroadcast={true} />;
        else if (element.type === "NicknamesOnly") content = <NicknamesOnlyElement element={element} isBroadcast={true} />;
        else if (element.type === "BoXSeriesOverview") content = <BoXSeriesOverviewElement element={element} isBroadcast={true} />;
        else if (element.type === "CountryFlags") content = <CountryFlagsElement element={element} isBroadcast={true} />;
        else if (element.type === "ColorGlowElement") content = <ColorGlowElement element={element} isBroadcast={true} />;
        else if (element.type === "MapPoolElement") content = <MapPoolElement element={element} isBroadcast={true} />;
        else if (element.type === "CivPoolElement") content = <CivPoolElement element={element} isBroadcast={true} />;
        else if (element.type === "PickedCivs") content = <PickedCivsElement element={element} isBroadcast={true} />;
        else if (element.type === "BannedCivs") content = <BannedCivsElement element={element} isBroadcast={true} />;
        else if (element.type === "Maps") content = <MapsElement element={element} isBroadcast={true} />;
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

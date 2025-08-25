import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';

// Lazy load page components for code splitting
const TechnicalInterface = lazy(() => import('./pages/TechnicalInterface'));
const StudioInterface = lazy(() => import('./pages/StudioInterface')); // Added import

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-aoe-dark text-aoe-light p-4">
          <h1 className="text-2xl font-medieval text-aoe-gold mb-4">Something went wrong</h1>
          <p className="mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button
            className="button-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import BroadcastView from './pages/BroadcastView';   // Import the new view

// Loading component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-aoe-dark">
    <div className="text-center">
      <div className="animate-pulse-slow">
        <h2 className="text-2xl font-medieval text-aoe-gold mb-4">Loading...</h2>
      </div>
      <p className="text-aoe-light">Preparing the battlefield</p>
    </div>
  </div>
);

// Navigation component - Updated
const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-ui-background shadow-md py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/technical" className={`text-xl font-medieval ${location.pathname.startsWith('/technical') ? 'text-aoe-gold' : 'text-aoe-light hover:text-aoe-tan'}`}>
          AoE4 Draft Overlay
        </Link>
        <div className="space-x-4">
          <Link to="/technical" className={`font-medieval ${location.pathname.startsWith('/technical') ? 'text-aoe-gold' : 'text-aoe-light hover:text-aoe-tan'}`}>
            Data Management
          </Link>
          <Link to="/studio" className={`font-medieval ${location.pathname.startsWith('/studio') ? 'text-aoe-gold' : 'text-aoe-light hover:text-aoe-tan'}`}>
            Broadcast Studio
          </Link>
        </div>
      </div>
    </nav>
  );
};

import useDraftStore from './store/draftStore';
import { io } from 'socket.io-client';
import { StudioCanvas } from './types/draft';

// --- Socket.io setup for server communication ---
const socket = io('http://localhost:4000');

const App: React.FC = () => {
  // Centralized state synchronization logic
  useEffect(() => {
    const getSerializableDraftState = (state: any) => {
      if (!state || typeof state !== 'object') return {};
      return {
        civDraftId: state.civDraftId,
        mapDraftId: state.mapDraftId,
        hostName: state.hostName,
        guestName: state.guestName,
        scores: state.scores,
        civPicksHost: state.civPicksHost,
        civBansHost: state.civBansHost,
        civPicksGuest: state.civPicksGuest,
        civBansGuest: state.civBansGuest,
        mapPicksHost: state.mapPicksHost,
        mapBansHost: state.mapBansHost,
        mapPicksGuest: state.mapPicksGuest,
        mapBansGuest: state.mapBansGuest,
        mapPicksGlobal: state.mapPicksGlobal,
        mapBansGlobal: state.mapBansGlobal,
        aoe2cmRawDraftOptions: state.aoe2cmRawDraftOptions,
        boxSeriesFormat: state.boxSeriesFormat,
        boxSeriesGames: state.boxSeriesGames,
        hostColor: state.hostColor,
        guestColor: state.guestColor,
        hostFlag: state.hostFlag,
        guestFlag: state.guestFlag,
        lastDraftAction: state.lastDraftAction,
        revealedBans: state.revealedBans,
        banRevealCount: state.banRevealCount,
        countdown: state.countdown,
        draft: state.draft,
        highlightedAction: state.highlightedAction,
      };
    };

    const constructPayload = (state: any) => {
        const activeCanvas = state.currentCanvases.find((c: StudioCanvas) => c.id === state.activeCanvasId);
        return {
            layout: activeCanvas || null,
            draft: getSerializableDraftState(state),
        };
    };

    // 1. Prime the server with initial data
    const initialState = useDraftStore.getState();
    socket.emit('initState', constructPayload(initialState));

    // 2. Subscribe to all store changes and push updates
    const unsubscribe = useDraftStore.subscribe((state) => {
      socket.emit('updateState', constructPayload(state));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const queryParams = new URLSearchParams(window.location.search);
  const viewType = queryParams.get('view');
  const canvasId = queryParams.get('canvasId');
  const data = queryParams.get('data');

  // If data is present for a broadcast view, load it into the store first.
  // This is a one-time action on component mount.
  useEffect(() => {
    if (viewType === 'broadcast' && data) {
      useDraftStore.getState().loadCanvasFromEncodedData(data);
    }
  }, [viewType, data]); // Run only when these params change (effectively once on load)

  if (viewType === 'broadcast' && canvasId) {
    // The store is now populated with the canvas from 'data' if it was present.
    // BroadcastView will find it in the store.
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BroadcastView targetCanvasId={canvasId} />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
          <Suspense fallback={<LoadingScreen />}>
            {/* Updated Routes */}
            <Routes>
              <Route path="/technical" element={<TechnicalInterface />} />
              <Route path="/studio" element={<StudioInterface />} />
              <Route path="/" element={<Navigate to="/technical" replace />} /> {/* Default to technical */}
              <Route path="*" element={<Navigate to="/technical" replace />} /> {/* Catch all to technical */}
            </Routes>
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;

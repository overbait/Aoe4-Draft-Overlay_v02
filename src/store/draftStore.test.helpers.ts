import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DraftStore } from './draftStore'; // Import the type
import { initialCombinedState } from './draftStore'; // Import the initial state

// Create a version of the store without the persist middleware for testing
export const useTestStore = create<DraftStore>()(
  devtools(
    (set, get) => ({
      ...initialCombinedState,
      // You might need to mock or provide implementations for the actions
      // For now, let's just spread the initial state and add a dummy action
      highlightedAction: 0,
      connectToDraft: async () => true,
      disconnectDraft: () => {},
      reconnectDraft: async () => true,
      extractDraftIdFromUrl: () => null,
      setHostName: () => {},
      setGuestName: () => {},
      switchPlayerSides: () => {},
      incrementScore: () => {},
      decrementScore: () => {},
      saveCurrentAsPreset: () => {},
      loadPreset: async () => {},
      deletePreset: () => {},
      updatePresetName: () => {},
      setBoxSeriesFormat: () => {},
      updateBoxSeriesGame: () => {},
      setGameWinner: () => {},
      toggleBoxSeriesGameVisibility: () => {},
      _resetCurrentSessionState: () => {},
      _updateActivePresetIfNeeded: () => {},
      addStudioElement: () => {},
      updateStudioElementPosition: () => {},
      updateStudioElementSize: () => {},
      setSelectedElementId: () => {},
      updateStudioElementSettings: () => {},
      removeStudioElement: () => {},
      saveCurrentStudioLayout: () => {},
      loadStudioLayout: () => {},
      deleteStudioLayout: () => {},
      updateStudioLayoutName: () => {},
      setHostColor: () => {},
      setGuestColor: () => {},
      setHostFlag: () => {},
      setGuestFlag: () => {},
      setActiveCanvas: () => {},
      addCanvas: () => {},
      removeCanvas: () => {},
      updateCanvasName: () => {},
      setCanvasBackgroundColor: () => {},
      setActiveStudioLayoutId: () => {},
      toggleCanvasBroadcastBorder: () => {},
      importLayoutsFromFile: () => {},
      loadCanvasFromEncodedData: () => {},
      connectToWebSocket: () => {},
      disconnectWebSocket: () => {},
      resetActiveCanvasLayout: () => {},
    }),
    { name: 'test-draft-store' }
  )
);

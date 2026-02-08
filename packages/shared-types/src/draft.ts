export interface SavedPreset {
  id: string;
  name: string;
  civDraftId: string | null;
  mapDraftId: string | null;
  hostName: string;
  guestName: string;
  scores: { host: number; guest: number };
  boxSeriesFormat: 'bo1' | 'bo3' | 'bo5' | 'bo7' | null;
  boxSeriesGames: BoxSeriesGame[];
  hostColor?: string | null;
  guestColor?: string | null;
  hostFlag?: string | null;
  guestFlag?: string | null;
}

export interface BoxSeriesGame {
  map: string | null;
  hostCiv: string | null;
  guestCiv: string | null;
  winner: 'host' | 'guest' | null;
  isVisible?: boolean;
}

export interface Aoe2cmRawDraftData {
  id?: string;
  draftId?: string;
  nameHost?: string;
  nameGuest?: string;
  preset?: {
    name?: string;
    turns?: Array<{ player: string; action: string }>;
    draftOptions?: Array<{ id: string; name: string }>;
  };
  events?: Array<{
    actionType?: string;
    executingPlayer?: string;
    chosenOptionId?: string;
    offset?: number;
  }>;
  nextAction?: number;
  status?: string;
  ongoing?: boolean;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'live'
  | 'reconnecting';

export interface SingleDraftData {
  id: string;
  hostName: string;
  guestName: string;
  civPicksHost: string[];
  civBansHost: string[];
  civPicksGuest: string[];
  civBansGuest: string[];
  mapPicksHost: string[];
  mapBansHost: string[];
  mapPicksGuest: string[];
  mapBansGuest: string[];
  mapPicksGlobal: string[];
  mapBansGlobal: string[];
  status: 'inProgress' | 'completed' | 'unknown';
  currentTurnPlayer?: string;
  currentAction?: string;
}

export interface MapItem {
  name: string;
  status: 'picked' | 'banned' | 'affected' | 'default' | 'adminPicked';
  imageUrl?: string;
}

export interface StudioElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontFamily?: string;
  fontFamilyGameTitle?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  scale?: number;
  isPivotLocked?: boolean;
  pivotInternalOffset?: number;
  showCivNames?: boolean;
  showMapNames?: boolean;
  deciderMapTitle?: string;
  showTitle?: boolean;
  showText?: boolean;
  gameEntrySpacing?: number;
  hideCivs?: boolean;
  hideMaps?: boolean;
  hideGameXText?: boolean;
  imageUrl?: string | null;
  opacity?: number;
  stretch?: 'cover' | 'contain' | 'fill';
  showGlow?: boolean;
  glowColor?: string;
  player1MapPool?: MapItem[];
  player2MapPool?: MapItem[];
  horizontalSplitOffset?: number;
  [key: string]: unknown;
}

export interface StudioCanvas {
  id: string;
  name: string;
  layout: StudioElement[];
  backgroundColor?: string | null;
  showBroadcastBorder?: boolean;
}

export interface SavedStudioLayout {
  id: string;
  name: string;
  canvases: StudioCanvas[];
  activeCanvasId: string | null;
}

export interface LastDraftAction {
  item: string;
  itemType: 'civ' | 'map';
  action: 'pick' | 'ban' | 'reveal';
  player: 'host' | 'guest' | 'none';
  index: number;
  timestamp: number;
  id?: string;
}

export interface CombinedDraftState {
  civDraftId: string | null;
  mapDraftId: string | null;
  hostName: string;
  guestName: string;
  scores: { host: number; guest: number };
  civPicksHost: string[];
  civBansHost: string[];
  civPicksGuest: string[];
  civBansGuest: string[];
  mapPicksHost: string[];
  mapBansHost: string[];
  mapPicksGuest: string[];
  mapBansGuest: string[];
  mapPicksGlobal: string[];
  mapBansGlobal: string[];
  civDraftStatus: ConnectionStatus;
  civDraftError: string | null;
  isLoadingCivDraft: boolean;
  mapDraftStatus: ConnectionStatus;
  mapDraftError: string | null;
  isLoadingMapDraft: boolean;
  socketStatus: ConnectionStatus;
  socketError: string | null;
  socketDraftType: 'civ' | 'map' | null;
  savedPresets: SavedPreset[];
  activePresetId: string | null;
  boxSeriesFormat: 'bo1' | 'bo3' | 'bo5' | 'bo7' | null;
  boxSeriesGames: BoxSeriesGame[];
  hostColor?: string | null;
  guestColor?: string | null;
  hostFlag?: string | null;
  guestFlag?: string | null;
  aoe2cmRawDraftOptions?: Aoe2cmRawDraftData['preset']['draftOptions'];
  currentCanvases: StudioCanvas[];
  activeCanvasId: string | null;
  savedStudioLayouts: SavedStudioLayout[];
  selectedElementId: string | null;
  activeStudioLayoutId: string | null;
  layoutLastUpdated?: number;
  draftIsLikelyFinished?: boolean;
  isNewSessionAwaitingFirstDraft: boolean;
  lastDraftAction: LastDraftAction | null;
  invalidDraftIds?: string[];
  revealedBans?: Array<string | number>;
}

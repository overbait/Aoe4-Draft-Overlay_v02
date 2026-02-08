export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export interface ProjectState {
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
    civ: { id: string | null; status: string; error: string | null };
    map: { id: string | null; status: string; error: string | null };
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
    canvases: Canvas[];
    savedLayouts: SavedLayout[];
  };
}

export interface Canvas {
  id: string;
  name: string;
  backgroundColor?: string | null;
  showBroadcastBorder?: boolean;
  layout: ElementItem[];
}

export interface SavedLayout {
  id: string;
  name: string;
  canvases: Canvas[];
  activeCanvasId: string | null;
}

export interface ElementItem {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  scale?: number;
  textColor?: string;
  showGlow?: boolean;
  showText?: boolean;
  deciderMapTitle?: string;
  glowColor?: string;
}

export interface LayoutImportPayload {
  savedLayouts: SavedLayout[];
  activeCanvasId: string | null;
  currentCanvases: Canvas[];
}

export type SpectateDraftType = 'civ' | 'map';

export interface SpectateMatch {
  id: string;
  draftId: string;
  draftType: SpectateDraftType | null;
  hostName: string | null;
  guestName: string | null;
  format: 'bo1' | 'bo3' | 'bo5' | 'bo7' | null;
  title: string | null;
  url: string | null;
  source: 'api' | 'scrape';
  lastSeen: string;
}

export interface SpectateWatchlist {
  players: string[];
  formats: Array<'bo1' | 'bo3' | 'bo5' | 'bo7'>;
  draftTypes: SpectateDraftType[];
}

export interface SpectateStatus {
  matches: SpectateMatch[];
  totalMatches: number;
  watchlist: SpectateWatchlist;
  lastUpdated: string | null;
  source: 'api' | 'scrape' | null;
  lastError: string | null;
}

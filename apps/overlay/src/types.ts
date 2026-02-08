export interface RenderStatePayload {
  projectId: string;
  timestamp: number;
  renderState: {
    session: {
      hostName: string;
      guestName: string;
      scores: { host: number; guest: number };
      hostColor: string | null;
      guestColor: string | null;
      hostFlag: string | null;
      guestFlag: string | null;
    };
    draft: {
      civ: {
        picksHost: string[];
        bansHost: string[];
        picksGuest: string[];
        bansGuest: string[];
        picksGlobal: string[];
      };
      map: {
        picksHost: string[];
        bansHost: string[];
        picksGuest: string[];
        bansGuest: string[];
        picksGlobal: string[];
        bansGlobal: string[];
      };
      status: {
        civ: string;
        map: string;
      };
    };
    series: {
      format: string | null;
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
      canvases: Array<{
        id: string;
        name: string;
        backgroundColor: string | null;
        showBroadcastBorder?: boolean;
        elements: Array<{
          id: string;
          type: string;
          position: { x: number; y: number };
          size: { width: number; height: number };
          scale?: number;
          fontFamily?: string;
          textColor?: string;
          showGlow?: boolean;
          showText?: boolean;
          deciderMapTitle?: string;
          glowColor?: string;
          imageUrl?: string | null;
          opacity?: number;
        }>;
      }>;
    };
  };
}

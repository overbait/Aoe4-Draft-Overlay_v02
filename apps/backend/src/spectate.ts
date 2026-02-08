import axios from 'axios';
import puppeteer from 'puppeteer';

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

interface SpectateServiceState {
  matches: SpectateMatch[];
  watchlist: SpectateWatchlist;
  lastUpdated: string | null;
  lastError: string | null;
  source: 'api' | 'scrape' | null;
}

const DEFAULT_API_URL = process.env.AOE2CM_LIVE_API_URL || 'https://aoe2cm.net/api/live';
const DEFAULT_SCRAPE_URL = process.env.AOE2CM_SPECTATE_URL || 'https://aoe2cm.net/spectate';
const POLL_INTERVAL_MS = Number(process.env.SPECTATE_POLL_INTERVAL_MS || 30000);

const normalizeString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const normalizeDraftType = (value: unknown): SpectateDraftType | null => {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  if (lower === 'civ' || lower === 'civilization' || lower === 'civilisations') return 'civ';
  if (lower === 'map') return 'map';
  return null;
};

const normalizeFormat = (value: unknown): SpectateMatch['format'] => {
  if (typeof value !== 'string') return null;
  const lower = value.toLowerCase();
  if (['bo1', 'bo3', 'bo5', 'bo7'].includes(lower)) {
    return lower as SpectateMatch['format'];
  }
  return null;
};

const extractDraftIdFromText = (value: string): string | null => {
  const draftMatch = /\/draft\/([a-zA-Z0-9_-]+)/.exec(value);
  if (draftMatch?.[1]) return draftMatch[1];
  const observerMatch = /\/observer\/([a-zA-Z0-9_-]+)/.exec(value);
  if (observerMatch?.[1]) return observerMatch[1];
  if (/^[a-zA-Z0-9_-]{4,}$/.test(value)) return value;
  return null;
};

const buildMatch = (partial: Omit<SpectateMatch, 'id'>): SpectateMatch => ({
  ...partial,
  id: `${partial.draftId}:${partial.draftType ?? 'unknown'}`,
});

const parseApiMatches = (data: unknown): SpectateMatch[] => {
  const candidateArrays = [
    Array.isArray(data) ? data : null,
    (data as { matches?: unknown[] })?.matches,
    (data as { data?: unknown[] })?.data,
    (data as { drafts?: unknown[] })?.drafts,
    (data as { live?: unknown[] })?.live,
  ].filter(Array.isArray);
  const candidates = candidateArrays.find(list => list.length > 0) ?? candidateArrays[0] ?? [];

  return candidates
    .map(entry => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const rawId = normalizeString(record.draftId) ||
        normalizeString(record.draft_id) ||
        normalizeString(record.id) ||
        normalizeString(record.draft);
      const url = normalizeString(record.url) || normalizeString(record.link) || null;
      const draftId = rawId || (url ? extractDraftIdFromText(url) : null);
      if (!draftId) return null;
      const hostName =
        normalizeString(record.hostName) ||
        normalizeString(record.host) ||
        normalizeString(record.player1) ||
        normalizeString(record.playerA);
      const guestName =
        normalizeString(record.guestName) ||
        normalizeString(record.guest) ||
        normalizeString(record.player2) ||
        normalizeString(record.playerB);
      const format = normalizeFormat(record.format ?? record.series ?? record.bo);
      const draftType = normalizeDraftType(record.draftType ?? record.type ?? record.mode);
      const title = normalizeString(record.title) ||
        (hostName && guestName ? `${hostName} vs ${guestName}` : null);
      return buildMatch({
        draftId,
        draftType,
        hostName,
        guestName,
        format,
        title,
        url,
        source: 'api',
        lastSeen: new Date().toISOString(),
      });
    })
    .filter((match): match is SpectateMatch => Boolean(match));
};

const scrapeMatches = async (): Promise<SpectateMatch[]> => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(DEFAULT_SCRAPE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map(anchor => ({
        href: anchor.href,
        text: anchor.textContent?.trim() || '',
      }))
    );

    return links
      .map(link => {
        const draftId = extractDraftIdFromText(link.href);
        if (!draftId) return null;
        const title = link.text || null;
        return buildMatch({
          draftId,
          draftType: null,
          hostName: null,
          guestName: null,
          format: null,
          title,
          url: link.href,
          source: 'scrape',
          lastSeen: new Date().toISOString(),
        });
      })
      .filter((match): match is SpectateMatch => Boolean(match));
  } finally {
    await browser.close();
  }
};

const dedupeMatches = (matches: SpectateMatch[]): SpectateMatch[] => {
  const seen = new Map<string, SpectateMatch>();
  for (const match of matches) {
    if (!seen.has(match.draftId)) {
      seen.set(match.draftId, match);
    }
  }
  return Array.from(seen.values());
};

const matchesWatchlist = (match: SpectateMatch, watchlist: SpectateWatchlist) => {
  if (watchlist.players.length > 0) {
    const haystack = [match.hostName, match.guestName, match.title]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const hasPlayer = watchlist.players.some(player => haystack.includes(player.toLowerCase()));
    if (!hasPlayer) return false;
  }
  if (watchlist.formats.length > 0 && match.format && !watchlist.formats.includes(match.format)) {
    return false;
  }
  if (watchlist.formats.length > 0 && !match.format) return false;
  if (watchlist.draftTypes.length > 0 && match.draftType && !watchlist.draftTypes.includes(match.draftType)) {
    return false;
  }
  if (watchlist.draftTypes.length > 0 && !match.draftType) return false;
  return true;
};

const defaultWatchlist: SpectateWatchlist = {
  players: [],
  formats: [],
  draftTypes: [],
};

export const startSpectateService = () => {
  const state: SpectateServiceState = {
    matches: [],
    watchlist: { ...defaultWatchlist },
    lastUpdated: null,
    lastError: null,
    source: null,
  };

  const refresh = async () => {
    try {
      const response = await axios.get(DEFAULT_API_URL, { timeout: 10000 });
      const matches = parseApiMatches(response.data);
      if (matches.length > 0) {
        state.matches = dedupeMatches(matches);
        state.source = 'api';
        state.lastUpdated = new Date().toISOString();
        state.lastError = null;
        return;
      }
      throw new Error('No matches found via API');
    } catch (error) {
      try {
        const scraped = await scrapeMatches();
        state.matches = dedupeMatches(scraped);
        state.source = 'scrape';
        state.lastUpdated = new Date().toISOString();
        state.lastError = null;
      } catch (scrapeError) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const scrapeMessage = scrapeError instanceof Error ? scrapeError.message : 'Unknown error';
        state.lastError = `API failure: ${message}; scrape failure: ${scrapeMessage}`;
      }
    }
  };

  refresh();
  const timer = setInterval(refresh, POLL_INTERVAL_MS);

  const getMatches = () => state.matches.filter(match => matchesWatchlist(match, state.watchlist));
  const getAllMatches = () => state.matches;
  const getWatchlist = () => state.watchlist;
  const updateWatchlist = (payload: Partial<SpectateWatchlist>) => {
    state.watchlist = {
      players: Array.isArray(payload.players) ? payload.players : state.watchlist.players,
      formats: Array.isArray(payload.formats) ? payload.formats : state.watchlist.formats,
      draftTypes: Array.isArray(payload.draftTypes) ? payload.draftTypes : state.watchlist.draftTypes,
    };
  };
  const getLastUpdated = () => state.lastUpdated;
  const getSource = () => state.source;
  const getLastError = () => state.lastError;

  const stop = () => clearInterval(timer);

  return {
    refresh,
    getMatches,
    getAllMatches,
    getWatchlist,
    updateWatchlist,
    getLastUpdated,
    getSource,
    getLastError,
    stop,
  };
};

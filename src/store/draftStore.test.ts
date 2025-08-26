import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTestStore } from './draftStore.test.helpers';
import { Aoe2cmRawDraftData } from '../types/draft'; // Adjust path if necessary
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
};

// Raw draft data fetched from https://aoe2cm.net/api/draft/kIqET
const mockDraft_kIqET: Aoe2cmRawDraftData = {
  nextAction: 11,
  events: [
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'Holy Island', isRandomlyChosen: false, offset: 8613 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'Relic River', isRandomlyChosen: false, offset: 17324 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'pick', chosenOptionId: 'Coastal Cliffs', isRandomlyChosen: false, offset: 23375 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'pick', chosenOptionId: 'Kawasan', isRandomlyChosen: false, offset: 33237 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'Carmel', isRandomlyChosen: false, offset: 36474 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'Kerlaugar', isRandomlyChosen: false, offset: 43502 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'pick', chosenOptionId: 'Dry Arabia', isRandomlyChosen: false, offset: 50656 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'pick', chosenOptionId: 'Four Lakes', isRandomlyChosen: false, offset: 56856 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'Baldland', isRandomlyChosen: false, offset: 64317 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'Gorge', isRandomlyChosen: false, offset: 77674 },
    { player: 'NONE', executingPlayer: 'NONE', actionType: 'pick', chosenOptionId: 'Regions', isRandomlyChosen: false, offset: 79676 }
  ],
  fixedNames: false,
  nameHost: 'Numudan',
  nameGuest: '3D!Scatterbrained',
  preset: {
    name: 'M.o.S. Bo5 Map Draft',
    presetId: 'dihCw',
    draftOptions: [
      { id: 'Dry Arabia', name: 'Dry Arabia', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Baldland', name: 'Baldland', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Gorge', name: 'Gorge', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Regions', name: 'Regions', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Holy Island', name: 'Holy Island', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Four Lakes', name: 'Four Lakes', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Kawasan', name: 'Kawasan', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Coastal Cliffs', name: 'Coastal Cliffs', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Carmel', name: 'Carmel', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Relic River', name: 'Relic River', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' },
      { id: 'Kerlaugar', name: 'Kerlaugar', imageUrls: { unit: '', emblem: '', animated_left: '', animated_right: '' }, i18nPrefix: 'civs.', category: 'default' }
    ],
    turns: [ /* Simplified for brevity */ ],
    categoryLimits: { pick: {}, ban: {} }
  },
  hostConnected: false, guestConnected: false, hostReady: true, guestReady: true, startTimestamp: 0
};

describe('draftStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test run
    useTestStore.getState()._resetCurrentSessionState();
    mockedAxios.get.mockClear();
  });

  it('should assign the last remaining map to mapPicksGlobal and the last game in a BoX series', async () => {
    // Mock the API call for kIqET draft
    mockedAxios.get.mockResolvedValue({ data: mockDraft_kIqET });

    // Set BO5 format (as per preset name "M.o.S. Bo5 Map Draft")
    useTestStore.getState().setBoxSeriesFormat('bo5');

    // Connect to the draft
    const connectResult = await useTestStore.getState().connectToDraft('kIqET', 'map');
    expect(connectResult).toBe(true);

    const state = useTestStore.getState();

    // Verify that "Regions" (from "NONE" pick event) is in mapPicksGlobal
    expect(state.mapPicksGlobal).toContain('Regions');

    // Verify the 5th game's map (index 4)
    expect(state.boxSeriesGames).toBeDefined();
    expect(state.boxSeriesGames.length).toBeGreaterThanOrEqual(5);
    expect(state.boxSeriesGames[4]?.map).toBe('Regions');
  });
});

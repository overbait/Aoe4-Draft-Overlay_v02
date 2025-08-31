import useDraftStore from './draftStore';
import { Aoe2cmRawDraftData } from '../types/draft';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    // Reset store to initial state before each test
    const { _resetCurrentSessionState } = useDraftStore.getState();
    _resetCurrentSessionState();
    mockedAxios.get.mockClear();
  });

  test('should correctly assign the last remaining map to global picks', async () => {
    // Mock the API call for kIqET draft
    mockedAxios.get.mockResolvedValue({ data: mockDraft_kIqET });

    // Set BO5 format to initialize the boxSeriesGames array
    useDraftStore.getState().setBoxSeriesFormat('bo5');

    // Connect to the draft
    const connectResult = await useDraftStore.getState().connectToDraft('kIqET', 'map');
    expect(connectResult).toBe(true);

    const state = useDraftStore.getState();

    // Verify that "Regions" (from "NONE" pick event) is in mapPicksGlobal
    expect(state.mapPicksGlobal).toContain('Regions');

    // Verify the 5th game's map (index 4)
    expect(state.boxSeriesGames).toHaveLength(5);
    expect(state.boxSeriesGames[4]?.map).toBe('Regions');
  });

  test('should merge civ and map drafts without losing state', async () => {
    const civDraftData: Aoe2cmRawDraftData = {
      nameHost: 'PlayerA',
      nameGuest: 'PlayerB',
      events: [{ executingPlayer: 'HOST', actionType: 'pick', chosenOptionId: 'aoe4.English' }]
    };
    const mapDraftData: Aoe2cmRawDraftData = {
      // No names in this one
      events: [{ executingPlayer: 'GUEST', actionType: 'pick', chosenOptionId: 'some-map.Lipany' }]
    };

    // 1. Import Civ Draft
    mockedAxios.get.mockResolvedValue({ data: civDraftData });
    await useDraftStore.getState().connectToDraft('civDraftId', 'civ');

    let state = useDraftStore.getState();
    expect(state.hostName).toBe('PlayerA');
    expect(state.guestName).toBe('PlayerB');
    expect(state.civPicksHost).toContain('English');
    expect(state.mapPicksGuest).toEqual([]);

    // 2. Import Map Draft
    mockedAxios.get.mockResolvedValue({ data: mapDraftData });
    await useDraftStore.getState().connectToDraft('mapDraftId', 'map');

    state = useDraftStore.getState();

    // Verify that map data is present AND civ data is preserved
    expect(state.mapPicksGuest).toContain('Lipany');
    expect(state.civPicksHost).toContain('English'); // Check that civ picks are still there
    expect(state.hostName).toBe('PlayerA'); // Check that player names are preserved
  });
});

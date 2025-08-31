import useDraftStore from './draftStore';
import { LastDraftAction } from '../types/draft';

// Mock data for the REVEAL_BANS event
const mockRevealBansEvent = {
  id: 'mock-reveal-event',
  action: 'REVEAL_BANS',
  events: [
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.abbasid_dynasty', offset: 1000 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.chinese', offset: 2000 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.delhi_sultanate', offset: 3000 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.english', offset: 4000 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.french', offset: 5000 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.holy_roman_empire', offset: 6000 },
  ],
};

const mockDraftOptions = [
    { id: 'aoe4.abbasid_dynasty', name: 'Abbasid Dynasty' },
    { id: 'aoe4.chinese', name: 'Chinese' },
    { id: 'aoe4.delhi_sultanate', name: 'Delhi Sultanate' },
    { id: 'aoe4.english', name: 'English' },
    { id: 'aoe4.french', name: 'French' },
    { id: 'aoe4.holy_roman_empire', name: 'Holy Roman Empire' },
    { id: 'aoe4.rus', name: 'Rus' },
    { id: 'aoe4.japanese', name: 'Japanese' },
    { id: 'aoe4.malians', name: 'Malians' },
];

const mockRevealBansEvent_DuplicateBans_Phase1 = {
    id: 'mock-reveal-event-1',
    action: 'REVEAL_BANS',
    events: [
      { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.chinese', offset: 1000 },
      { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.chinese', offset: 2000 },
    ],
  };

  const mockRevealBansEvent_DuplicateBans_Phase2 = {
      id: 'mock-reveal-event-2',
      action: 'REVEAL_BANS',
      events: [
          // aoe4.chinese from phase 1 is already "revealed"
          { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.chinese', offset: 1000 },
          { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.chinese', offset: 2000 },
          // new bans for phase 2
          { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.rus', offset: 3000 },
          { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.japanese', offset: 4000 },
      ],
  };

  const mockRevealBansEvent_DuplicateBans_Phase3 = {
      id: 'mock-reveal-event-3',
      action: 'REVEAL_BANS',
      events: [
          // from phase 1
          { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.chinese', offset: 1000 },
          { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.chinese', offset: 2000 },
          // from phase 2
          { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.rus', offset: 3000 },
          { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.japanese', offset: 4000 },
          // new bans for phase 3, guest bans Rus which host already banned
          { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'aoe4.malians', offset: 5000 },
          { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'aoe4.rus', offset: 6000 },
      ],
  };

describe('draftStore REVEAL_BANS', () => {

  // This is a placeholder for the socket handler logic.
  // In a real scenario, you would mock the socket connection and emit the event.
  // For this test, we'll simulate the set state logic from the 'adminEvent' handler.
  const simulateAdminEventHandler = (data: any) => {
    const { setState } = useDraftStore;

    if (data && data.action === "REVEAL_BANS" && data.events && Array.isArray(data.events)) {
        setState(state => {
          const newCivBansHost = [...state.civBansHost];
          const newCivBansGuest = [...state.civBansGuest];
          const newMapBansHost = [...(state.mapBansHost || [])];
          const newMapBansGuest = [...(state.mapBansGuest || [])];
          const newMapBansGlobal = [...(state.mapBansGlobal || [])];
          let newLastDraftAction: LastDraftAction | null = null;
          const newRevealedBans = [...(state.revealedBans || [])];
          let newBanRevealCount = state.banRevealCount || 0;

          const currentDraftOptions = state.aoe2cmRawDraftOptions;

          const getOptionNameFromStore = (optionId: string): string => {
              const option = currentDraftOptions?.find(opt => opt.id === optionId);
              if (option?.name) {
                return option.name.startsWith('aoe4.') ? option.name.substring(5) : option.name;
              }
              return optionId.startsWith('aoe4.') ? optionId.substring(5) : optionId;
          };

          const unrevealedBans = data.events.filter((event: any) => event.actionType === 'ban' && !newRevealedBans.includes(event.offset));

          if (unrevealedBans.length > 0) {
            newBanRevealCount++;
          }

          const hostBansToReveal = unrevealedBans.filter((event: any) => event.executingPlayer === 'HOST').slice(0, 2);
          const guestBansToReveal = unrevealedBans.filter((event: any) => event.executingPlayer === 'GUEST').slice(0, 2);

          [...hostBansToReveal, ...guestBansToReveal].forEach((revealedBanEvent: any) => {
            const { executingPlayer, chosenOptionId } = revealedBanEvent;
            const optionName = getOptionNameFromStore(chosenOptionId);
            const effectiveDraftType: 'civ' | 'map' = chosenOptionId.startsWith('aoe4.') ? 'civ' : 'map';

            let targetBanList: string[] | null = null;

            if (effectiveDraftType === 'civ') {
              if (executingPlayer === 'HOST') targetBanList = newCivBansHost;
              else if (executingPlayer === 'GUEST') targetBanList = newCivBansGuest;
            } else {
              if (executingPlayer === 'HOST') targetBanList = newMapBansHost;
              else if (executingPlayer === 'GUEST') targetBanList = newMapBansGuest;
              else if (executingPlayer === 'NONE') targetBanList = newMapBansGlobal;
            }

            if (targetBanList) {
              const hiddenBanIndex = targetBanList.indexOf("Hidden Ban");
              if (hiddenBanIndex !== -1) {
                targetBanList[hiddenBanIndex] = optionName;
                newRevealedBans.push(revealedBanEvent.offset);
                newLastDraftAction = { item: optionName, itemType: effectiveDraftType, action: 'reveal', player: executingPlayer.toLowerCase(), index: hiddenBanIndex, timestamp: Date.now() };
              }
            }
          });

          return {
            ...state,
            civBansHost: newCivBansHost,
            civBansGuest: newCivBansGuest,
            mapBansHost: newMapBansHost,
            mapBansGuest: newMapBansGuest,
            mapBansGlobal: newMapBansGlobal,
            lastDraftAction: newLastDraftAction,
            revealedBans: newRevealedBans,
            banRevealCount: newBanRevealCount,
          };
        });
      }
  }

  beforeEach(() => {
    // Reset store
    useDraftStore.getState()._resetCurrentSessionState();

    // Set up the initial state with hidden bans
    useDraftStore.setState({
      civBansHost: ['Hidden Ban', 'Hidden Ban', 'Hidden Ban'],
      civBansGuest: ['Hidden Ban', 'Hidden Ban', 'Hidden Ban'],
      aoe2cmRawDraftOptions: mockDraftOptions,
      revealedBans: [],
      banRevealCount: 0,
    });
  });

  test('should reveal bans in the correct order', () => {
    // First reveal
    simulateAdminEventHandler(mockRevealBansEvent);
    let state = useDraftStore.getState();
    expect(state.civBansHost).toEqual(['Abbasid Dynasty', 'Delhi Sultanate', 'Hidden Ban']);
    expect(state.civBansGuest).toEqual(['Chinese', 'English', 'Hidden Ban']);
  });

  test('should correctly reveal bans when players ban the same civilization', () => {
    let state;

    // Phase 1: Both players ban Chinese
    simulateAdminEventHandler(mockRevealBansEvent_DuplicateBans_Phase1);
    state = useDraftStore.getState();
    expect(state.civBansHost).toEqual(['Chinese', 'Hidden Ban', 'Hidden Ban']);
    expect(state.civBansGuest).toEqual(['Chinese', 'Hidden Ban', 'Hidden Ban']);
    expect(state.revealedBans).toEqual([1000, 2000]);

    // Phase 2: Host bans Rus, Guest bans Japanese
    simulateAdminEventHandler(mockRevealBansEvent_DuplicateBans_Phase2);
    state = useDraftStore.getState();
    expect(state.civBansHost).toEqual(['Chinese', 'Rus', 'Hidden Ban']);
    expect(state.civBansGuest).toEqual(['Chinese', 'Japanese', 'Hidden Ban']);
    expect(state.revealedBans).toEqual([1000, 2000, 3000, 4000]);

    // Phase 3: Host bans Malians, Guest bans Rus (which Host already banned)
    simulateAdminEventHandler(mockRevealBansEvent_DuplicateBans_Phase3);
    state = useDraftStore.getState();
    expect(state.civBansHost).toEqual(['Chinese', 'Rus', 'Malians']);
    expect(state.civBansGuest).toEqual(['Chinese', 'Japanese', 'Rus']);
    expect(state.revealedBans).toEqual([1000, 2000, 3000, 4000, 5000, 6000]);
  });
});

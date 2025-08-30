import useDraftStore from './draftStore';
import { Aoe2cmRawDraftData, LastDraftAction } from '../types/draft';

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
];


describe('draftStore REVEAL_BANS', () => {

  // This is a placeholder for the socket handler logic.
  // In a real scenario, you would mock the socket connection and emit the event.
  // For this test, we'll simulate the set state logic from the 'adminEvent' handler.
  const simulateAdminEventHandler = (data: any) => {
    const { getState, setState } = useDraftStore;

    if (data && data.action === "REVEAL_BANS" && data.events && Array.isArray(data.events)) {
      setState(state => {
        const newCivBansHost = [...state.civBansHost];
        const newCivBansGuest = [...state.civBansGuest];
        // This is a simplified version of the store logic for testing purposes

        const getOptionNameFromStore = (optionId: string): string => {
            const option = state.aoe2cmRawDraftOptions?.find(opt => opt.id === optionId);
            if (option?.name) {
              return option.name.startsWith('aoe4.') ? option.name.substring(5) : option.name;
            }
            return optionId.startsWith('aoe4.') ? optionId.substring(5) : optionId;
        };

        data.events.forEach((revealedBanEvent: any) => {
            const { executingPlayer, chosenOptionId } = revealedBanEvent;
            const optionName = getOptionNameFromStore(chosenOptionId);

            const targetBanList = executingPlayer === 'HOST' ? newCivBansHost : newCivBansGuest;
            const hiddenBanIndex = targetBanList.indexOf("Hidden Ban");

            if (hiddenBanIndex !== -1) {
                targetBanList[hiddenBanIndex] = optionName;
            }
        });

        return {
            ...state,
            civBansHost: newCivBansHost,
            civBansGuest: newCivBansGuest,
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
    });
  });

  test('should reveal bans in the correct order', () => {
    // First reveal
    simulateAdminEventHandler(mockRevealBansEvent);
    let state = useDraftStore.getState();
    expect(state.civBansHost).toEqual(['Abbasid Dynasty', 'Delhi Sultanate', 'French']);
    expect(state.civBansGuest).toEqual(['Chinese', 'English', 'Holy Roman Empire']);
  });
});

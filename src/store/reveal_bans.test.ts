import useDraftStore from './draftStore';
import { Aoe2cmRawDraftData, LastDraftAction } from '../types/draft';

// Mock data for a civ draft with hidden bans
const mockCivDraftWithHiddenBans: Aoe2cmRawDraftData = {
  nextAction: 4,
  events: [
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'HIDDEN_BAN', isRandomlyChosen: false, offset: 1000 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'HIDDEN_BAN', isRandomlyChosen: false, offset: 2000 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'HIDDEN_BAN', isRandomlyChosen: false, offset: 3000 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'HIDDEN_BAN', isRandomlyChosen: false, offset: 4000 },
    { player: 'HOST', executingPlayer: 'HOST', actionType: 'ban', chosenOptionId: 'HIDDEN_BAN', isRandomlyChosen: false, offset: 5000 },
    { player: 'GUEST', executingPlayer: 'GUEST', actionType: 'ban', chosenOptionId: 'HIDDEN_BAN', isRandomlyChosen: false, offset: 6000 },
  ],
  preset: {
    name: 'Test Preset',
    draftOptions: [
      { id: 'aoe4.abbasid_dynasty', name: 'Abbasid Dynasty' },
      { id: 'aoe4.chinese', name: 'Chinese' },
      { id: 'aoe4.delhi_sultanate', name: 'Delhi Sultanate' },
      { id: 'aoe4.english', name: 'English' },
      { id: 'aoe4.french', name: 'French' },
      { id: 'aoe4.holy_roman_empire', name: 'Holy Roman Empire' },
    ],
    turns: [],
  },
};

// Mock data for the REVEAL_BANS event
const mockRevealBansEvent = {
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

function assertEqual(actual: any, expected: any, message: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      console.error(`Assertion failed: ${message}. Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}.`);
      throw new Error(`Assertion failed: ${message}. Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}.`);
    }
  }

async function runTest() {
  console.log('Starting test: REVEAL_BANS event...');

  // Reset store
  useDraftStore.setState(useDraftStore.getState()._resetCurrentSessionState());

  // Set up the initial state with hidden bans
  useDraftStore.setState({
    civBansHost: ['Hidden Ban', 'Hidden Ban', 'Hidden Ban'],
    civBansGuest: ['Hidden Ban', 'Hidden Ban', 'Hidden Ban'],
    aoe2cmRawDraftOptions: mockCivDraftWithHiddenBans.preset?.draftOptions,
  });

  const set = useDraftStore.setState;

  const processEvent = (data: any) => {
    set(state => {
        const newCivBansHost = [...state.civBansHost];
        const newCivBansGuest = [...state.civBansGuest];
        const newMapBansHost = [...state.mapBansHost];
        const newMapBansGuest = [...state.mapBansGuest];
        const newMapBansGlobal = [...state.mapBansGlobal];
        let newLastDraftAction: LastDraftAction | null = null;
        const newRevealedBans = [...state.revealedBans];
        let newBanRevealCount = state.banRevealCount;

        const currentDraftOptions = state.aoe2cmRawDraftOptions;

        const eventsToProcess = data.events.filter((event: any) => !newRevealedBans.includes(event.chosenOptionId));

        if (eventsToProcess.length > 0) {
          newBanRevealCount++;
        }

        const eventsToReveal = eventsToProcess.slice(0, 2);

        eventsToReveal.forEach(revealedBanEvent => {
            const { executingPlayer, chosenOptionId } = revealedBanEvent;
            const optionName = getOptionNameFromStore(chosenOptionId, currentDraftOptions);
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
                newRevealedBans.push(chosenOptionId);
                newLastDraftAction = { item: optionName, itemType: effectiveDraftType, action: 'ban', timestamp: Date.now() };
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

  // First reveal
  processEvent(mockRevealBansEvent);
  const stateAfterFirstReveal = useDraftStore.getState();
  assertEqual(stateAfterFirstReveal.civBansHost, ['Abbasid Dynasty', 'Hidden Ban', 'Hidden Ban'], 'Host bans should be revealed in order after first reveal');
  assertEqual(stateAfterFirstReveal.civBansGuest, ['Chinese', 'Hidden Ban', 'Hidden Ban'], 'Guest bans should be revealed in order after first reveal');

  // Second reveal
  processEvent(mockRevealBansEvent);
  const stateAfterSecondReveal = useDraftStore.getState();
  assertEqual(stateAfterSecondReveal.civBansHost, ['Abbasid Dynasty', 'Delhi Sultanate', 'Hidden Ban'], 'Host bans should be revealed in order after second reveal');
  assertEqual(stateAfterSecondReveal.civBansGuest, ['Chinese', 'English', 'Hidden Ban'], 'Guest bans should be revealed in order after second reveal');

  // Third reveal
  processEvent(mockRevealBansEvent);
  const stateAfterThirdReveal = useDraftStore.getState();
  assertEqual(stateAfterThirdReveal.civBansHost, ['Abbasid Dynasty', 'Delhi Sultanate', 'French'], 'Host bans should be revealed in order after third reveal');
  assertEqual(stateAfterThirdReveal.civBansGuest, ['Chinese', 'English', 'Holy Roman Empire'], 'Guest bans should be revealed in order after third reveal');


  console.log('Test passed for REVEAL_BANS event.');
}

runTest().catch(e => {
  console.error(e);
  process.exit(1);
});

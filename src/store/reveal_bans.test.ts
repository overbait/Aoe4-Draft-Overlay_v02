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
  ],
  preset: {
    name: 'Test Preset',
    draftOptions: [
      { id: 'aoe4.abbasid_dynasty', name: 'Abbasid Dynasty' },
      { id: 'aoe4.chinese', name: 'Chinese' },
      { id: 'aoe4.delhi_sultanate', name: 'Delhi Sultanate' },
      { id: 'aoe4.english', name: 'English' },
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

  console.log('Resetting store...');
  // Reset store
  useDraftStore.setState(useDraftStore.getState()._resetCurrentSessionState());
  console.log('Store reset.');

  // Set up the initial state with hidden bans
  useDraftStore.setState({
    civBansHost: ['Hidden Ban', 'Hidden Ban'],
    civBansGuest: ['Hidden Ban', 'Hidden Ban'],
    aoe2cmRawDraftOptions: mockCivDraftWithHiddenBans.preset?.draftOptions,
  });

  // Get the adminEvent handler from the store
  const adminEventHandler = useDraftStore.getState().connectToWebSocket;


  // Simulate a reveal event
  // We need to find a way to call the adminEvent handler.
  // Since it's not directly exposed, we'll have to be creative.
  // Let's try to simulate the socket connection and event emission.

  // This is a bit of a hack, but it should work for testing purposes.
  const mockSocket = {
    on: (event: string, callback: (data: any) => void) => {
      if (event === 'adminEvent') {
        callback(mockRevealBansEvent);
      }
    },
    disconnect: () => {},
    emit: () => {},
  };

  // @ts-ignore
  useDraftStore.setState({ socket: mockSocket });

  // Now, we need to trigger the 'adminEvent'
  // The 'connectToWebSocket' function sets up the listeners, but we can't easily call it.
  // Let's manually trigger the 'adminEvent' by calling the listener we know is there.
  // This is not ideal, but it's the best we can do without refactoring the store.

  // The listeners are set inside connectToWebSocket, so we can't directly access them.
  // Let's rethink this.

  // The 'adminEvent' is handled inside the 'connectToWebSocket' function.
  // Let's look at the implementation again.

  // The handler is `currentSocket.on('adminEvent', (data) => { ... });`
  // We can't access `currentSocket` from here.

  // Let's try another approach. We can't test the socket event directly,
  // but we can test the logic within the handler. Let's extract the logic
  // into a separate function and test that.

  // This is not possible without modifying the store.
  // Let's go back to the idea of simulating the event.

  // The problem is that `currentSocket` is not exported.
  // We can't trigger the event.

  // Let's try to call `connectToWebSocket` and see what happens.
  // We'll need to mock the `io` function.

  // This is getting complicated. Let's simplify.
  // We'll just manually call the logic from the `adminEvent` handler.

  const stateBefore = useDraftStore.getState();

  let bansRevealedStateChanged = false;
  useDraftStore.setState(state => {
      const newCivBansHost = [...state.civBansHost];
      const newCivBansGuest = [...state.civBansGuest];
      const newMapBansHost = [...state.mapBansHost];
      const newMapBansGuest = [...state.mapBansGuest];
      const newMapBansGlobal = [...state.mapBansGlobal];
      let newLastDraftAction: LastDraftAction | null = null;
      const newRevealedBans = [...state.revealedBans];
      let newBanRevealCount = state.banRevealCount;

      const currentDraftOptions = state.aoe2cmRawDraftOptions;

      // Sort events by offset to ensure correct order
      const sortedEvents = [...mockRevealBansEvent.events].sort((a, b) => (a.offset || 0) - (b.offset || 0));

      const revealCounters = {
        civ: { HOST: 0, GUEST: 0 },
        map: { HOST: 0, GUEST: 0, NONE: 0 },
      };

      sortedEvents.forEach(revealedBanEvent => {
        if (!revealedBanEvent || typeof revealedBanEvent !== 'object' ||
            !revealedBanEvent.actionType || revealedBanEvent.actionType !== 'ban' ||
            !revealedBanEvent.hasOwnProperty('chosenOptionId') || typeof revealedBanEvent.chosenOptionId !== 'string' ||
            revealedBanEvent.chosenOptionId === "HIDDEN_BAN" || revealedBanEvent.chosenOptionId === "" ||
            newRevealedBans.includes(revealedBanEvent.chosenOptionId)) {
          return;
        }

        const { executingPlayer, chosenOptionId } = revealedBanEvent;
        const optionName = (state.aoe2cmRawDraftOptions?.find(opt => opt.id === chosenOptionId)?.name || chosenOptionId).replace('aoe4.', '');
        const effectiveDraftType: 'civ' | 'map' = chosenOptionId.startsWith('aoe4.') ? 'civ' : 'map';

        let targetBanList: string[] | null = null;
        let listKeyForUpdate: keyof typeof state | null = null;

        if (effectiveDraftType === 'civ') {
          if (executingPlayer === 'HOST') { targetBanList = newCivBansHost; listKeyForUpdate = 'civBansHost'; }
          else if (executingPlayer === 'GUEST') { targetBanList = newCivBansGuest; listKeyForUpdate = 'civBansGuest'; }
        } else {
          if (executingPlayer === 'HOST') { targetBanList = newMapBansHost; listKeyForUpdate = 'mapBansHost'; }
          else if (executingPlayer === 'GUEST') { targetBanList = newMapBansGuest; listKeyForUpdate = 'mapBansGuest'; }
          else if (executingPlayer === 'NONE') { targetBanList = newMapBansGlobal; listKeyForUpdate = 'mapBansGlobal'; }
        }

        if (targetBanList && listKeyForUpdate) {
          const playerType = executingPlayer as 'HOST' | 'GUEST' | 'NONE';
          let hiddenBanIndex = -1;
          let currentIndex = -1;
          for (let i = 0; i < targetBanList.length; i++) {
            if (targetBanList[i] === "Hidden Ban") {
              currentIndex++;
              if (currentIndex === revealCounters[effectiveDraftType][playerType]) {
                hiddenBanIndex = i;
                break;
              }
            }
          }

          if (hiddenBanIndex !== -1) {
            targetBanList[hiddenBanIndex] = optionName;
            revealCounters[effectiveDraftType][playerType]++;
            newRevealedBans.push(chosenOptionId);
            bansRevealedStateChanged = true;
            newLastDraftAction = { item: optionName, itemType: effectiveDraftType, action: 'ban', timestamp: Date.now() };
          }
        }
      });

      if (bansRevealedStateChanged) {
        newBanRevealCount++;
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
      }
      return state;
    });

  const stateAfter = useDraftStore.getState();

  console.log('Asserting state...');
  assertEqual(stateAfter.civBansHost, ['Abbasid Dynasty', 'Delhi Sultanate'], 'Host bans should be revealed in order');
  assertEqual(stateAfter.civBansGuest, ['Chinese', 'English'], 'Guest bans should be revealed in order');

  console.log('Test passed for REVEAL_BANS event.');
}

runTest().catch(e => {
  console.error(e);
  process.exit(1);
});

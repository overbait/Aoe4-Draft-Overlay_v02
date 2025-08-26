import { describe, it, expect, beforeEach } from 'vitest';
import { useTestStore } from './draftStore.test.helpers';
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

const getOptionNameFromStore = (optionId: string, draftOptions: Aoe2cmRawDraftData['preset']['draftOptions'] | undefined): string => {
    if (!draftOptions) {
      return optionId.startsWith('aoe4.') ? optionId.substring(5) : optionId;
    }
    const option = draftOptions.find(opt => opt.id === optionId);
    if (option?.name) {
      return option.name.startsWith('aoe4.') ? option.name.substring(5) : option.name;
    }
    return optionId.startsWith('aoe4.') ? optionId.substring(5) : optionId;
  };

describe('reveal_bans', () => {
    beforeEach(() => {
        useTestStore.getState()._resetCurrentSessionState();
    });

    it('should reveal bans in order', () => {
        useTestStore.setState({
            civBansHost: ['Hidden Ban', 'Hidden Ban', 'Hidden Ban'],
            civBansGuest: ['Hidden Ban', 'Hidden Ban', 'Hidden Ban'],
            aoe2cmRawDraftOptions: mockCivDraftWithHiddenBans.preset?.draftOptions,
        });

        const processEvent = (data: any) => {
            useTestStore.setState(state => {
                const newCivBansHost = [...state.civBansHost];
                const newCivBansGuest = [...state.civBansGuest];
                let newLastDraftAction: LastDraftAction | null = null;
                const newRevealedBans = [...state.revealedBans];
                let newBanRevealCount = state.banRevealCount;

                const currentDraftOptions = state.aoe2cmRawDraftOptions;

                const unrevealedBans = data.events.filter((event: any) => event.actionType === 'ban' && !state.revealedBans.includes(event.chosenOptionId));

                if (unrevealedBans.length > 0) {
                  newBanRevealCount++;
                }

                const hostBansToReveal = unrevealedBans.filter((event: any) => event.executingPlayer === 'HOST').slice(0, 2);
                const guestBansToReveal = unrevealedBans.filter((event: any) => event.executingPlayer === 'GUEST').slice(0, 2);

                [...hostBansToReveal, ...guestBansToReveal].forEach(revealedBanEvent => {
                  const { executingPlayer, chosenOptionId } = revealedBanEvent;
                  const optionName = getOptionNameFromStore(chosenOptionId, currentDraftOptions);
                  const effectiveDraftType: 'civ' | 'map' = chosenOptionId.startsWith('aoe4.') ? 'civ' : 'map';

                  let targetBanList: string[] | null = null;

                  if (effectiveDraftType === 'civ') {
                    if (executingPlayer === 'HOST') targetBanList = newCivBansHost;
                    else if (executingPlayer === 'GUEST') targetBanList = newCivBansGuest;
                  }

                  if (targetBanList) {
                    const hiddenBanIndex = targetBanList.indexOf("Hidden Ban");
                    if (hiddenBanIndex !== -1) {
                      targetBanList[hiddenBanIndex] = optionName;
                      newRevealedBans.push(chosenOptionId);
                      newLastDraftAction = { item: optionName, itemType: effectiveDraftType, action: 'reveal', player: executingPlayer.toLowerCase(), index: hiddenBanIndex, timestamp: Date.now() };
                    }
                  }
                });

                return {
                  ...state,
                  civBansHost: newCivBansHost,
                  civBansGuest: newCivBansGuest,
                  lastDraftAction: newLastDraftAction,
                  revealedBans: newRevealedBans,
                  banRevealCount: newBanRevealCount,
                };
              });
        }

        // First reveal
        processEvent(mockRevealBansEvent);
        let state = useDraftStore.getState();
        expect(state.civBansHost).toEqual(['Abbasid Dynasty', 'Hidden Ban', 'Hidden Ban']);
        expect(state.civBansGuest).toEqual(['Chinese', 'Hidden Ban', 'Hidden Ban']);

        // Second reveal
        processEvent(mockRevealBansEvent);
        state = useDraftStore.getState();
        expect(state.civBansHost).toEqual(['Abbasid Dynasty', 'Delhi Sultanate', 'Hidden Ban']);
        expect(state.civBansGuest).toEqual(['Chinese', 'English', 'Hidden Ban']);

        // Third reveal
        processEvent(mockRevealBansEvent);
        state = useDraftStore.getState();
        expect(state.civBansHost).toEqual(['Abbasid Dynasty', 'Delhi Sultanate', 'French']);
        expect(state.civBansGuest).toEqual(['Chinese', 'English', 'Holy Roman Empire']);
    });
});

import { describe, expect, it } from 'vitest';
import { transformRawDataToSingleDraft } from '../transform';
import type { Aoe2cmRawDraftData } from '@aoe4/shared-types';

describe('transformRawDataToSingleDraft', () => {
  it('handles basic pick/ban events for host and guest (civ)', () => {
    const raw: Aoe2cmRawDraftData = {
      id: 'civ-test',
      nameHost: 'Alpha',
      nameGuest: 'Beta',
      preset: {
        draftOptions: [
          { id: 'aoe4.English', name: 'aoe4.English' },
          { id: 'aoe4.French', name: 'aoe4.French' },
        ],
      },
      events: [
        { actionType: 'pick', executingPlayer: 'HOST', chosenOptionId: 'aoe4.English' },
        { actionType: 'ban', executingPlayer: 'GUEST', chosenOptionId: 'aoe4.French' },
      ],
    };

    const result = transformRawDataToSingleDraft(raw);
    expect(result.civPicksHost).toEqual(['English']);
    expect(result.civBansGuest).toEqual(['French']);
    expect(result.civPicksGuest).toEqual([]);
    expect(result.mapPicksHost).toEqual([]);
  });

  it('handles map picks/bans including global picks', () => {
    const raw: Aoe2cmRawDraftData = {
      id: 'map-test',
      nameHost: 'Alpha',
      nameGuest: 'Beta',
      preset: {
        draftOptions: [
          { id: 'Dry Arabia', name: 'Dry Arabia' },
          { id: 'Hill and Dale', name: 'Hill and Dale' },
        ],
      },
      events: [
        { actionType: 'pick', executingPlayer: 'HOST', chosenOptionId: 'Dry Arabia' },
        { actionType: 'ban', executingPlayer: 'GUEST', chosenOptionId: 'Hill and Dale' },
        { actionType: 'pick', executingPlayer: 'NONE', chosenOptionId: 'Dry Arabia' },
      ],
    };

    const result = transformRawDataToSingleDraft(raw);
    expect(result.mapPicksHost).toEqual(['Dry Arabia']);
    expect(result.mapBansGuest).toEqual(['Hill and Dale']);
    expect(result.mapPicksGlobal).toEqual(['Dry Arabia']);
  });

  it('handles hidden bans for inferred draft type', () => {
    const raw: Aoe2cmRawDraftData = {
      id: 'hidden-ban',
      preset: {
        draftOptions: [{ id: 'aoe4.Rus', name: 'aoe4.Rus' }],
      },
      events: [
        { actionType: 'ban', executingPlayer: 'HOST', chosenOptionId: 'HIDDEN_BAN' },
      ],
    };

    const result = transformRawDataToSingleDraft(raw);
    expect(result.civBansHost).toEqual(['Hidden Ban']);
  });

  it('adds decider map when one map remains', () => {
    const raw: Aoe2cmRawDraftData = {
      id: 'decider-map',
      preset: {
        draftOptions: [
          { id: 'Dry Arabia', name: 'Dry Arabia' },
          { id: 'Hill and Dale', name: 'Hill and Dale' },
        ],
      },
      events: [
        { actionType: 'ban', executingPlayer: 'HOST', chosenOptionId: 'Dry Arabia' },
      ],
    };

    const result = transformRawDataToSingleDraft(raw);
    expect(result.mapPicksGlobal).toEqual(['Hill and Dale']);
  });

  it('ignores invalid events safely', () => {
    const raw: Aoe2cmRawDraftData = {
      id: 'invalid-events',
      events: [
        { actionType: 'pick', executingPlayer: 'HOST' },
        { executingPlayer: 'GUEST', chosenOptionId: 'aoe4.English' },
      ],
    };

    const result = transformRawDataToSingleDraft(raw);
    expect(result.civPicksHost).toEqual([]);
    expect(result.mapPicksHost).toEqual([]);
  });
});

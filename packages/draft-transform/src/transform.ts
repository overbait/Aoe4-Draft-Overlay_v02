import type { Aoe2cmRawDraftData, SingleDraftData } from '@aoe4/shared-types';

const EMPTY_DRAFT: SingleDraftData = {
  id: 'unknown-id',
  hostName: 'Player 1',
  guestName: 'Player 2',
  civPicksHost: [],
  civBansHost: [],
  civPicksGuest: [],
  civBansGuest: [],
  mapPicksHost: [],
  mapBansHost: [],
  mapPicksGuest: [],
  mapBansGuest: [],
  mapPicksGlobal: [],
  mapBansGlobal: [],
  status: 'unknown',
};

const getCleanOptionName = (id: string, nameFromPreset?: string): string => {
  const nameToProcess = nameFromPreset || id;
  if (!nameToProcess) return '';
  const dotIndex = nameToProcess.lastIndexOf('.');
  if (dotIndex !== -1 && dotIndex < nameToProcess.length - 1) {
    return nameToProcess.substring(dotIndex + 1);
  }
  return nameToProcess;
};

const getOptionNameFromRaw = (
  optionId: string,
  draftOptions: Aoe2cmRawDraftData['preset']['draftOptions'] | undefined
): string => {
  const option = draftOptions?.find(opt => opt.id === optionId);
  return getCleanOptionName(optionId, option?.name);
};

const inferDraftKind = (draftOptions?: Aoe2cmRawDraftData['preset']['draftOptions']): 'civ' | 'map' => {
  if (!draftOptions || draftOptions.length === 0) return 'map';
  return draftOptions.some(option => option.id?.startsWith('aoe4.')) ? 'civ' : 'map';
};

const ensureUniquePush = (list: string[], value: string) => {
  if (!list.includes(value)) list.push(value);
};

const applyPick = (
  output: SingleDraftData,
  draftKind: 'civ' | 'map',
  executingPlayer: string | undefined,
  optionName: string
) => {
  if (draftKind === 'civ') {
    if (executingPlayer === 'HOST') ensureUniquePush(output.civPicksHost, optionName);
    else if (executingPlayer === 'GUEST') ensureUniquePush(output.civPicksGuest, optionName);
  } else {
    if (executingPlayer === 'HOST') ensureUniquePush(output.mapPicksHost, optionName);
    else if (executingPlayer === 'GUEST') ensureUniquePush(output.mapPicksGuest, optionName);
    else if (executingPlayer === 'NONE') ensureUniquePush(output.mapPicksGlobal, optionName);
  }
};

const applyBan = (
  output: SingleDraftData,
  draftKind: 'civ' | 'map',
  executingPlayer: string | undefined,
  optionName: string
) => {
  if (draftKind === 'civ') {
    if (executingPlayer === 'HOST') ensureUniquePush(output.civBansHost, optionName);
    else if (executingPlayer === 'GUEST') ensureUniquePush(output.civBansGuest, optionName);
  } else {
    if (executingPlayer === 'HOST') ensureUniquePush(output.mapBansHost, optionName);
    else if (executingPlayer === 'GUEST') ensureUniquePush(output.mapBansGuest, optionName);
    else if (executingPlayer === 'NONE') ensureUniquePush(output.mapBansGlobal, optionName);
  }
};

const applySnipe = (
  output: SingleDraftData,
  draftKind: 'civ' | 'map',
  executingPlayer: string | undefined,
  optionName: string
) => {
  if (draftKind === 'civ') {
    if (executingPlayer === 'HOST') ensureUniquePush(output.civBansGuest, optionName);
    else if (executingPlayer === 'GUEST') ensureUniquePush(output.civBansHost, optionName);
  } else {
    if (executingPlayer === 'HOST') ensureUniquePush(output.mapBansGuest, optionName);
    else if (executingPlayer === 'GUEST') ensureUniquePush(output.mapBansHost, optionName);
  }
};

const resolveStatus = (raw: Aoe2cmRawDraftData): SingleDraftData['status'] => {
  if (raw.preset?.turns && typeof raw.nextAction === 'number') {
    return raw.nextAction >= raw.preset.turns.length ? 'completed' : 'inProgress';
  }
  if (raw.status) {
    const normalized = raw.status.toLowerCase();
    if (normalized.includes('complete')) return 'completed';
    if (normalized.includes('progress')) return 'inProgress';
  }
  if (raw.ongoing === false) return 'completed';
  if (raw.ongoing === true) return 'inProgress';
  return 'unknown';
};

const resolveCurrentTurn = (raw: Aoe2cmRawDraftData, output: SingleDraftData) => {
  if (!raw.preset?.turns || typeof raw.nextAction !== 'number') return;
  const currentTurnInfo = raw.preset.turns[raw.nextAction];
  if (!currentTurnInfo) return;
  output.currentTurnPlayer =
    currentTurnInfo.player === 'HOST'
      ? output.hostName
      : currentTurnInfo.player === 'GUEST'
        ? output.guestName
        : 'None';
  output.currentAction = currentTurnInfo.action?.toUpperCase().replace('G', '');
};

const applyDeciderMap = (output: SingleDraftData, raw: Aoe2cmRawDraftData) => {
  const mapOptions = raw.preset?.draftOptions
    ?.filter(option => option.id && !option.id.startsWith('aoe4.'))
    .map(option => getCleanOptionName(option.id, option.name))
    .filter(Boolean);

  if (!mapOptions || mapOptions.length === 0) return;
  const pickedOrBannedMaps = new Set([
    ...output.mapPicksHost,
    ...output.mapPicksGuest,
    ...output.mapPicksGlobal,
    ...output.mapBansHost,
    ...output.mapBansGuest,
    ...output.mapBansGlobal,
  ]);
  const remainingMaps = mapOptions.filter(mapName => !pickedOrBannedMaps.has(mapName));
  if (remainingMaps.length === 1) {
    ensureUniquePush(output.mapPicksGlobal, remainingMaps[0]);
  }
};

export const transformRawDataToSingleDraft = (raw: Aoe2cmRawDraftData): SingleDraftData => {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_DRAFT };
  }

  const output: SingleDraftData = {
    ...EMPTY_DRAFT,
    id: raw.id || raw.draftId || 'unknown-id',
    hostName: raw.nameHost || EMPTY_DRAFT.hostName,
    guestName: raw.nameGuest || EMPTY_DRAFT.guestName,
    civPicksHost: [],
    civBansHost: [],
    civPicksGuest: [],
    civBansGuest: [],
    mapPicksHost: [],
    mapBansHost: [],
    mapPicksGuest: [],
    mapBansGuest: [],
    mapPicksGlobal: [],
    mapBansGlobal: [],
    status: resolveStatus(raw),
  };

  const draftKind = inferDraftKind(raw.preset?.draftOptions);

  (raw.events || []).forEach(event => {
    if (!event || typeof event !== 'object') return;
    const actionType = event.actionType?.toLowerCase();
    if (!actionType) return;

    const chosenOptionId = event.chosenOptionId;
    if (!chosenOptionId) return;

    const isHiddenBan = chosenOptionId === 'HIDDEN_BAN';
    const optionName = isHiddenBan
      ? 'Hidden Ban'
      : getOptionNameFromRaw(chosenOptionId, raw.preset?.draftOptions);

    if (!optionName) return;

    const executingPlayer = event.executingPlayer;

    if (actionType === 'pick') {
      applyPick(output, draftKind, executingPlayer, optionName);
    } else if (actionType === 'ban') {
      applyBan(output, draftKind, executingPlayer, optionName);
    } else if (actionType === 'snipe') {
      applySnipe(output, draftKind, executingPlayer, optionName);
    }
  });

  resolveCurrentTurn(raw, output);
  if (draftKind === 'map') {
    applyDeciderMap(output, raw);
  }

  return output;
};

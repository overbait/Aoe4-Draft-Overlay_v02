import useDraftStore from '../store/draftStore';

type PendingPosition = {
  type: 'civPick' | 'civBan' | 'mapPick' | 'mapBan' | null;
  player: 'HOST' | 'GUEST' | null;
};

const useNextPendingPosition = (): PendingPosition => {
  const { draft, highlightedAction, draftIsLikelyFinished } = useDraftStore(state => ({
    draft: state.draft,
    highlightedAction: state.highlightedAction,
    draftIsLikelyFinished: state.draftIsLikelyFinished,
  }));

  if (draftIsLikelyFinished || !draft || !draft.actions || highlightedAction >= draft.actions.length) {
    return { type: null, player: null };
  }

  const currentAction = draft.actions[highlightedAction];
  if (!currentAction) {
    return { type: null, player: null };
  }

  const { type, player, civOrMap } = currentAction;

  if (type === 'pick') {
    if (civOrMap === 'civ') {
      return { type: 'civPick', player };
    } else {
      return { type: 'mapPick', player };
    }
  } else if (type === 'ban') {
    if (civOrMap === 'civ') {
      return { type: 'civBan', player };
    } else {
      return { type: 'mapBan', player };
    }
  }

  return { type: null, player: null };
};

export default useNextPendingPosition;

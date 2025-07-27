import React from 'react';
import useDraftStore from '../../store/draftStore';
import PendingSlot from './PendingSlot';

const DraftTimerPlaceholder: React.FC = () => {
  const { draft, highlightedAction, countdown, draftIsLikelyFinished } = useDraftStore(state => ({
    draft: state.draft,
    highlightedAction: state.highlightedAction,
    countdown: state.countdown,
    draftIsLikelyFinished: state.draftIsLikelyFinished,
  }));

  if (draftIsLikelyFinished || !draft || !draft.actions || highlightedAction >= draft.actions.length) {
    return null;
  }

  const currentAction = draft.actions[highlightedAction];
  if (!currentAction) {
    return null;
  }

  const { draftType } = currentAction;

  // The parent component now decides IF this should render.
  // This component's only job is to render the countdown slot.
  return <PendingSlot countdown={countdown} type={draftType === 'civ' ? 'civ' : 'map'} />;
};

export default DraftTimerPlaceholder;

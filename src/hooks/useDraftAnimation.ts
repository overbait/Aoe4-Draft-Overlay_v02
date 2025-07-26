import { useState, useEffect, useMemo, useRef } from 'react';
import useDraftStore from '../store/draftStore';

interface AnimationOutput {
  animationClass: string;
  imageOpacity: number;
  previousImageUrl?: string;
  isRevealing: boolean;
}

const useDraftAnimation = (
  itemName: string | null | undefined,
  itemType: 'civ' | 'map',
  identifier: string
): AnimationOutput => {
  const { lastDraftAction } = useDraftStore(state => ({
    lastDraftAction: state.lastDraftAction,
  }));

  const [isRevealing, setIsRevealing] = useState(false);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (lastDraftAction?.action === 'reveal' &&
        lastDraftAction.item === itemName &&
        lastDraftAction.itemType === itemType) {
      setIsRevealing(true);
      setPreviousImageUrl('/assets/civflags_simplified/random.png');

      const timer = setTimeout(() => {
        setIsRevealing(false);
        setPreviousImageUrl(undefined);
      }, 1000); // Duration of the cross-fade animation

      return () => clearTimeout(timer);
    }
  }, [lastDraftAction, itemName, itemType]);

  const itemIsTheLastAction = useMemo(() => {
    if (!itemName || !lastDraftAction) return false;
    const isMatch = lastDraftAction.item === itemName &&
                    lastDraftAction.itemType === itemType &&
                    `${lastDraftAction.action}-${lastDraftAction.player}-${lastDraftAction.index}` === identifier;
    return isMatch;
  }, [itemName, itemType, lastDraftAction, identifier]);

  if (isRevealing) {
    return {
      animationClass: '', // Specific classes will be on the elements themselves
      imageOpacity: 1,
      previousImageUrl,
      isRevealing,
    };
  }

  if (itemIsTheLastAction) {
    return {
      animationClass: 'fadeIn',
      imageOpacity: 1,
      isRevealing: false,
    };
  }

  return {
    animationClass: '',
    imageOpacity: 1,
    isRevealing: false,
  };
};

export default useDraftAnimation;

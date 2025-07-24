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
  currentImageUrl: string
): AnimationOutput => {
  const { lastDraftAction, civDraftId, mapDraftId } = useDraftStore(state => ({
    lastDraftAction: state.lastDraftAction,
    civDraftId: state.civDraftId,
    mapDraftId: state.mapDraftId,
  }));

  const [isRevealing, setIsRevealing] = useState(false);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | undefined>(undefined);
  const prevItemNameRef = useRef<string | null | undefined>(itemName);

  useEffect(() => {
    if (prevItemNameRef.current === 'Hidden Ban' && itemName && itemName !== 'Hidden Ban') {
      setIsRevealing(true);
      setPreviousImageUrl('/assets/civflags_simplified/random.png');

      const timer = setTimeout(() => {
        setIsRevealing(false);
        setPreviousImageUrl(undefined);
      }, 1000); // Duration of the cross-fade animation

      return () => clearTimeout(timer);
    }
    prevItemNameRef.current = itemName;
  }, [itemName]);

  const itemIsTheLastAction = useMemo(() => {
    if (!itemName || !lastDraftAction) return false;
    const isMatch = lastDraftAction.item === itemName && lastDraftAction.itemType === itemType;
    if (!isMatch) return false;

    if (itemType === 'civ') {
      return civDraftId ? (!lastDraftAction.id || lastDraftAction.id === civDraftId) : false;
    }
    if (itemType === 'map') {
      return mapDraftId ? (!lastDraftAction.id || lastDraftAction.id === mapDraftId) : false;
    }
    return false;
  }, [itemName, itemType, lastDraftAction, civDraftId, mapDraftId]);

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

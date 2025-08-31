import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import CivItem from './CivItem';
import styles from './GeneralElements.module.css';

interface CivItemData {
  name: string;
  status: 'picked';
  imageUrl: string;
}

const formatCivNameForImagePath = (civName: string): string => {
  if (!civName) return 'random';
  return civName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
};

interface PickedCivsElementProps {
  element: StudioElement;
  isBroadcast?: boolean;
}

const PickedCivsElement: React.FC<PickedCivsElementProps> = ({ element, isBroadcast }) => {
  const {
    fontFamily = 'Arial, sans-serif',
    horizontalSplitOffset = 0,
  } = element;

  const { draft, highlightedAction, countdown, civPicksHost, civPicksGuest } = useDraftStore(state => ({
    draft: state.draft,
    highlightedAction: state.highlightedAction,
    countdown: state.countdown,
    civPicksHost: state.civPicksHost,
    civPicksGuest: state.civPicksGuest,
  }));

  const derivePickedCivs = useCallback((playerPicks: string[]): CivItemData[] => {
    return playerPicks.map(civName => ({
      name: civName,
      status: 'picked',
      imageUrl: `/assets/civflags_simplified/${formatCivNameForImagePath(civName)}.png`,
    }));
  }, []);

  const player1Civs = derivePickedCivs(civPicksHost || []);
  const player2Civs = derivePickedCivs(civPicksGuest || []);

  const p1TranslateX = -(horizontalSplitOffset || 0);
  const p2TranslateX = (horizontalSplitOffset || 0);

  const dynamicFontSize = 10;


  return (
    <div
      className={styles.civPoolElement}
      style={{
        fontFamily,
        fontSize: `${dynamicFontSize}px`,
      }}
    >
        {element.isPivotLocked && (
            <div style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                transform: 'translateX(-50%)',
            }} />
        )}
      <div
        className={`${styles.playerCivGrid} ${styles.player1CivGrid}`}
        style={{ transform: `translateX(${p1TranslateX}px)` }}
      >
        {player1Civs.map((civ, index) => (
          <CivItem
            key={`p1-pick-${index}-${civ.name}`}
            civName={civ.name}
            civImageUrl={civ.imageUrl}
            status="picked"
            element={element}
            identifier={`pick-host-${index}`}
          />
        ))}
      </div>

      <div
        className={`${styles.playerCivGrid} ${styles.player2CivGrid}`}
        style={{ transform: `translateX(${p2TranslateX}px)` }}
      >
        {player2Civs.map((civ, index) => (
          <CivItem
            key={`p2-pick-${index}-${civ.name}`}
            civName={civ.name}
            civImageUrl={civ.imageUrl}
            status="picked"
            element={element}
            identifier={`pick-guest-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PickedCivsElement;

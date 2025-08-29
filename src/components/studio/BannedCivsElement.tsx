import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import CivItem from './CivItem';
import styles from './GeneralElements.module.css';

interface CivItemData {
  name: string;
  status: 'banned';
  imageUrl: string;
}

const formatCivNameForImagePath = (civName: string): string => {
  if (!civName || civName === 'Hidden Ban') return 'random';
  return civName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
};

interface BannedCivsElementProps {
  element: StudioElement;
  isBroadcast?: boolean;
}

const BannedCivsElement: React.FC<BannedCivsElementProps> = ({ element, isBroadcast }) => {
  const {
    fontFamily = 'Arial, sans-serif',
    horizontalSplitOffset = 0,
  } = element;

  const { draft, highlightedAction, countdown, civBansHost, civBansGuest } = useDraftStore(state => ({
    draft: state.draft,
    highlightedAction: state.highlightedAction,
    countdown: state.countdown,
    civBansHost: state.civBansHost,
    civBansGuest: state.civBansGuest,
  }));

  const deriveBannedCivs = useCallback((playerBans: string[]): CivItemData[] => {
    return playerBans.map(civName => ({
      name: civName,
      status: 'banned',
      imageUrl: `/assets/civflags_simplified/${formatCivNameForImagePath(civName)}.png`,
    }));
  }, []);

  const player1Civs = deriveBannedCivs(civBansHost || []);
  const player2Civs = deriveBannedCivs(civBansGuest || []);

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
            key={`p1-ban-${index}`}
            civName={civ.name}
            civImageUrl={civ.imageUrl}
            status="banned"
            element={element}
            identifier={`ban-host-${index}`}
          />
        ))}
      </div>

      <div
        className={`${styles.playerCivGrid} ${styles.player2CivGrid}`}
        style={{ transform: `translateX(${p2TranslateX}px)` }}
      >
        {player2Civs.map((civ, index) => (
          <CivItem
            key={`p2-ban-${index}`}
            civName={civ.name}
            civImageUrl={civ.imageUrl}
            status="banned"
            element={element}
            identifier={`ban-guest-${index}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannedCivsElement;

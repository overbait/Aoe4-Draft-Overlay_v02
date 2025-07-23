import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import useDraftAnimation from '../../hooks/useDraftAnimation';

interface CivItem {
  name: string;
  status: 'picked' | 'banned';
  imageUrl: string;
}

import styles from './GeneralElements.module.css';

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

  const { civPicksHost, civPicksGuest, lastDraftAction, civDraftStatus } = useDraftStore(state => ({
    civPicksHost: state.civPicksHost,
    civPicksGuest: state.civPicksGuest,
    lastDraftAction: state.lastDraftAction,
    civDraftStatus: state.civDraftStatus,
  }));

  const derivePickedCivs = useCallback((playerPicks: string[]): CivItem[] => {
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

  const civItemWidth = 100;
  const civItemHeight = 100;
  const dynamicFontSize = 10;

  if (isBroadcast && player1Civs.length === 0 && player2Civs.length === 0) {
    return null;
  }

  const getGlowStyle = (civName: string) => {
    if (element.showGlow === false) {
      return {};
    }

    const isOnline = civDraftStatus === 'live';
    const isLast = lastDraftAction?.item === civName && lastDraftAction?.action === 'pick';

    if (isOnline && isLast) {
      return { boxShadow: '0 0 35px 10px #9CFF9C' };
    }

    if (!isOnline || element.showGlow) {
      return { boxShadow: '0 0 3.5px 1px #9CFF9C' };
    }

    return {};
  };

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
        style={{
          transform: `translateX(${p1TranslateX}px)`,
          flexDirection: 'row-reverse',
          flexWrap: 'nowrap'
        }}
      >
        {player1Civs.map((civItem, index) => {
          const animation = useDraftAnimation(civItem.name, 'civ', civItem.status);
          const glowStyle = getGlowStyle(civItem.name);
          const combinedClassName = `${styles.civItemVisualContent} ${styles.picked} ${styles[animation.animationClass] || ''}`;

          return (
            <div key={`p1-civ-${index}-${civItem.name}`} className={styles.civItemGridCell}>
              <div
                className={combinedClassName}
                style={{
                  width: `${civItemWidth}px`,
                  height: `${civItemHeight}px`,
                  backgroundImage: `url('${civItem.imageUrl}')`,
                  opacity: animation.imageOpacity,
                  ...glowStyle,
                }}
              >
                {(element.showText ?? true) && <span className={styles.civName}>{civItem.name}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`${styles.playerCivGrid} ${styles.player2CivGrid}`}
        style={{
          transform: `translateX(${p2TranslateX}px)`,
          flexDirection: 'row',
          flexWrap: 'nowrap'
        }}
      >
        {player2Civs.map((civItem, index) => {
          const animation = useDraftAnimation(civItem.name, 'civ', civItem.status);
          const glowStyle = getGlowStyle(civItem.name);
          const combinedClassName = `${styles.civItemVisualContent} ${styles.picked} ${styles[animation.animationClass] || ''}`;

          return (
            <div key={`p2-civ-${index}-${civItem.name}`} className={styles.civItemGridCell}>
              <div
                className={combinedClassName}
                style={{
                  width: `${civItemWidth}px`,
                  height: `${civItemHeight}px`,
                  backgroundImage: `url('${civItem.imageUrl}')`,
                  opacity: animation.imageOpacity,
                  ...glowStyle,
                }}
              >
                {(element.showText ?? true) && <span className={styles.civName}>{civItem.name}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PickedCivsElement;

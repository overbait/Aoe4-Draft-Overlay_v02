import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import useDraftAnimation from '../../hooks/useDraftAnimation';

interface CivItem {
  name: string;
  status: 'banned';
  imageUrl: string;
}

import styles from './GeneralElements.module.css';

const formatCivNameForImagePath = (civName: string): string => {
  if (!civName) return 'random';
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

  const { civBansHost, civBansGuest, lastDraftAction, civDraftStatus } = useDraftStore(state => ({
    civBansHost: state.civBansHost,
    civBansGuest: state.civBansGuest,
    lastDraftAction: state.lastDraftAction,
    civDraftStatus: state.civDraftStatus,
  }));

  const deriveBannedCivs = useCallback((playerBans: string[]): CivItem[] => {
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

  const civItemWidth = 100;
  const civItemHeight = 100;
  const dynamicFontSize = 10;

  if (isBroadcast && player1Civs.length === 0 && player2Civs.length === 0) {
    return null;
  }

  const getGlowStyle = (civName: string) => {
    const isOnline = civDraftStatus === 'live';
    const isLast = lastDraftAction?.item === civName && lastDraftAction?.action === 'ban';
    if (isOnline && isLast) {
      return { boxShadow: '0 0 35px 10px #FF9C9C' };
    }
    if (!isOnline && !isLast) {
        return { boxShadow: '0 0 3.5px 1px #FF9C9C' };
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
          const combinedClassName = `${styles.civItemVisualContent} ${styles.banned} ${styles[animation.animationClass] || ''}`;

          return (
            <div key={`p1-civ-${index}-${civItem.name}`} className={styles.civItemGridCell}>
              <div
                className={combinedClassName}
                style={{
                  width: `${civItemWidth}px`,
                  height: `${civItemHeight}px`,
                  backgroundImage: `linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%), url('${civItem.imageUrl}')`,
                  opacity: animation.imageOpacity,
                  ...((element.showGlow ?? true) ? glowStyle : {}),
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
          const combinedClassName = `${styles.civItemVisualContent} ${styles.banned} ${styles[animation.animationClass] || ''}`;

          return (
            <div key={`p2-civ-${index}-${civItem.name}`} className={styles.civItemGridCell}>
              <div
                className={combinedClassName}
                style={{
                  width: `${civItemWidth}px`,
                  height: `${civItemHeight}px`,
                  backgroundImage: `linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%), url('${civItem.imageUrl}')`,
                  opacity: animation.imageOpacity,
                  ...glowStyle
                }}
              >
                <span className={styles.civName}>{civItem.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BannedCivsElement;

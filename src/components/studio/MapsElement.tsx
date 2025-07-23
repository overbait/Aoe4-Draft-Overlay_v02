import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import useDraftAnimation from '../../hooks/useDraftAnimation';

interface MapItem {
  name: string;
  status: 'picked' | 'banned';
  imageUrl: string;
}

import styles from './GeneralElements.module.css';

const formatMapNameForImagePath = (mapName: string): string => {
  if (!mapName) return 'random';
  return mapName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
};

interface MapsElementProps {
  element: StudioElement;
  isBroadcast?: boolean;
}

const MapsElement: React.FC<MapsElementProps> = ({ element, isBroadcast }) => {
  const {
    fontFamily = 'Arial, sans-serif',
    horizontalSplitOffset = 0,
  } = element;

  const { mapPicksHost, mapBansHost, mapPicksGuest, mapBansGuest, lastDraftAction, mapDraftStatus } = useDraftStore(state => ({
    mapPicksHost: state.mapPicksHost,
    mapBansHost: state.mapBansHost,
    mapPicksGuest: state.mapPicksGuest,
    mapBansGuest: state.mapBansGuest,
    lastDraftAction: state.lastDraftAction,
    mapDraftStatus: state.mapDraftStatus,
  }));

  const deriveMaps = useCallback((picks: string[], bans: string[]): MapItem[] => {
    const pickedMaps = picks.map(mapName => ({
      name: mapName,
      status: 'picked' as const,
      imageUrl: `/assets/maps/${formatMapNameForImagePath(mapName)}.png`,
    }));
    const bannedMaps = bans.map(mapName => ({
      name: mapName,
      status: 'banned' as const,
      imageUrl: `/assets/maps/${formatMapNameForImagePath(mapName)}.png`,
    }));
    return [...pickedMaps, ...bannedMaps];
  }, []);

  const player1Maps = deriveMaps(mapPicksHost || [], mapBansHost || []);
  const player2Maps = deriveMaps(mapPicksGuest || [], mapBansGuest || []);

  const p1TranslateX = -(horizontalSplitOffset || 0);
  const p2TranslateX = (horizontalSplitOffset || 0);

  const mapItemWidth = 100;
  const mapItemHeight = 100;
  const dynamicFontSize = 10;

  if (isBroadcast && player1Maps.length === 0 && player2Maps.length === 0) {
    return null;
  }

  const getGlowStyle = (mapName: string, status: 'picked' | 'banned') => {
    if (!(element.showGlow ?? true)) return {};

    const isOnline = mapDraftStatus === 'live';
    const isLast = lastDraftAction?.item === mapName;

    if (isOnline && isLast) {
        if (lastDraftAction?.action === 'pick' && status === 'picked') {
            return { boxShadow: '0 0 35px 10px #9CFF9C' };
        }
        if (lastDraftAction?.action === 'ban' && status === 'banned') {
            return { boxShadow: '0 0 35px 10px #FF9C9C' };
        }
    }

    if (status === 'picked') {
        return { boxShadow: '0 0 3.5px 1px #9CFF9C' };
    }
    if (status === 'banned') {
        return { boxShadow: '0 0 3.5px 1px #FF9C9C' };
    }
    return {};
  };

  const renderMap = (mapItem: MapItem, player: 1 | 2) => {
    const animation = useDraftAnimation(mapItem.name, 'map', mapItem.status);
    const glowStyle = getGlowStyle(mapItem.name, mapItem.status);
    const statusClass = mapItem.status === 'picked' ? styles.picked : styles.banned;
    const combinedClassName = `${styles.civItemVisualContent} ${statusClass} ${styles[animation.animationClass] || ''}`;

    return (
      <div key={`p${player}-map-${mapItem.name}`} className={styles.civItemGridCell}>
        <div
          className={combinedClassName}
          style={{
            width: `${mapItemWidth}px`,
            height: `${mapItemHeight}px`,
            backgroundImage: mapItem.status === 'banned' ? `linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%), url('${mapItem.imageUrl}')` : `url('${mapItem.imageUrl}')`,
            opacity: animation.imageOpacity,
                  ...(element.showGlow ?? true ? glowStyle : {}),
          }}
        >
                {(element.showText ?? true) && <span className={styles.civName}>{mapItem.name}</span>}
        </div>
      </div>
    );
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
        {player1Maps.map(map => renderMap(map, 1))}
      </div>

      <div
        className={`${styles.playerCivGrid} ${styles.player2CivGrid}`}
        style={{
          transform: `translateX(${p2TranslateX}px)`,
          flexDirection: 'row',
          flexWrap: 'nowrap'
        }}
      >
        {player2Maps.map(map => renderMap(map, 2))}
      </div>
    </div>
  );
};

export default MapsElement;

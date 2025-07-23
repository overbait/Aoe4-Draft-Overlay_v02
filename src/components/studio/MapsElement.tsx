import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import useDraftAnimation from '../../hooks/useDraftAnimation';

interface MapItem {
  name: string;
  status: 'picked' | 'banned';
  imageUrl: string;
}

import styles from './CivPoolElement.module.css';

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

  const { mapPicksHost, mapBansHost, mapPicksGuest, mapBansGuest, lastDraftAction } = useDraftStore(state => ({
    mapPicksHost: state.mapPicksHost,
    mapBansHost: state.mapBansHost,
    mapPicksGuest: state.mapPicksGuest,
    mapBansGuest: state.mapBansGuest,
    lastDraftAction: state.lastDraftAction,
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

  const mapItemWidth = 120;
  const mapItemHeight = 100;
  const dynamicFontSize = 10;

  if (isBroadcast && player1Maps.length === 0 && player2Maps.length === 0) {
    return null;
  }

  const getGlowClass = (mapName: string, status: 'picked' | 'banned') => {
    if (lastDraftAction && lastDraftAction.item === mapName && (Date.now() - lastDraftAction.timestamp < 5000)) {
      if (lastDraftAction.action === 'pick' && status === 'picked') {
        return styles.pickedGlow;
      }
      if (lastDraftAction.action === 'ban' && status === 'banned') {
        return styles.bannedGlow;
      }
    }
    return '';
  };

  const renderMap = (mapItem: MapItem, player: 1 | 2) => {
    const animation = useDraftAnimation(mapItem.name, 'map', mapItem.status);
    const glowClass = getGlowClass(mapItem.name, mapItem.status);
    const statusClass = mapItem.status === 'picked' ? styles.picked : styles.banned;
    const combinedClassName = `${styles.civItemVisualContent} ${statusClass} ${styles[animation.animationClass] || ''} ${glowClass}`;

    return (
      <div key={`p${player}-map-${mapItem.name}`} className={styles.civItemGridCell}>
        <div
          className={combinedClassName}
          style={{
            width: `${mapItemWidth}px`,
            height: `${mapItemHeight}px`,
            backgroundImage: `url('${mapItem.imageUrl}')`,
            opacity: animation.imageOpacity,
            filter: mapItem.status === 'banned' ? 'grayscale(70%)' : 'none',
          }}
        >
          <span className={styles.civName}>{mapItem.name}</span>
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

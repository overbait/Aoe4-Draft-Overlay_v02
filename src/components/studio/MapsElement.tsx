import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import MapItemElement, { MapItem } from './MapItemElement';
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

  const dynamicFontSize = 10;

  if (isBroadcast && player1Maps.length === 0 && player2Maps.length === 0) {
    return null;
  }

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
        }}
      >
        {player1Maps.map((mapItem, index) => {
          const animation = useDraftAnimation(mapItem.name, 'map', mapItem.imageUrl);
          return <MapItemElement key={`${mapItem.name}-${index}`} mapItem={mapItem} player={1} element={element} animation={animation} />;
        })}
      </div>

      <div
        className={`${styles.playerCivGrid} ${styles.player2CivGrid}`}
        style={{
          transform: `translateX(${p2TranslateX}px)`,
        }}
      >
        {player2Maps.map((mapItem, index) => {
          const animation = useDraftAnimation(mapItem.name, 'map', mapItem.imageUrl);
          return <MapItemElement key={`${mapItem.name}-${index}`} mapItem={mapItem} player={2} element={element} animation={animation} />;
        })}
      </div>
    </div>
  );
};

export default MapsElement;

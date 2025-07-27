import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import MapItem from './MapItem';
import styles from './GeneralElements.module.css';
import PendingSlot from './PendingSlot';

interface MapItemData {
  name: string;
  status: 'picked' | 'banned';
  imageUrl: string;
}

const formatMapNameForImagePath = (mapName: string): string => {
  if (!mapName || mapName === 'Hidden Ban') return 'random';
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

  const { draft, highlightedAction, countdown, mapPicksHost, mapBansHost, mapPicksGuest, mapBansGuest } = useDraftStore(state => ({
    draft: state.draft,
    highlightedAction: state.highlightedAction,
    countdown: state.countdown,
    mapPicksHost: state.mapPicksHost,
    mapBansHost: state.mapBansHost,
    mapPicksGuest: state.mapPicksGuest,
    mapBansGuest: state.mapBansGuest,
  }));

  const deriveMaps = useCallback((picks: string[], bans: string[]): MapItemData[] => {
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
    return [...bannedMaps, ...pickedMaps];
  }, []);

  const player1Maps = deriveMaps(mapPicksHost || [], mapBansHost || []);
  const player2Maps = deriveMaps(mapPicksGuest || [], mapBansGuest || []);

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
        {player1Maps.map((map, index) => (
          <MapItem
            key={`p1-map-${index}-${map.name}`}
            mapName={map.name}
            mapImageUrl={map.imageUrl}
            status={map.status}
            element={element}
            identifier={`${map.status}-host-${index}`}
          />
        ))}
        {(() => {
          if (!draft || !draft.actions || highlightedAction >= draft.actions.length) {
            return null;
          }
          const next = draft.actions[highlightedAction];
          return (next?.type === 'pick' || next?.type === 'ban') && next?.player === 'HOST'
            ? <PendingSlot countdown={countdown} type="map" />
            : null;
        })()}
      </div>

      <div
        className={`${styles.playerCivGrid} ${styles.player2CivGrid}`}
        style={{ transform: `translateX(${p2TranslateX}px)` }}
      >
        {player2Maps.map((map, index) => (
          <MapItem
            key={`p2-map-${index}-${map.name}`}
            mapName={map.name}
            mapImageUrl={map.imageUrl}
            status={map.status}
            element={element}
            identifier={`${map.status}-guest-${index}`}
          />
        ))}
        {(() => {
          if (!draft || !draft.actions || highlightedAction >= draft.actions.length) {
            return null;
          }
          const next = draft.actions[highlightedAction];
          return (next?.type === 'pick' || next?.type === 'ban') && next?.player === 'GUEST'
            ? <PendingSlot countdown={countdown} type="map" />
            : null;
        })()}
      </div>
    </div>
  );
};

export default MapsElement;

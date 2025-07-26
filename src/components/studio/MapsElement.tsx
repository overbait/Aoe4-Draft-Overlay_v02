import React, { useCallback } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import MapItem from './MapItem';
import './styles.css';

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

  const { mapPicksHost, mapBansHost, mapPicksGuest, mapBansGuest } = useDraftStore(state => ({
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

  if (isBroadcast && player1Maps.length === 0 && player2Maps.length === 0) {
    return null;
  }

  return (
    <div
      className="civ-pool-element"
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
        className="player-civ-grid player1-civ-grid"
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
      </div>

      <div
        className="player-civ-grid player2-civ-grid"
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
      </div>
    </div>
  );
};

export default MapsElement;

import React from 'react';
import { StudioElement } from '../../types/draft';
import MapItem from './MapItem';
import styles from './GeneralElements.module.css';

interface MapItemData {
  name: string;
  status: 'picked' | 'banned';
  imageUrl: string;
}

const formatMapNameForImagePath = (mapName: string): string => {
  if (!mapName || mapName === 'Hidden Ban') return 'random';
  return mapName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
};

interface Player1MapsProps {
  picks: string[];
  bans: string[];
  element: StudioElement;
}

const Player1Maps: React.FC<Player1MapsProps> = ({ picks, bans, element }) => {
  const deriveMaps = (): MapItemData[] => {
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
    return [...pickedMaps, ...bannedMaps].reverse();
  };

  const maps = deriveMaps();

  return (
    <div
      className={`${styles.playerCivGrid} ${styles.player1CivGrid}`}
    >
      {maps.map((map, index) => (
        <MapItem
          key={`p1-map-${index}-${map.name}`}
          mapName={map.name}
          mapImageUrl={map.imageUrl}
          status={map.status}
          element={element}
        />
      ))}
    </div>
  );
};

export default Player1Maps;

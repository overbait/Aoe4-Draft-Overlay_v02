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

interface Player2MapsProps {
  picks: string[];
  bans: string[];
  element: StudioElement;
}

const Player2Maps: React.FC<Player2MapsProps> = ({ picks, bans, element }) => {
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
    return [...pickedMaps, ...bannedMaps];
  };

  const maps = deriveMaps();

  return (
    <div
      className={`${styles.playerCivGrid} ${styles.player2CivGrid}`}
    >
      {maps.map((map, index) => (
        <MapItem
          key={`p2-map-${index}-${map.name}`}
          mapName={map.name}
          mapImageUrl={map.imageUrl}
          status={map.status}
          element={element}
        />
      ))}
    </div>
  );
};

export default Player2Maps;

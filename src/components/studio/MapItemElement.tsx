import React from 'react';
import useDraftAnimation from '../../hooks/useDraftAnimation';
import { StudioElement } from '../../types/draft';
import styles from './GeneralElements.module.css';

export interface MapItem {
  name: string;
  status: 'picked' | 'banned';
  imageUrl: string;
}

interface MapItemElementProps {
  mapItem: MapItem;
  player: 1 | 2;
  element: StudioElement;
}

const MapItemElement: React.FC<MapItemElementProps> = ({ mapItem, player, element }) => {
  const animation = useDraftAnimation(mapItem.name, 'map', mapItem.status);
  const statusClass = mapItem.status === 'picked' ? styles.picked : styles.banned;
  const combinedClassName = `${styles.civItemVisualContent} ${statusClass} ${styles[animation.animationClass] || ''}`;

  const mapItemWidth = 100;
  const mapItemHeight = 100;

  return (
    <div key={`p${player}-map-${mapItem.name}`} className={styles.civItemGridCell}>
      <div
        className={combinedClassName}
        style={{
          width: `${mapItemWidth}px`,
          height: `${mapItemHeight}px`,
          backgroundImage: mapItem.status === 'banned' ? `linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%), url('${mapItem.imageUrl}')` : `url('${mapItem.imageUrl}')`,
          opacity: animation.imageOpacity,
          boxShadow: element.showGlow ? (mapItem.status === 'picked' ? '0 0 3.5px 1px #9CFF9C' : '0 0 3.5px 1px #FF9C9C') : 'none',
        }}
      >
        {(element.showText ?? true) && <span className={styles.civName}>{mapItem.name}</span>}
      </div>
    </div>
  );
};

export default MapItemElement;

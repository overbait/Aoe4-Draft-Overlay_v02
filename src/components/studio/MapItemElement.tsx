import React from 'react';
import { StudioElement } from '../../types/draft';
import useDraftAnimation from '../../hooks/useDraftAnimation';
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
  animation: ReturnType<typeof useDraftAnimation>;
}

const MapItemElement: React.FC<MapItemElementProps> = ({ mapItem, player, element, animation }) => {
  const mapItemWidth = 100;
  const mapItemHeight = 100;

  const getGlowStyle = () => {
    if (!element.showGlow) return 'none';
    return mapItem.status === 'picked' ? '0 0 3.5px 1px #9CFF9C' : '0 0 3.5px 1px #FF9C9C';
  };

  const getGradient = () => {
    return mapItem.status === 'banned'
      ? 'linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%)'
      : 'none';
  };

  const combinedClassName = `${styles.civItemVisualContent} ${styles[mapItem.status]} ${styles[animation.animationClass] || ''}`;

  return (
    <div className={styles.civItemGridCell} style={{ position: 'relative' }}>
      {animation.isRevealing && animation.previousImageUrl && (
        <div
          className={`${styles.civItemVisualContent} ${styles.banned} ${styles.crossFadeOld}`}
          style={{
            width: `${mapItemWidth}px`,
            height: `${mapItemHeight}px`,
            backgroundImage: `linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%), url('${animation.previousImageUrl}')`,
            boxShadow: getGlowStyle(),
          }}
        >
          {(element.showText ?? true) && <span className={styles.civName}>Hidden Ban</span>}
        </div>
      )}
      <div
        className={`${combinedClassName} ${animation.isRevealing ? styles.crossFadeNew : ''}`}
        style={{
          width: `${mapItemWidth}px`,
          height: `${mapItemHeight}px`,
          backgroundImage: `${getGradient()}, url('${mapItem.imageUrl}')`,
          opacity: animation.isRevealing ? 0 : animation.imageOpacity,
          boxShadow: getGlowStyle(),
        }}
      >
        {(element.showText ?? true) && <span className={styles.civName}>{mapItem.name}</span>}
      </div>
    </div>
  );
};

export default MapItemElement;

import React from 'react';
import { StudioElement } from '../../types/draft';
import useDraftAnimation from '../../hooks/useDraftAnimation';
import styles from './GeneralElements.module.css';

interface MapItemProps {
  mapName: string;
  mapImageUrl: string;
  status: 'picked' | 'banned' | 'adminPicked';
  element: StudioElement;
  identifier: string;
}

const MapItem: React.FC<MapItemProps> = ({ mapName, mapImageUrl, status, element, identifier }) => {
  const animation = useDraftAnimation(mapName, 'map', identifier);
  const itemWidth = 100;
  const itemHeight = 100;

  const getGlowStyle = () => {
    if (!element.showGlow) return 'none';
    if (status === 'picked') return '0 0 3.5px 1px #9CFF9C';
    if (status === 'banned') return '0 0 3.5px 1px #FF9C9C';
    if (status === 'adminPicked') return '0 0 3.5px 1px #FFFFFF';
    return 'none';
  };

  const getGradient = () => {
    if (status === 'banned') {
      return 'linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%)';
    }
    if (status === 'adminPicked') {
      return 'none';
    }
    return 'none';
  };

  const combinedClassName = `${styles.civItemVisualContent} ${styles[status]} ${styles[animation.animationClass] || ''}`;

  return (
    <div className={styles.civItemGridCell} style={{ position: 'relative' }}>
      {animation.isRevealing && animation.previousImageUrl && (
        <div
          className={`${styles.civItemVisualContent} ${styles.banned} ${styles.crossFadeOld}`}
          style={{
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
          backgroundImage: `${getGradient()}, url('${mapImageUrl}')`,
          opacity: animation.isRevealing ? 0 : animation.imageOpacity,
          boxShadow: getGlowStyle(),
        }}
      >
        {(element.showText ?? true) && <span className={styles.civName}>{mapName}</span>}
      </div>
    </div>
  );
};

export default MapItem;

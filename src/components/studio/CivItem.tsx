import React from 'react';
import { StudioElement } from '../../types/draft';
import useDraftAnimation from '../../hooks/useDraftAnimation';
import styles from './GeneralElements.module.css';

interface CivItemProps {
  civName: string;
  civImageUrl: string;
  status: 'picked' | 'banned';
  element: StudioElement;
}

const CivItem: React.FC<CivItemProps> = ({ civName, civImageUrl, status, element }) => {
  const animation = useDraftAnimation(civName, 'civ', civImageUrl);
  const itemWidth = 100;
  const itemHeight = 100;

  const getGlowStyle = () => {
    if (!element.showGlow) return 'none';
    return status === 'picked' ? '0 0 3.5px 1px #9CFF9C' : '0 0 3.5px 1px #FF9C9C';
  };

  const getGradient = () => {
    return status === 'banned'
      ? 'linear-gradient(to top, rgba(255, 0, 0, 0.7) 0%, rgba(255, 0, 0, 0) 100%)'
      : 'none';
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
          backgroundImage: `${getGradient()}, url('${civImageUrl}')`,
          opacity: animation.isRevealing ? 0 : animation.imageOpacity,
          boxShadow: getGlowStyle(),
        }}
      >
        {(element.showText ?? true) && <span className={styles.civName}>{civName}</span>}
      </div>
    </div>
  );
};

export default CivItem;

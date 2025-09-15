import React, { useMemo } from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import styles from './GeneralElements.module.css';

const formatMapNameForImagePath = (mapName: string): string => {
  if (!mapName) return 'random';
  return mapName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
};

interface DeciderMapElementProps {
  element: StudioElement;
}

const DeciderMapElement: React.FC<DeciderMapElementProps> = ({ element }) => {
  const {
    showTitle = true,
    showText = true,
    deciderMapTitle = 'Decider Map',
    showGlow = true,
    glowColor = '#FFFF00',
  } = element;

  const mapPicksGlobal = useDraftStore(state => state.mapPicksGlobal);

  const deciderMap = useMemo(() => {
    if (mapPicksGlobal && mapPicksGlobal.length > 0) {
      return mapPicksGlobal[mapPicksGlobal.length - 1];
    }
    return null;
  }, [mapPicksGlobal]);

  const mapImageUrl = deciderMap ? `/assets/maps/${formatMapNameForImagePath(deciderMap)}.png` : '';

  const getGlowStyle = () => {
    if (!showGlow) return 'none';
    return `0 0 3.5px 1px ${glowColor}`;
  };

  const wrapperStyle: React.CSSProperties = {
    width: element.size.width,
    height: element.size.height,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const emptyCellStyle: React.CSSProperties = {
    width: '100px', // Same as MapItem width
    height: '100px', // Same as MapItem height
    border: '1px solid #555',
    boxSizing: 'border-box',
    borderRadius: '4px',
  };

  const mapContainerStyle: React.CSSProperties = {
    ...emptyCellStyle,
    position: 'relative',
    backgroundColor: '#111',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: getGlowStyle(),
  }

  return (
    <div style={wrapperStyle}>
      {showTitle && <div className={styles.civName} style={{ marginBottom: '5px' }}>{deciderMapTitle}</div>}
      {deciderMap ? (
        <div style={mapContainerStyle}>
          <img
            src={mapImageUrl}
            alt={deciderMap}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {showText && (
            <div className={styles.civName} style={{position: 'absolute', bottom: 0, width: '100%', padding: '2px 0', lineHeight: '1.2', backgroundColor: 'rgba(0,0,0,0.5)' }}>{deciderMap}</div>
          )}
        </div>
      ) : (
        <div style={emptyCellStyle}></div>
      )}
    </div>
  );
};

export default DeciderMapElement;

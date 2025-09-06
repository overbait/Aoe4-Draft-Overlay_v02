import React from 'react';
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
    scale = 1,
    showTitle = true,
    showText = true,
    deciderMapTitle = 'Decider Map',
  } = element;

  const deciderMap = useDraftStore(state => state.deciderMap);

  const mapImageUrl = deciderMap ? `/assets/maps/${formatMapNameForImagePath(deciderMap)}.png` : '';

  const wrapperStyle: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
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

  return (
    <div style={wrapperStyle}>
      {showTitle && <div className={styles.civName} style={{ marginBottom: '5px' }}>{deciderMapTitle}</div>}
      {deciderMap ? (
        <div style={{...emptyCellStyle, position: 'relative', backgroundImage: `url('/assets/maps/random.png')`, backgroundSize: 'cover' }}>
          <img
            src={mapImageUrl}
            alt={deciderMap}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {showText && (
            <div className={styles.civName} style={{position: 'absolute', bottom: 0, width: '100%', padding: '2px 0', lineHeight: '1.2' }}>{deciderMap}</div>
          )}
        </div>
      ) : (
        <div style={emptyCellStyle}></div>
      )}
    </div>
  );
};

export default DeciderMapElement;

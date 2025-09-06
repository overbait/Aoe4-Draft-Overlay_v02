import React from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import MapItem from './MapItem';
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
    fontFamily = 'Arial, sans-serif',
    scale = 1,
    showText = true,
    deciderMapTitle = 'Decider Map',
  } = element;

  const deciderMap = useDraftStore(state => state.deciderMap);

  const mapImageUrl = deciderMap ? `/assets/maps/${formatMapNameForImagePath(deciderMap)}.png` : '';

  const titleStyle: React.CSSProperties = {
    fontFamily,
    textAlign: 'center',
    marginBottom: '5px',
    color: 'white',
    fontSize: '1.2em', // Example size, can be adjusted
  };

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
      {showText && <div style={titleStyle}>{deciderMapTitle}</div>}
      {deciderMap ? (
        <MapItem
          key={`decider-map-${deciderMap}`}
          mapName={deciderMap}
          mapImageUrl={mapImageUrl}
          status="picked"
          element={element}
          identifier={`decider-map`}
        />
      ) : (
        <div style={emptyCellStyle}></div>
      )}
    </div>
  );
};

export default DeciderMapElement;

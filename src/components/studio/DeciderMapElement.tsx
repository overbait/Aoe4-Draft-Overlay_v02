import React from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import MapItem from './MapItem';
import styles from './GeneralElements.module.css';

interface MapItemData {
  name: string;
  status: 'picked' | 'banned' | 'adminPicked';
  imageUrl: string;
}

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
    labelText = 'Decider Map',
  } = element;

  const { draft } = useDraftStore(state => ({
    draft: state.draft,
  }));

  let deciderMapName: string | null = null;
  if (draft && draft.events) {
    const deciderMapEvent = draft.events.slice().reverse().find(event => event.actionType === 'pick' && event.executingPlayer === 'NONE');
    if (deciderMapEvent) {
      const getOptionNameById = (optionId: string): string => {
        const option = draft.draftOptions?.find(opt => opt.id === optionId);
        if (!option) return optionId;
        const nameToProcess = option.name || option.id;
        const dotIndex = nameToProcess.lastIndexOf('.');
        if (dotIndex !== -1 && dotIndex < nameToProcess.length - 1) {
          return nameToProcess.substring(dotIndex + 1);
        }
        return nameToProcess;
      };
      deciderMapName = getOptionNameById(deciderMapEvent.chosenOptionId);
    }
  }

  const deciderMap: MapItemData | null = deciderMapName
    ? {
        name: deciderMapName,
        status: 'adminPicked',
        imageUrl: `/assets/maps/${formatMapNameForImagePath(deciderMapName)}.png`,
      }
    : null;

  const containerStyle: React.CSSProperties = {
    fontFamily,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: `${100 / scale}%`,
    height: `${100 / scale}%`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const labelStyle: React.CSSProperties = {
    color: element.textColor || 'white',
    fontSize: '1.2em',
    marginBottom: '10px',
  };

  return (
    <div style={containerStyle} data-testid="decider-map-container">
      <div style={labelStyle}>{labelText}</div>
      <div className={styles.civItemGridCell} style={{ position: 'relative' }}>
        {deciderMap ? (
          <MapItem
            key={`decider-map-${deciderMap.name}`}
            mapName={deciderMap.name}
            mapImageUrl={deciderMap.imageUrl}
            status={'adminPicked'}
            element={element}
            identifier={`decider-map`}
          />
        ) : (
          <div className={styles.civItemGridCell} style={{ position: 'relative' }}>
            <div
              className={styles.civItemVisualContent}
              style={{
                backgroundImage: `url('/assets/maps/random.png')`,
                border: '1px solid #555',
              }}
            >
              {(element.showText ?? true) && <span className={styles.civName}>Waiting for map...</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeciderMapElement;

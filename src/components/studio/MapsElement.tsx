import React from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';
import styles from './GeneralElements.module.css';
import Player1Maps from './Player1Maps';
import Player2Maps from './Player2Maps';

interface MapsElementProps {
  element: StudioElement;
  isBroadcast?: boolean;
}

const MapsElement: React.FC<MapsElementProps> = ({ element, isBroadcast }) => {
  const {
    fontFamily = 'Arial, sans-serif',
    horizontalSplitOffset = 0,
  } = element;

  const { mapPicksHost, mapBansHost, mapPicksGuest, mapBansGuest } = useDraftStore(state => ({
    mapPicksHost: state.mapPicksHost,
    mapBansHost: state.mapBansHost,
    mapPicksGuest: state.mapPicksGuest,
    mapBansGuest: state.mapBansGuest,
  }));

  const p1TranslateX = -(horizontalSplitOffset || 0);
  const p2TranslateX = (horizontalSplitOffset || 0);

  const dynamicFontSize = 10;

  if (isBroadcast && (mapPicksHost.length === 0 && mapBansHost.length === 0) && (mapPicksGuest.length === 0 && mapBansGuest.length === 0)) {
    return null;
  }

  return (
    <div
      className={styles.civPoolElement}
      style={{
        fontFamily,
        fontSize: `${dynamicFontSize}px`,
      }}
    >
        {element.isPivotLocked && (
            <div style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                transform: 'translateX(-50%)',
            }} />
        )}
      <div
        style={{ transform: `translateX(${p1TranslateX}px)` }}
      >
        <Player1Maps
          picks={mapPicksHost || []}
          bans={mapBansHost || []}
          element={element}
        />
      </div>

      <div
        style={{ transform: `translateX(${p2TranslateX}px)` }}
      >
        <Player2Maps
          picks={mapPicksGuest || []}
          bans={mapBansGuest || []}
          element={element}
        />
      </div>
    </div>
  );
};

export default MapsElement;

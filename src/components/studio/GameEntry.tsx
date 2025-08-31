import React, { useState, useEffect } from 'react';
import { BoxSeriesGame, StudioElement } from '../../types/draft';
import styles from './BoXSeriesOverviewElement.module.css';

// Helper functions (can be moved to a shared util file if used elsewhere)
const formatCivNameForImagePath = (civName: string): string => {
    if (!civName) return 'random';
    return civName.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_').replace(/'/g, '');
};
const formatMapNameForImagePath = (mapName: string): string => {
    if (!mapName) return 'random';
    return mapName.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
};

interface GameEntryProps {
  game: BoxSeriesGame;
  index: number;
  element: StudioElement;
  gameEntrySpacing: number;
  dynamicGameTitleStyle: React.CSSProperties;
  gameImageRowDynamicStyle: React.CSSProperties;
  civSelectorStyleBase: React.CSSProperties;
  mapSelectorStyleBase: React.CSSProperties;
  pivotInternalOffset: number;
}

const GameEntry: React.FC<GameEntryProps> = ({
  game,
  index,
  element,
  gameEntrySpacing,
  dynamicGameTitleStyle,
  gameImageRowDynamicStyle,
  civSelectorStyleBase,
  mapSelectorStyleBase,
  pivotInternalOffset,
}) => {
  const { showCivNames = true, hideCivs = false, hideMaps = false, hideGameXText = false } = element;

  const hostCivKey = `hc-${game.hostCiv || 'random'}-${index}`;
  const mapKey = `map-${game.map || 'random'}-${index}`;
  const guestCivKey = `gc-${game.guestCiv || 'random'}-${index}`;

  const [hostCivImgOpacity, setHostCivImgOpacity] = useState(0);
  const [guestCivImgOpacity, setGuestCivImgOpacity] = useState(0);
  const [mapImgOpacity, setMapImgOpacity] = useState(0);

  useEffect(() => {
    if (game.hostCiv) {
      setHostCivImgOpacity(0);
      const timer = setTimeout(() => setHostCivImgOpacity(1), 50);
      return () => clearTimeout(timer);
    } else {
      setHostCivImgOpacity(0);
    }
  }, [game.hostCiv]);

  useEffect(() => {
    if (game.guestCiv) {
      setGuestCivImgOpacity(0);
      const timer = setTimeout(() => setGuestCivImgOpacity(1), 50);
      return () => clearTimeout(timer);
    } else {
      setGuestCivImgOpacity(0);
    }
  }, [game.guestCiv]);

  useEffect(() => {
    if (game.map) {
      setMapImgOpacity(0);
      const timer = setTimeout(() => setMapImgOpacity(1), 50);
      return () => clearTimeout(timer);
    } else {
      setMapImgOpacity(0);
    }
  }, [game.map]);

  const gradient = 'linear-gradient(to bottom, rgba(74,59,42,0.1), rgba(74,59,42,0.0))';

  return (
    <div key={index} className={styles.gameEntryContainer} style={{ paddingTop: index > 0 ? `${gameEntrySpacing}px` : '0px' }}>
      {!hideGameXText && <div className={styles.gameTitle} style={dynamicGameTitleStyle}>Game {index + 1}</div>}
      <div className={styles.gameImageRow} style={gameImageRowDynamicStyle}>
        {!hideCivs && (
          <div className={`${styles.civCell} ${styles.leftCivCell}`}>
            <div
              key={hostCivKey}
              className={`${styles.selectorDisplay} ${game.winner === 'host' ? styles.winnerGlow : ''}`}
              style={{
                ...civSelectorStyleBase,
                backgroundImage: `${gradient}, url('/assets/civflags_normal/${formatCivNameForImagePath('random')}.png')`,
              }}
            >
              {game.hostCiv && (
                <img
                  src={`/assets/civflags_normal/${formatCivNameForImagePath(game.hostCiv)}.png`}
                  alt={game.hostCiv || 'Host Civ'}
                  className={styles.boxPickedImage}
                  style={{ opacity: hostCivImgOpacity }}
                />
              )}
              {showCivNames && game.hostCiv && (
                <div className={styles.selectorTextOverlay}>{game.hostCiv}</div>
              )}
            </div>
          </div>
        )}
        {!hideCivs && !hideMaps && (pivotInternalOffset > 0) && <div className={styles.spacer}></div>}
        {(!hideMaps) && (
          <div className={styles.mapCell}>
            <div
              key={mapKey}
              className={styles.selectorDisplay}
              style={{
                ...mapSelectorStyleBase,
                backgroundImage: `${gradient}, url('/assets/maps/${formatMapNameForImagePath('random')}.png')`,
              }}
            >
              {game.map && (
                <img
                  src={`/assets/maps/${formatMapNameForImagePath(game.map)}.png`}
                  alt={game.map || 'Map'}
                  className={styles.boxPickedImage}
                  style={{ opacity: mapImgOpacity }}
                />
              )}
              {element.showMapNames && game.map && (
                <div className={styles.selectorTextOverlay}>{game.map}</div>
              )}
            </div>
          </div>
        )}
        {hideMaps && !hideCivs && pivotInternalOffset > 0 && (
          <div style={{ width: `${pivotInternalOffset * 2}px`, flexShrink: 0 }}></div>
        )}
        {!hideCivs && !hideMaps && (pivotInternalOffset > 0) && <div className={styles.spacer}></div>}
        {!hideCivs && (
          <div className={`${styles.civCell} ${styles.rightCivCell}`}>
            <div
              key={guestCivKey}
              className={`${styles.selectorDisplay} ${game.winner === 'guest' ? styles.winnerGlow : ''}`}
              style={{
                ...civSelectorStyleBase,
                backgroundImage: `${gradient}, url('/assets/civflags_normal/${formatCivNameForImagePath('random')}.png')`,
              }}
            >
              {game.guestCiv && (
                <img
                  src={`/assets/civflags_normal/${formatCivNameForImagePath(game.guestCiv)}.png`}
                  alt={game.guestCiv || 'Guest Civ'}
                  className={styles.boxPickedImage}
                  style={{ opacity: guestCivImgOpacity }}
                />
              )}
              {showCivNames && game.guestCiv && (
                <div className={styles.selectorTextOverlay}>{game.guestCiv}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEntry;

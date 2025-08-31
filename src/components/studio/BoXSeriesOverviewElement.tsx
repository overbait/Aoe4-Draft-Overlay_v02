import React from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement, BoxSeriesGame } from '../../types/draft';
import styles from './BoXSeriesOverviewElement.module.css';
import GameEntry from './GameEntry'; // Import the new component

interface BoXSeriesOverviewElementProps {
  element: StudioElement;
  isBroadcast?: boolean;
}

const BoXSeriesOverviewElement: React.FC<BoXSeriesOverviewElementProps> = ({ element, isBroadcast }) => {
  const {
    fontFamily = 'Arial, sans-serif',
    showMapNames = true, // Keep showMapNames here as it's passed down
    gameEntrySpacing = 10,
    hideCivs = false,
    hideMaps = false,
    hideGameXText = false,
    pivotInternalOffset = 0,
  } = element;

  const { boxSeriesGames } = useDraftStore(state => ({
    boxSeriesGames: state.boxSeriesGames,
  }));

  const visibleGames = boxSeriesGames.filter(game => game.isVisible === true);

  if (!visibleGames || visibleGames.length === 0) {
    if (isBroadcast) return null;
    return <div className={styles.noGamesMessage} style={{ fontFamily }}>(BoX Series: No Visible Games)</div>;
  }

  const REFERENCE_SELECTOR_HEIGHT_UNSCALED_PX = 30;
  const BASELINE_FONT_SIZE_UNSCALED_PX = 10;
  const dynamicFontSize = BASELINE_FONT_SIZE_UNSCALED_PX;
  const selectorHeight = REFERENCE_SELECTOR_HEIGHT_UNSCALED_PX;
  const selectorWidth = 130;
  const gameTitleFontSize = dynamicFontSize * 0.9;

  let gridTemplateColumnsValue = '';
  if (hideCivs) {
    gridTemplateColumnsValue = 'auto';
  } else {
    if (hideMaps) {
      gridTemplateColumnsValue = pivotInternalOffset > 0 ? '1fr auto 1fr' : '1fr 1fr';
    } else {
      gridTemplateColumnsValue = pivotInternalOffset > 0 ? `1fr ${pivotInternalOffset}px auto ${pivotInternalOffset}px 1fr` : '1fr auto 1fr';
    }
  }

  const gameImageRowDynamicStyle: React.CSSProperties = {
    gridTemplateColumns: gridTemplateColumnsValue,
  };

  const civSelectorStyleBase: React.CSSProperties = {
    width: `${selectorWidth}px`,
    height: `${selectorHeight}px`,
  };
  const mapSelectorStyleBase: React.CSSProperties = {
    width: `${selectorWidth}px`,
    height: `${selectorHeight}px`,
  };
  const gameTitleFont = element.fontFamilyGameTitle || undefined;
  const dynamicGameTitleStyle: React.CSSProperties = {
    fontSize: `${gameTitleFontSize}px`,
    fontFamily: gameTitleFont,
  };

  return (
    <div className={styles.baseElement} style={{ fontFamily, fontSize: `${dynamicFontSize}px` }}>
      {visibleGames.map((game: BoxSeriesGame, index: number) => (
        <GameEntry
          key={index}
          game={game}
          index={index}
          element={element}
          gameEntrySpacing={gameEntrySpacing}
          dynamicGameTitleStyle={dynamicGameTitleStyle}
          gameImageRowDynamicStyle={gameImageRowDynamicStyle}
          civSelectorStyleBase={civSelectorStyleBase}
          mapSelectorStyleBase={mapSelectorStyleBase}
          pivotInternalOffset={pivotInternalOffset}
        />
      ))}
    </div>
  );
};

export default BoXSeriesOverviewElement;

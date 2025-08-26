import React from 'react';
import useDraftStore from '../../store/draftStore';
import { StudioElement } from '../../types/draft';

interface CountryFlagsElementProps {
  element: StudioElement;
  isSelected?: boolean; // For pivot line visibility
  isBroadcast?: boolean; // (Currently unused by this element but good for consistency)
  hostFlag?: string | null;
  guestFlag?: string | null;
}

const CountryFlagsElement: React.FC<CountryFlagsElementProps> = ({ element, isSelected, isBroadcast, hostFlag, guestFlag }) => {
  const {
    // fontFamily, // Not directly used for text
    // backgroundColor, // Applied to baseDivStyle if needed, but flags are images
    // borderColor, // Applied to baseDivStyle if needed
    // textColor, // Not directly used for images
    isPivotLocked,
    pivotInternalOffset,
    size // Used for dynamic font size if we had text, and for main div dimensions
  } = element;

  const storeHostFlag = useDraftStore((state) => state.hostFlag);
  const storeGuestFlag = useDraftStore((state) => state.guestFlag);
  const liveHostFlag = hostFlag !== undefined ? hostFlag : storeHostFlag;
  const liveGuestFlag = guestFlag !== undefined ? guestFlag : storeGuestFlag;

  const currentPivotOffset = pivotInternalOffset || 0;

  const flagBaseStyle: React.CSSProperties = {
    width: '100%', // Make flag take width of its container cell
    height: '100%', // Make flag take height of its container cell
    objectFit: 'contain', // Or 'cover', 'scale-down' depending on desired look
    display: 'block', // Remove extra space below img
    pointerEvents: 'none', // Make the image itself ignore mouse events
    userSelect: 'none',   // Prevent selecting the image like text
  };

  const hostFlagPath = liveHostFlag ? `/assets/countryflags/${liveHostFlag.toLowerCase()}.png` : null;
  const guestFlagPath = liveGuestFlag ? `/assets/countryflags/${liveGuestFlag.toLowerCase()}.png` : null;

console.log('[CountryFlagsElement] liveHostFlag from store:', liveHostFlag);
console.log('[CountryFlagsElement] liveGuestFlag from store:', liveGuestFlag);
console.log('[CountryFlagsElement] hostFlagPath:', hostFlagPath);
console.log('[CountryFlagsElement] guestFlagPath:', guestFlagPath);

  const hostFlagDisplay = hostFlagPath ? <img src={hostFlagPath} alt={liveHostFlag || 'Host Flag'} style={flagBaseStyle} draggable="false" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <div style={{width: '100%', height: '100%'}} />; // Placeholder if no flag
  const guestFlagDisplay = guestFlagPath ? <img src={guestFlagPath} alt={liveGuestFlag || 'Guest Flag'} style={flagBaseStyle} draggable="false" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <div style={{width: '100%', height: '100%'}} />; // Placeholder if no flag

  const pivotLineStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '10%', // Adjust as needed
    bottom: '10%', // Adjust as needed
    width: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Match other elements
    transform: 'translateX(-50%)',
    zIndex: 1,
  };

  const baseDivStyle: React.CSSProperties = {
    // border: `1px solid ${currentBorderColor}`, // Keep border if desired
    // backgroundColor: currentBackgroundColor, // Keep background if desired
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateColumns: isPivotLocked ? `1fr ${currentPivotOffset}px 1fr` : '1fr 1fr',
    alignItems: 'center', // Vertically center flags in their cells
    justifyItems: 'center', // Horizontally center flags in their cells (if cell is wider than flag)
    gap: isPivotLocked ? '0px' : `${currentPivotOffset}px`, // Use gap if not pivot locked for spacing
    overflow: 'hidden',
    position: 'relative',
    padding: '2px', // Small padding so flags don't touch edges
  };

  // Container for each flag, to help with centering or aspect ratio if needed
  const flagContainerStyle: React.CSSProperties = {
    width: '100%', // e.g., 'calc(100% - 4px)' if padding is on base
    height: '100%', // e.g., 'calc(100% - 4px)'
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  return (
    <div style={baseDivStyle}>
      {/* Host Flag Cell */}
      <div style={flagContainerStyle}>
        {hostFlagDisplay}
      </div>

      {/* Middle Spacer Cell (only if pivot locked and offset > 0) */}
      {isPivotLocked && currentPivotOffset > 0 && <div></div>}

      {/* Guest Flag Cell */}
      <div style={flagContainerStyle}>
        {guestFlagDisplay}
      </div>

      {isPivotLocked && isSelected && <div style={pivotLineStyle}></div>}
    </div>
  );
};

export default CountryFlagsElement;

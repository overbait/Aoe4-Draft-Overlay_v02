import React from 'react';
import styles from './GeneralElements.module.css';

interface PendingSlotProps {
  countdown: number;
  type: 'civ' | 'map';
}

const PendingSlot: React.FC<PendingSlotProps> = ({ countdown, type }) => {
  return (
    <div className={styles.civItemGridCell}>
      <div className={`${styles.civItemVisualContent} ${styles.pending}`}>
        <div className={styles.pendingTimer}>
          {countdown.toString().padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

export default PendingSlot;

import React, { ReactNode, useMemo } from 'react';
import { PivotSettings } from '../../types/draft';

interface StudioElementWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  scale?: number;
  pivot?: PivotSettings | null;
  children: ReactNode;
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

const formatPivotValue = (value: number | string): string => {
  if (typeof value === 'number') {
    return `${clamp(value) * 100}%`;
  }
  return value;
};

const StudioElementWrapper: React.FC<StudioElementWrapperProps> = ({
  scale = 1,
  pivot,
  children,
  style,
  ...rest
}) => {
  const transformOrigin = useMemo(() => {
    const originX = formatPivotValue(pivot?.x ?? 0.5);
    const originY = formatPivotValue(pivot?.y ?? 0.5);
    return `${originX} ${originY}`;
  }, [pivot?.x, pivot?.y]);

  return (
    <div
      {...rest}
      style={{
        display: 'inline-block',
        ...style,
        transform: `scale(${scale})`,
        transformOrigin,
      }}
    >
      {children}
    </div>
  );
};

export default StudioElementWrapper;

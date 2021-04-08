import React, { FC } from 'react';
import classNames from 'classnames';

interface BackgroundProps {
  withAnimation?: boolean;
}

export const Background: FC<BackgroundProps> = ({ withAnimation = true }) => (
  <div
    id="bg"
    className={classNames(
      'bg-hero',
      'bg-left-bottom',
      'bg-repeat-x',
      'fixed',
      'h-full',
      'left-0',
      // 'opacity-100',
      'top-0',
      'translate-x-0',
      'translate-y-0'
    )}
    style={{
      backgroundColor: '#348cb2',
      ...(withAnimation ? { animation: 'bg 120s linear infinite' } : {}),
    }}
  />
);

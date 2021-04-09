import React from 'react';
import classNames from 'classnames';

export const Overlay = () => (
  <div
    className={classNames(
      'fixed',
      'bg-overlay-pattern',
      'bg-center',
      'bg-cover',
      'h-full',
      'w-full'
    )}
    style={{
      animation: 'fadeIn 1.5s forwards',
      zIndex: -10,
    }}
  />
);

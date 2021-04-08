import React from 'react';
import classNames from 'classnames';

export const Overlay = () => (
  <div
    className={classNames(
      'bg-overlay-pattern',
      'bg-fixed',
      'bg-center',
      'bg-repeat',
      'bg-cover',
      'h-full',
      'w-full'
    )}
    style={{
      animation: 'fadeIn 1.5s forwards',
    }}
  />
);

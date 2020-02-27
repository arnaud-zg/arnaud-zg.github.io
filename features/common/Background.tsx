import React from 'react';
import classNames from 'classnames';

export const Background = () => (
  <div
    id="bg"
    className={classNames(
      'bg-left-bottom',
      'bg-repeat-x',
      'fixed',
      'h-full',
      'left-0',
      'opacity-100',
      'top-0',
      'translate-x-0',
      'translate-y-0'
    )}
    style={{
      backgroundColor: '#348cb2',
      backgroundImage: 'url("assets/css/images/bg.jpg")',
      animation: 'bg 120s linear infinite',
    }}
  />
);

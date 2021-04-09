import React, { FC } from 'react';
import classNames from 'classnames';
import { BackgroundMusic } from './BackgroundMusic';

export const Banner: FC = () => {
  return (
    <div
      className={classNames(
        'hidden',
        'md:block',
        'text-right',
        'cursor-pointer',
        'w-full',
        'p-4'
      )}>
      <BackgroundMusic />
    </div>
  );
};

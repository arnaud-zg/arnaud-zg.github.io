import React, { FC } from 'react';
import classNames from 'classnames';

interface BodyProps {}

export const Body: FC<BodyProps> = ({ children }) => {
  return (
    <div
      className={classNames(
        'flex',
        'h-5/6',
        'justify-center',
        'text-black',
        'w-full'
      )}>
      <div
        className={classNames(
          'bg-gray-200',
          'overflow-y-scroll',
          'mt-4',
          'p-4',
          'w-4/5',
          'rounded-lg'
        )}>
        {children}
      </div>
    </div>
  );
};

import React, { FC } from 'react';
import classNames from 'classnames';

interface BodyProps {}

export const Body: FC<BodyProps> = ({ children }) => {
  return (
    <div
      className={classNames(
        'fixed',
        'flex',
        'h-full',
        'inset-0',
        'justify-center',
        'text-black',
        'w-full'
      )}>
      <div
        className={classNames(
          'bg-gray-200',
          'h-auto',
          'inline-block',
          'my-12',
          'overflow-y-scroll',
          'p-4',
          'w-4/5',
          'rounded-lg'
        )}>
        {children}
      </div>
    </div>
  );
};

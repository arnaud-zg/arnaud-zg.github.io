import classNames from 'classnames';
import React, { FC, HTMLAttributes } from 'react';

interface BlockProps extends HTMLAttributes<HTMLDivElement> {}

export const Block: FC<BlockProps> = props => (
  <div
    {...props}
    className={classNames(
      'mt-2',
      'p-2',
      'rounded',
      'border-dotted',
      'border-2',
      'border-gray-400'
    )}
  />
);

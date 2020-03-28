import classNames from 'classnames';
import React, { FC, HTMLAttributes } from 'react';

export enum DirectionEnum {
  NONE,
  ROW,
  COL,
}

const DIRECTION_CLASSES_MAPPING = {
  [DirectionEnum.NONE]: [],
  [DirectionEnum.ROW]: ['flex flex-row'],
  [DirectionEnum.COL]: ['flex flex-col'],
};

interface BlockProps extends HTMLAttributes<HTMLDivElement> {
  direction?: DirectionEnum;
}

const initialClassnames = [];

export const Block: FC<BlockProps> = ({
  direction = DirectionEnum.NONE,
  ...props
}) => (
  <div
    {...props}
    className={classNames(
      ...initialClassnames,
      ...DIRECTION_CLASSES_MAPPING[direction],
      'flex-grow',
      'mt-2',
      'mx-2',
      'p-2',
      'rounded',
      'border-dotted',
      'border-2',
      'border-gray-400'
    )}
  />
);

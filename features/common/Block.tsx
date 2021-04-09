import classNames from 'classnames';
import React, { FC, HTMLAttributes } from 'react';
import { Variation, Color } from './color';

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

const VARIATION_CLASS_MAP = {
  [Variation.DARK]: [`bg-${Color.DARK}-500`],
  [Variation.LIGHT]: [`bg-${Color.LIGHT}-300`],
};

interface BlockProps extends HTMLAttributes<HTMLDivElement> {
  direction?: DirectionEnum;
  variation?: Variation;
}

const initialClassnames = [];

export const Block: FC<BlockProps> = ({
  direction = DirectionEnum.NONE,
  variation = Variation.LIGHT,
  ...props
}) => (
  <div
    {...props}
    className={classNames(
      ...initialClassnames,
      ...DIRECTION_CLASSES_MAPPING[direction],
      ...VARIATION_CLASS_MAP[variation],
      'flex-grow',
      'mt-4',
      'mx-2',
      'p-2',
      'rounded',
      'border-dotted',
      'border-2',
      'border-gray-400'
    )}
  />
);

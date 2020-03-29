import React, { FC, AnchorHTMLAttributes } from 'react';
import classNames from 'classnames';
import { Color, Variation } from '../color';
import { Size } from '../size';

export enum ActionMode {
  DEFAULT = 'DEFAULT',
  PILL = 'PILL',
  ELEVATED = 'ELEVATED',
  BLOCK = 'BLOCK',
}

interface ActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: Size;
  variation?: Variation;
  mode?: ActionMode;
}

const SIZE_CLASS_MAP = {
  [Size.XS]: ['text-xs'],
  [Size.S]: ['text-sm'],
  [Size.M]: ['text-base'],
  [Size.L]: ['text-lg'],
  [Size.XL]: ['text-xl'],
};

const VARIATION_CLASS_MAP = {
  [Variation.DANGER]: [
    `bg-${Color.DANGER}-500`,
    `hover:bg-${Color.DANGER}-700`,
    'text-white',
  ],
  [Variation.DARK]: [
    `bg-${Color.DARK}-900`,
    `hover:bg-${Color.DARK}-700`,
    `text-${Color.DARK}-300`,
  ],
  [Variation.LIGHT]: [
    `bg-${Color.LIGHT}-100`,
    `hover:bg-${Color.LIGHT}-500`,
    `text-${Color.LIGHT}-700`,
  ],
  [Variation.PRIMARY]: [
    `bg-${Color.PRIMARY}-500`,
    `hover:bg-${Color.PRIMARY}-700`,
    'text-white',
  ],
  [Variation.SECONDARY]: [
    `bg-${Color.SECONDARY}-500`,
    `hover:bg-${Color.SECONDARY}-700`,
    'text-white',
  ],
  [Variation.SUCCESS]: [
    `bg-${Color.SUCCESS}-500`,
    `hover:bg-${Color.SUCCESS}-700`,
    'text-white',
  ],
  [Variation.WARNING]: [
    `bg-${Color.WARNING}-500`,
    `hover:bg-${Color.WARNING}-700`,
    'text-white',
  ],
};

const MODE_CLASS_MAP = {
  [ActionMode.DEFAULT]: ['inline-flex', 'rounded'],
  [ActionMode.PILL]: ['inline-flex', 'rounded-full'],
  [ActionMode.ELEVATED]: ['inline-flex', 'rounded', 'shadow-lg'],
  [ActionMode.BLOCK]: ['flex', 'rounded'],
};

const initialClassnames = [
  'border-none',
  'font-bold',
  'py-2',
  'px-4',
  'cursor-pointer',
];

export const Action: FC<ActionProps> = ({
  size = Size.M,
  variation = Variation.PRIMARY,
  mode = ActionMode.DEFAULT,
  ...restProps
}) => {
  return (
    <a
      {...restProps}
      className={classNames(
        ...initialClassnames,
        SIZE_CLASS_MAP[size],
        VARIATION_CLASS_MAP[variation],
        MODE_CLASS_MAP[mode]
      )}
    />
  );
};

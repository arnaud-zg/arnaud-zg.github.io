import React, { FC, AnchorHTMLAttributes } from 'react';
import classNames from 'classnames';

export enum ActionSize {
  SMALL = 'SMALL',
  DEFAULT = 'DEFAULT',
  LARGE = 'LARGE',
}

export enum ActionVariation {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  SUCCESS = 'SUCCESS',
  DANGER = 'DANGER',
  WARNING = 'WARNING',
}

export enum ActionMode {
  DEFAULT = 'DEFAULT',
  PILL = 'PILL',
  ELEVATED = 'ELEVATED',
  BLOCK = 'BLOCK',
}

interface ActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: ActionSize;
  variation?: ActionVariation;
  mode?: ActionMode;
}

const SIZE_CLASS_MAP = {
  [ActionSize.SMALL]: ['text-sm'],
  [ActionSize.DEFAULT]: ['text-base'],
  [ActionSize.LARGE]: ['text-lg'],
};

const VARIATION_CLASS_MAP = {
  [ActionVariation.PRIMARY]: ['bg-blue-500', 'hover:bg-blue-700'],
  [ActionVariation.SECONDARY]: ['bg-indigo-500', 'hover:bg-indigo-700'],
  [ActionVariation.SUCCESS]: ['bg-green-500', 'hover:bg-green-700'],
  [ActionVariation.DANGER]: ['bg-red-500', 'hover:bg-red-700'],
  [ActionVariation.WARNING]: ['bg-yellow-500', 'hover:bg-yellow-700'],
};

const MODE_CLASS_MAP = {
  [ActionMode.DEFAULT]: ['inline-flex', 'rounded'],
  [ActionMode.PILL]: ['inline-flex', 'rounded-full'],
  [ActionMode.ELEVATED]: ['inline-flex', 'rounded', 'shadow-lg'],
  [ActionMode.BLOCK]: ['flex', 'rounded'],
};

const initialClassnames = [
  'border-none',
  'text-white',
  'font-bold',
  'py-2',
  'px-4',
  'cursor-pointer',
];

export const Action: FC<ActionProps> = ({
  size = ActionSize.DEFAULT,
  variation = ActionVariation.PRIMARY,
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

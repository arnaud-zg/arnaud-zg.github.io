import classNames from 'classnames';
import { createElement, FC } from 'react';

export enum TextEnum {
  DEFAULT,
  BOLD,
  STRONG,
  ITALIC,
  EMPHASIS,
  SUBSCRIPT,
  SUPERSCRIPT,
  UNDERLINE,
  CODE,
}

interface TextProps {
  mode?: TextEnum;
  classnames?: Parameters<typeof classNames>;
}

const MODE_TAG_MAPPING = {
  [TextEnum.DEFAULT]: 'p',
  [TextEnum.BOLD]: 'b',
  [TextEnum.STRONG]: 'strong',
  [TextEnum.ITALIC]: 'i',
  [TextEnum.EMPHASIS]: 'em',
  [TextEnum.SUBSCRIPT]: 'sub',
  [TextEnum.SUPERSCRIPT]: 'sup',
  [TextEnum.UNDERLINE]: 'u',
  [TextEnum.CODE]: 'code',
};

const MODE_CLASS_MAPPING = {
  [TextEnum.DEFAULT]: ['px-8'],
};

const defaultClassnames = ['text-sm'];

export const Text: FC<TextProps> = ({
  children,
  classnames = {},
  mode = TextEnum.DEFAULT,
}) =>
  createElement(
    MODE_TAG_MAPPING[mode],
    {
      className: classNames(
        classnames,
        defaultClassnames,
        MODE_CLASS_MAPPING[mode] || []
      ),
    },
    children
  );

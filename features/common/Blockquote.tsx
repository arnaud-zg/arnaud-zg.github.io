import React, { BlockquoteHTMLAttributes, FC } from 'react';
import classNames from 'classnames';

interface BlockquoteProps extends BlockquoteHTMLAttributes<HTMLElement> {}

export const Blockquote: FC<BlockquoteProps> = ({ children }) => (
  <blockquote className={classNames('px-8')}>{children}</blockquote>
);

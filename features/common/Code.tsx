import React, { HTMLAttributes, FC } from 'react';
import classNames from 'classnames';

interface CodeProps extends HTMLAttributes<HTMLElement> {}

export const Code: FC<CodeProps> = ({ children }) => (
  <pre className={classNames('px-8')}>
    <code>{children}</code>
  </pre>
);

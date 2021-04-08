import { FC } from 'react';
import classNames from 'classnames';

export const Layout: FC = ({ children }) => {
  return (
    <div
      className={classNames(
        'h-full',
        'left-0',
        'opacity-0',
        'fixed',
        'top-0',
        'w-full'
      )}
      style={{ animation: 'fadeIn 3s forwards' }}>
      {children}
    </div>
  );
};

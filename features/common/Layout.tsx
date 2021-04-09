import { FC } from 'react';
import classNames from 'classnames';

export const Layout: FC = ({ children }) => {
  return (
    <div
      className={classNames('h-screen', 'opacity-0', 'w-screen')}
      style={{ animation: 'fadeIn 3s forwards' }}>
      {children}
    </div>
  );
};

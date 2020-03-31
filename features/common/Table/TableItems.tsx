import classNames from 'classnames';
import React, { FC, ReactNode, TdHTMLAttributes } from 'react';
import { TableMode } from './Table';

export interface TableItemProps
  extends TdHTMLAttributes<HTMLTableDataCellElement> {
  content?: ReactNode;
  mode?: TableMode;
}

export const TableItem: FC<TableItemProps> = ({
  content,
  mode,
  ...restProps
}) => (
  <td
    {...restProps}
    className={classNames(
      {
        'border-t-2': mode === TableMode.ALTERNATE,
        'border-2': mode === TableMode.DEFAULT,
      },
      'border-dotted',
      'border-gray-400',
      'px-4',
      'py-2'
    )}>
    {content}
  </td>
);

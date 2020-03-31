import classNames from 'classnames';
import React, { FC, HTMLAttributes } from 'react';
import { TableMode } from './Table';
import { TableItem, TableItemProps } from './TableItems';

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  items: TableItemProps[][];
  mode?: TableMode;
}

export const TableBody: FC<TableBodyProps> = ({ items, mode }) => (
  <tbody>
    {items.map((itemLine, index) => (
      <tr
        className={classNames({
          'bg-gray-400': mode === TableMode.DEFAULT && index % 2 === 1,
        })}
        key={index}>
        {itemLine.map((item, index) => (
          <TableItem {...item} key={index} mode={mode} />
        ))}
      </tr>
    ))}
  </tbody>
);

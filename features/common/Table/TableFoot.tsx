import React, { FC, HTMLAttributes } from 'react';
import { TableMode } from './Table';
import { TableItem, TableItemProps } from './TableItems';

interface TableFootProps extends HTMLAttributes<HTMLTableSectionElement> {
  items: TableItemProps[][];
  mode?: TableMode;
}

export const TableFoot: FC<TableFootProps> = ({ items, mode }) => (
  <tfoot>
    {items.map((itemLine, index) => (
      <tr key={index}>
        {itemLine.map((item, index) => (
          <TableItem {...item} key={index} mode={mode} />
        ))}
      </tr>
    ))}
  </tfoot>
);

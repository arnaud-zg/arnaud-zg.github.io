import React, { FC, HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react';
import { TableItem, TableItemProps } from './TableItems';

interface TableFootProps extends HTMLAttributes<HTMLTableSectionElement> {
  items: TableItemProps[][];
}

export const TableFoot: FC<TableFootProps> = ({ items }) => (
  <tfoot>
    {items.map((itemLine, index) => (
      <tr key={index}>
        {itemLine.map((item, index) => (
          <TableItem key={index} {...item} />
        ))}
      </tr>
    ))}
  </tfoot>
);

import React, { FC, HTMLAttributes, ReactNode, TdHTMLAttributes } from 'react';
import { TableItem, TableItemProps } from './TableItems';

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  items: TableItemProps[][];
}

export const TableBody: FC<TableBodyProps> = ({ items }) => (
  <tbody>
    {items.map((itemLine, index) => (
      <tr key={index}>
        {itemLine.map((item, index) => (
          <TableItem key={index} {...item} />
        ))}
      </tr>
    ))}
  </tbody>
);

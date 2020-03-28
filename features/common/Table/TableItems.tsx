import React, { FC, TdHTMLAttributes, ReactNode } from 'react';

export interface TableItemProps
  extends TdHTMLAttributes<HTMLTableDataCellElement> {
  content?: ReactNode;
}

export const TableItem: FC<TableItemProps> = ({ content, ...restProps }) => (
  <td {...restProps}>{content}</td>
);

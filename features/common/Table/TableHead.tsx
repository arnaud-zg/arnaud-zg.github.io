import React, { FC, HTMLAttributes } from 'react';

interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  keys: string[];
}

export const TableHead: FC<TableHeadProps> = ({ keys }) => (
  <thead>
    <tr>
      {keys.map(headerName => (
        <th>{headerName}</th>
      ))}
    </tr>
  </thead>
);

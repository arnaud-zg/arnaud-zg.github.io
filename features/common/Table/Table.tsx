import React, { FC, TableHTMLAttributes } from 'react';
import classNames from 'classnames';
import { TableHead } from './TableHead';
import { TableBody } from './TableBody';
import { TableFoot } from './TableFoot';
import { TableItemProps } from './TableItems';

interface TableItem {
  [key: string]: string | number;
}

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  items: TableItem[];
  footerItems?: TableItem[];
}

export const Table: FC<TableProps> = ({ items, footerItems = [] }) => {
  const tableKeys = Object.keys(items[0]);

  return (
    <table className={classNames('mx-8')}>
      <TableHead keys={tableKeys} />
      <TableBody
        items={items.map(tableBodyItem =>
          Object.entries(tableBodyItem).map(([key, content]) => ({
            key,
            content,
          }))
        )}
      />
      <TableFoot
        items={footerItems.map(tableFooterItem =>
          tableKeys.map(headerName => {
            const [, content] =
              Object.entries(tableFooterItem).find(
                ([key]) => key === headerName
              ) || [];
            return { content };
          })
        )}
      />
    </table>
  );
};

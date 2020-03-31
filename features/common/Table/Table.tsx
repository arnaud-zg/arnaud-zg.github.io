import classNames from 'classnames';
import React, { FC, TableHTMLAttributes } from 'react';
import { TableBody } from './TableBody';
import { TableFoot } from './TableFoot';
import { TableHead } from './TableHead';

export enum TableMode {
  DEFAULT = 'DEFAULT',
  ALTERNATE = 'ALTERNATE',
}

interface TableItem {
  [key: string]: string | number;
}

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  items: TableItem[];
  footerItems?: TableItem[];
  mode?: TableMode;
}

export const Table: FC<TableProps> = ({
  items,
  footerItems = [],
  mode = TableMode.DEFAULT,
}) => {
  const tableKeys = Object.keys(items[0]);

  return (
    <table className={classNames('table-auto', 'mx-8')}>
      <TableHead keys={tableKeys} />
      <TableBody
        mode={mode}
        items={items.map(tableBodyItem =>
          Object.entries(tableBodyItem).map(([key, content]) => ({
            key,
            content,
          }))
        )}
      />
      <TableFoot
        mode={mode}
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

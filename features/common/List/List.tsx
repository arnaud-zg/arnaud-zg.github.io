import React, { FC } from 'react';
import classNames from 'classnames';
import { ListItem, ListItemProps } from './ListItem';

export enum ListMode {
  UNORDERED = 'UNORDERED',
  ALTERNATE = 'ALTERNATE',
  ORDERED = 'ORDERED',
}

interface ListProps {
  items: ListItemProps[];
  mode?: ListMode;
}

const MODE_CLASS_MAPPING = {
  [ListMode.UNORDERED]: ['list-none'],
  [ListMode.ALTERNATE]: ['list-disc'],
  [ListMode.ORDERED]: ['list-decimal'],
};

export const List: FC<ListProps> = ({ items, mode = ListMode.UNORDERED }) => (
  <ul className={classNames('px-8', 'list-inside', MODE_CLASS_MAPPING[mode])}>
    {items.map(item => (
      <ListItem key={item.id} {...item}>
        {item.content}
      </ListItem>
    ))}
  </ul>
);

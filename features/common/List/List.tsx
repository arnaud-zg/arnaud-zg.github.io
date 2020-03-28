import React, { FC } from 'react';
import classNames from 'classnames';
import { ListItem, ListItemProps } from './ListItem';

interface ListProps {
  items: ListItemProps[];
}

export const List: FC<ListProps> = ({ items }) => (
  <ul className={classNames('px-8')}>
    {items.map(item => (
      <ListItem key={item.id} {...item}>
        {item.content}
      </ListItem>
    ))}
  </ul>
);

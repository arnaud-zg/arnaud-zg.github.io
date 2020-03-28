import React, { FC } from 'react';
import classNames from 'classnames';
import { DefinitionItem, DefinitionItemProps } from './DefinitionItem';

interface DefinitionProps {
  items: DefinitionItemProps[];
}

export const Definition: FC<DefinitionProps> = ({ items }) => {
  return (
    <dl className={classNames('px-8')}>
      {items.map(item => (
        <DefinitionItem
          key={item.name}
          name={item.name}
          description={item.description}
        />
      ))}
    </dl>
  );
};

import React, { FC } from 'react';
import classNames from 'classnames';

export interface DefinitionItemProps {
  name: string;
  description: string;
}

export const DefinitionItem: FC<DefinitionItemProps> = ({
  name,
  description,
}) => (
  <>
    <dt className={classNames('px-2')}>{name}</dt>
    <dd className={classNames('px-4')}>
      <p>{description}</p>
    </dd>
  </>
);

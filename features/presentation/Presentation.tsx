import React from 'react';
import { SocialNetworks } from './socialNetworks';
import data from '../common/data.json';
import classNames from 'classnames';
import { Title, Text } from '../common';

const { firstName, lastName, descriptions } = data;

export const Presentation = () => (
  <header className={classNames('self-center', 'text-center')}>
    <Title classnames={['font-black', 'tracking-tight']} level={1}>
      {`${firstName} ${lastName}`}
    </Title>
    <div
      className={classNames(
        'mt-4',
        'grid',
        'grid-flow-row',
        'sm:grid-flow-col',
        'sm:divide-x-2',
        'sm:divide-dashed',
        'sm:divide-gray-200'
      )}>
      {descriptions.map((description) => (
        <Text classnames={['px-4', 'text-xl']} key={description}>
          {description}
        </Text>
      ))}
    </div>
    <SocialNetworks />
  </header>
);

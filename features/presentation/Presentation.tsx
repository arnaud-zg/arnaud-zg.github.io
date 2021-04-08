import React from 'react';
import { SocialNetworks } from './socialNetworks';
import { firstName, lastName, descriptions } from '../common/data.json';
import classNames from 'classnames';
import { Title } from '../common/Title';
import { Text } from '../common/Text';

export const Presentation = () => (
  <header className={classNames('self-center', 'text-center')}>
    <Title classnames={['font-black', 'tracking-tight']} level={1}>
      {`${firstName} ${lastName}`}
    </Title>
    <Text classnames={['mt-4', 'opacity-75', 'text-xl']}>
      {descriptions.join(' • ')}
    </Text>
    <SocialNetworks />
  </header>
);

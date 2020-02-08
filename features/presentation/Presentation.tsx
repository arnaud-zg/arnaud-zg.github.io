import React from 'react';
import { SocialNetworks } from './socialNetworks';
import { firstName, lastName, descriptions } from '../common/data.json';
import classNames from 'classnames';

export const Presentation = () => (
  <header id="header">
    <div>
      <h1 className={classNames('font-black', 'tracking-tight')}>
        {firstName} {lastName}
      </h1>
      <p className={classNames('mt-4', 'opacity-75', 'text-xl')}>
        {descriptions.join(' • ')}
      </p>
    </div>
    <SocialNetworks />
  </header>
);

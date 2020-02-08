import React from 'react';
import { SocialNetworks } from './socialNetworks';
import { firstName, lastName, descriptions } from '../common/data.json';

export const Presentation = () => (
  <header id="header">
    <div>
      <h1>
        {firstName} {lastName}
      </h1>
      <p>{descriptions.join(' • ')}</p>
    </div>
    <SocialNetworks />
  </header>
);

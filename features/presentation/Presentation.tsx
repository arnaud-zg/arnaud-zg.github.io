import React from 'react';
import { SocialNetworks } from './socialNetworks';
import { userName, descriptions } from '../common/data.json';

export const Presentation = () => (
  <header id="header">
    <div>
      <h1>{userName}</h1>
      <p>{descriptions.join(' • ')}</p>
    </div>
    <SocialNetworks />
  </header>
);

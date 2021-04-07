import classNames from 'classnames';
import React from 'react';
import { Variation } from '../../common/color';
import { Icon, IconType } from '../../common/Icon';
import { Size } from '../../common/size';

const SOCIAL_NETWORKS = [
  {
    href: 'https://twitter.com/arnaudzg',
    type: IconType.TWITTER,
    label: 'Twitter',
  },
  {
    href: 'https://www.linkedin.com/in/arnaudzheng',
    type: IconType.LINKEDIN,
    label: 'Linkedin',
  },
  {
    href: 'https://github.com/arnaud-zg',
    type: IconType.GITHUB,
    label: 'Github',
  },
];

export const SocialNetworks = () => (
  <nav className={classNames('mt-6')}>
    <ul
      className={classNames(
        'flex',
        'flex-wrap',
        'justify-center',
        'space-x-2'
      )}>
      {SOCIAL_NETWORKS.map(({ href, type, label }) => (
        <li
          key={label}
          className={classNames(
            'cursor-pointer',
            'h-20',
            'w-20',
            'border',
            'border-white',
            'rounded-full',
            'flex',
            'items-center',
            'justify-center'
          )}>
          <a href={href} rel="noopener noreferrer" target="_blank">
            <Icon type={type} size={Size.XS} variation={Variation.LIGHT} />
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

import classNames from 'classnames';
import React from 'react';
import { Variation } from '../../common/color';
import { Icon, IconType } from '../../common/Icon';
import { Size } from '../../common/size';
import { Link } from '../../common/Link';

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
  <nav className={classNames('mt-4')}>
    <ul
      className={classNames(
        'flex',
        'flex-wrap',
        'justify-around',
        'sm:justify-center',
        'space-x-2'
      )}>
      {SOCIAL_NETWORKS.map(({ href, type, label }) => (
        <li className={classNames('cursor-pointer')}>
          <Link
            key={label}
            href={href}
            rel="noopener noreferrer"
            target="_blank"
            className={classNames(
              'flex',
              'items-center',
              'justify-center',
              'border',
              'border-white',
              'rounded-full',
              'h-16',
              'w-16',
              'transition',
              'ease-in-out',
              'transform',
              'hover:scale-110',
              'duration-500'
            )}
            {...{ 'aria-label': type }}>
            <Icon type={type} size={Size.S} variation={Variation.LIGHT} />
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

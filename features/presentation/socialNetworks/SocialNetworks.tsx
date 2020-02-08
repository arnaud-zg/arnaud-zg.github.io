import React from 'react';
import classNames from 'classnames';

const SOCIAL_NETWORKS = [
  {
    href: 'https://twitter.com/arnaudzg',
    brandIcon: 'twitter',
    label: 'Twitter',
  },
  {
    href: 'https://www.linkedin.com/in/arnaudzheng',
    brandIcon: 'linkedin',
    label: 'Linkedin',
  },
  {
    href: 'https://github.com/arnaud-zg',
    brandIcon: 'github-alt',
    label: 'Github',
  },
];

export const SocialNetworks = () => (
  <nav className={classNames('mt-6')}>
    <ul className={classNames('flex', 'flex-wrap', 'justify-center')}>
      {SOCIAL_NETWORKS.map(({ href, brandIcon, label }) => (
        <li key={label} className={classNames('h-20', 'opacity-0', 'w-20')}>
          <a
            className={`icon brands fa-${brandIcon}`}
            href={href}
            target="_blank">
            <span className={classNames('hidden')}>{label}</span>
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

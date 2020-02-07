import React from 'react';

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
  <nav>
    <ul>
      {SOCIAL_NETWORKS.map(({ href, brandIcon, label }) => (
        <li key={label}>
          <a
            className={`icon brands fa-${brandIcon}`}
            href={href}
            target="_blank">
            <span className="label">{label}</span>
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

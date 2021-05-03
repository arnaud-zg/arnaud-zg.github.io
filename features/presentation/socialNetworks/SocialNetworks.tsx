import classNames from 'classnames';
import React from 'react';
import { Variation } from '../../common/color';
import { Icon, IconType } from '../../common/Icon';
import { Size } from '../../common/size';
import { Link } from '../../common/Link';
import data from '../../common/data.json';

const { socialProfiles } = data;

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
      {Object.entries(socialProfiles).map(([type, href]) => (
        <li key={type} className={classNames('cursor-pointer')}>
          <Link
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
            <Icon
              type={type as IconType}
              size={Size.S}
              variation={Variation.LIGHT}
            />
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

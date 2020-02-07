import React from 'react';
import { userName } from './data.json';

const footerList = [
  {
    label: `© ${userName}`,
  },
  {
    prefix: 'Design: ',
    label: 'HTML5 UP',
    href: 'http://html5up.net',
    target: '_blank',
  },
];

export const Footer = () => (
  <footer id="footer">
    <span className="copyright">
      {footerList
        .map(({ prefix = '', label, href, target }) => {
          return href ? (
            <>
              {prefix}
              <a href={href} target={target}>
                {label}
              </a>
            </>
          ) : (
            `${prefix}${label}`
          );
        })
        .reduce(
          (acc, item) => [acc, ...(!acc.length ? [item] : [' | ', item])],
          []
        )}
    </span>
  </footer>
);

import React from 'react';
import classNames from 'classnames';
import data from './data.json';

interface FooterItemProps {
  prefix?: string;
  label: string;
  href?: string;
  target?: string;
}

const { firstName, lastName } = data;

const footerList: FooterItemProps[] = [
  {
    prefix: '© ',
    label: `${firstName} ${lastName}`,
  },
  {
    prefix: 'Design: ',
    label: 'HTML5 UP',
    href: 'http://html5up.net',
    target: '_blank',
  },
];

const FooterItemLink = ({ prefix, href, target, label }: FooterItemProps) => (
  <>
    {prefix}
    <a href={href} rel="noopener noreferrer" target={target}>
      {label}
    </a>
  </>
);

const FooterItemText = ({
  prefix,
  label,
}: Pick<FooterItemProps, 'prefix' | 'label'>) => <>{`${prefix}${label}`}</>;

const decorateFooterList = ({
  footerList,
}: {
  footerList: (string | JSX.Element)[];
}) =>
  footerList.reduce(
    (acc, item) => [acc, ...(!acc.length ? [item] : [' | ', item])],
    []
  );

export const Footer = () => (
  <footer
    className={classNames('cursor-default', 'py-4', 'text-center', 'w-full')}>
    {decorateFooterList({
      footerList: footerList.map(({ prefix = '', label, href, target }) =>
        href ? (
          <FooterItemLink
            key={label}
            prefix={prefix}
            href={href}
            target={target}
            label={label}
          />
        ) : (
          <FooterItemText key={label} prefix={prefix} label={label} />
        )
      ),
    })}
  </footer>
);

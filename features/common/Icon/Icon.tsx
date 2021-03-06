import { FC, createElement } from 'react';
import classNames from 'classnames';
import { CodePen } from './CodePen';
import { Docker } from './Docker';
import { Expo } from './Expo';
import { Github } from './Github';
import { Instagram } from './Instagram';
import { Linkedin } from './Linkedin';
import { Npm } from './Npm';
import { Reddit } from './Reddit';
import { Spotify } from './Spotify';
import { StackOverflow } from './StackOverflow';
import { Twitter } from './Twitter';
import { Variation, Color } from '../color';
import { Size } from '../size';

export enum IconType {
  CODEPEN = 'CODEPEN',
  DOCKER = 'DOCKER',
  EXPO = 'EXPO',
  GITHUB = 'GITHUB',
  INSTAGRAM = 'INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  NPM = 'NPM',
  REDDIT = 'REDDIT',
  SPOTIFY = 'SPOTIFY',
  STACKOVERFLOW = 'STACKOVERFLOW',
  TWITTER = 'TWITTER',
}

const initialClassnames = ['fill-current', 'inline-flex'];

const ICON_COMPONENT_MAP = {
  [IconType.CODEPEN]: CodePen,
  [IconType.DOCKER]: Docker,
  [IconType.EXPO]: Expo,
  [IconType.GITHUB]: Github,
  [IconType.INSTAGRAM]: Instagram,
  [IconType.LINKEDIN]: Linkedin,
  [IconType.NPM]: Npm,
  [IconType.REDDIT]: Reddit,
  [IconType.SPOTIFY]: Spotify,
  [IconType.STACKOVERFLOW]: StackOverflow,
  [IconType.TWITTER]: Twitter,
};

const SIZE_CLASS_MAP = {
  [Size.XS]: ['h-6', 'w-6'],
  [Size.S]: ['h-8', 'w-8'],
  [Size.M]: ['h-10', 'w-10'],
  [Size.L]: ['h-12', 'w-12'],
  [Size.XL]: ['h-14', 'w-14'],
};

const VARIATION_CLASS_MAP = {
  [Variation.DARK]: [`text-${Color.DARK}-900`],
  [Variation.LIGHT]: [`text-${Color.LIGHT}-100`],
};

export interface IconProps {
  type: IconType;
  size: Size;
  variation?: Variation.DARK | Variation.LIGHT;
}

export const Icon: FC<IconProps> = ({ size, type, variation }) =>
  createElement(ICON_COMPONENT_MAP[type], {
    className: classNames(
      initialClassnames,
      SIZE_CLASS_MAP[size],
      VARIATION_CLASS_MAP[variation]
    ),
    ...(variation ? { style: {} } : {}),
  });

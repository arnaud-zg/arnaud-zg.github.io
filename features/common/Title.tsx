import classNames from 'classnames';
import { ClassDictionary } from 'classnames/types';
import { createElement, FC } from 'react';

type TitleLevel = keyof typeof FONT_SIZE_CLASS_MAPPING;

export interface TitleProps {
  children: string;
  classnames?: ClassDictionary;
  level: TitleLevel;
}

const initialClassnames = ['font-sans', 'font-thin', 'mt-4'];

export const FONT_SIZE_CLASS_MAPPING = {
  1: ['text-6xl'],
  2: ['text-5xl', 'px-1'],
  3: ['text-4xl', 'px-2'],
  4: ['text-3xl', 'px-3'],
  5: ['text-2xl', 'px-4'],
  6: ['text-xl', 'px-5'],
  7: ['text-lg', 'px-6'],
};

export const Title: FC<TitleProps> = ({ children, classnames, level }) =>
  createElement(
    `h${level}`,
    {
      className: classNames(
        ...initialClassnames,
        FONT_SIZE_CLASS_MAPPING[level],
        classnames
      ),
    },
    children
  );

import React, { FC } from 'react';
import { Text } from './Text';
import { FONT_SIZE_CLASS_MAPPING, Title, TitleProps } from './Title';

interface HeadingProps {
  titleLevel: TitleProps['level'];
  title: string;
  subTitle: string;
}

export const Heading: FC<HeadingProps> = ({ titleLevel, title, subTitle }) => (
  <header>
    <Title level={titleLevel}>{title}</Title>
    <Text
      classnames={[
        ...(FONT_SIZE_CLASS_MAPPING[titleLevel + 2] || []),
        'font-hairline',
      ]}>
      {subTitle}
    </Text>
  </header>
);

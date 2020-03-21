import React, { FC } from 'react';
import { Text } from './Text';
import { FONT_SIZE_CLASS_MAPPING, Title, TitleProps } from './Title';

interface HeadingProps {
  titleLevel: TitleProps['level'];
}

export const Heading: FC<HeadingProps> = ({ titleLevel }) => (
  <header>
    <Title level={titleLevel}>Heading with a subtitle</Title>
    <Text
      classnames={[
        ...(FONT_SIZE_CLASS_MAPPING[titleLevel + 2] || []),
        'font-hairline',
      ]}>
      Lorem ipsum dolor sit amet nullam id egestas urna aliquam
    </Text>
  </header>
);

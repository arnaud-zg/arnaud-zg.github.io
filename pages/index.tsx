import classNames from 'classnames';
import { NextSeo, SocialProfileJsonLd } from 'next-seo';
import React from 'react';
import { Background, Footer, Overlay } from '../features/common';
import {
  descriptions,
  firstName,
  lastName,
  socialProfiles,
  technologiesUsed,
  url,
} from '../features/common/data.json';
import { Layout } from '../features/common/Layout';
import { Presentation } from '../features/presentation';

function HomePage() {
  const title = `${firstName} ${lastName} | ${descriptions[0]}`;
  const description = `Currently working with ${technologiesUsed.join(
    ', '
  )}. Software technology enthusiast.`;
  return (
    <Layout>
      <NextSeo
        title={title}
        description={description}
        openGraph={{
          title,
          description,
          url,
          type: 'profile',
          profile: {
            firstName,
            lastName,
            gender: 'male',
          },
        }}
      />
      <SocialProfileJsonLd
        type="Person"
        name={`${firstName} ${lastName}`}
        url={url}
        sameAs={Object.values(socialProfiles)}
      />
      <Background />
      <Overlay />
      <div
        className={classNames(
          'flex',
          'flex-col',
          'h-full',
          'justify-between',
          'w-full'
        )}>
        <div />
        <Presentation />
        <Footer />
      </div>
    </Layout>
  );
}

export default HomePage;

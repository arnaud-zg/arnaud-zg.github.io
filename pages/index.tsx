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
  return (
    <Layout>
      <NextSeo
        title={`${firstName} ${lastName} | ${descriptions[0]}`}
        description={`${descriptions[0]}`}
        openGraph={{
          title: `${firstName} ${lastName} | ${descriptions[0]}`,
          description: `${descriptions[0]} | ${technologiesUsed.join(', ')}`,
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
          'fixed',
          'flex',
          'h-full',
          'inset-0',
          'justify-center',
          'w-full'
        )}>
        <Presentation />
        <Footer />
      </div>
    </Layout>
  );
}

export default HomePage;

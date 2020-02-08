import classNames from 'classnames';
import { NextSeo } from 'next-seo';
import React, { useEffect } from 'react';
import { Background, Overlay } from '../features/common';
import {
  descriptions,
  firstName,
  lastName,
  url,
} from '../features/common/data.json';
import { Footer } from '../features/common/Footer';
import { Layout } from '../features/common/Layout';
import { Presentation } from '../features/presentation';

function HomePage() {
  useEffect(() => {
    window.onload = () => {
      document.body.classList.remove('is-preload');
    };
    window.ontouchmove = () => false;
    window.onorientationchange = () => {
      document.body.scrollTop = 0;
    };
  });

  return (
    <Layout>
      <NextSeo
        title={`${firstName} ${lastName} | ${descriptions[0]}`}
        description={`${descriptions[0]}`}
        openGraph={{
          title: `${firstName} ${lastName} | ${descriptions[0]}`,
          description: `${descriptions[0]}`,
          url,
          type: 'profile',
          profile: {
            firstName,
            lastName,
            // username: 'arnaud-zg',
            gender: 'male',
          },
        }}
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

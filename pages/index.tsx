import React, { useEffect } from 'react';
import { Background, Overlay } from '../features/common';
import { Presentation } from '../features/presentation';
import { Layout } from '../features/common/Layout';
import { Footer } from '../features/common/Footer';

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
      <Background />
      <Overlay />
      <div id="main">
        <Presentation />
        <Footer />
      </div>
    </Layout>
  );
}

export default HomePage;

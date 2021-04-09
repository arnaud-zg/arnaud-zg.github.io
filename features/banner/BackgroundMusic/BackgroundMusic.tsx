import React from 'react';
import useSound from 'use-sound';
import { motion } from 'framer-motion';

const MEDIA_URL = '/assets/media/touch.ogg';
const DEFAULT_VOLUME = 0.5;

export const BackgroundMusic = () => {
  const [play, { isPlaying, pause }] = useSound(MEDIA_URL, {
    volume: DEFAULT_VOLUME,
  });
  const onClick = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <motion.div
      {...(isPlaying
        ? {
            animate: { x: [0, -10, 0] },
            transition: {
              duration: 10,
              ease: 'linear',
              loop: Infinity,
            },
          }
        : {})}>
      <button className={'focus:outline-none'} onClick={onClick}>
        {isPlaying
          ? 'Daft Punk - Epilogue / Touch (Orkidea Pure Progressive Mix)'
          : 'Touch'}
      </button>
    </motion.div>
  );
};

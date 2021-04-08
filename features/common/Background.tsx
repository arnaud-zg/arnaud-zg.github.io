import classNames from 'classnames';
import { motion } from 'framer-motion';
import React, { FC } from 'react';

interface BackgroundProps {
  withAnimation?: boolean;
}

export const Background: FC<BackgroundProps> = ({ withAnimation = true }) => (
  <>
    <motion.div
      className={classNames(
        'fixed',
        'bg-hero',
        'bg-left-bottom',
        'bg-repeat-x',
        'bg-auto',
        'h-full'
      )}
      style={{ backgroundColor: '#348cb2', width: '3840px' }}
      {...(withAnimation
        ? {
            animate: {
              x: [0, -1920, 0],
            },
            transition: {
              duration: 240,
              ease: 'linear',
              loop: Infinity,
              repeatDelay: 1,
            },
          }
        : {})}
    />
  </>
);

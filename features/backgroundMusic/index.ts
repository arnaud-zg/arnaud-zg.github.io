import dynamic from 'next/dynamic';

export const BackgroundMusic = dynamic(() =>
  import('./BackgroundMusic').then((module) => module.BackgroundMusic)
);

import dynamic from 'next/dynamic';

export const Banner = dynamic(() =>
  import('./Banner').then((module) => module.Banner)
);

import dynamic from 'next/dynamic';

export const Background = dynamic(() =>
  import('./Background').then((module) => module.Background)
);

export const Footer = dynamic(() =>
  import('./Footer').then((module) => module.Footer)
);

export const Overlay = dynamic(() =>
  import('./Overlay').then((module) => module.Overlay)
);

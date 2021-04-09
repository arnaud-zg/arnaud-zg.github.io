import dynamic from 'next/dynamic';

export const Title = dynamic(() =>
  import('./Title').then((module) => module.Title)
);

export const Text = dynamic(() =>
  import('./Text').then((module) => module.Text)
);

export const Background = dynamic(() =>
  import('./Background').then((module) => module.Background)
);

export const Footer = dynamic(() =>
  import('./Footer').then((module) => module.Footer)
);

export const Overlay = dynamic(() =>
  import('./Overlay').then((module) => module.Overlay)
);

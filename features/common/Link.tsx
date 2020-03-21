import React, { AnchorHTMLAttributes, FC } from 'react';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {}

export const Link: FC<LinkProps> = props => <a {...props} />;

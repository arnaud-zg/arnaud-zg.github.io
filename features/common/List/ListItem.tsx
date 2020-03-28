import React, { FC, ReactNode } from 'react';

export interface ListItemProps {
  id: string;
  content: ReactNode;
}

export const ListItem: FC<ListItemProps> = ({ content }) => <li>{content}</li>;

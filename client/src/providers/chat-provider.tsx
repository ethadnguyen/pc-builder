'use client';

import React from 'react';
import { ChatBox } from '@/components/custom/ChatBox';

export const ChatBoxProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      {children}
      <ChatBox />
    </>
  );
};

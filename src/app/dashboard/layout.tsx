'use client';

import { Box } from '@mui/material';
import { PropsWithChildren, useState } from 'react';

import { SideBar, PageBackground, TopBar } from '@/app/core/components/ui/layout';

export default function Layout({ children }: PropsWithChildren) { 
  const [smallDeviceOpen, setSmallDeviceOpen] = useState(false);

  return (
    <PageBackground>
      <TopBar setSmallDeviceOpen={setSmallDeviceOpen} />
      <Box sx={{ display: 'flex' }}>
        <SideBar smallDeviceOpen={smallDeviceOpen} setSmallDeviceOpen={setSmallDeviceOpen} />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 5, lg: 12 } }}>
          {children}
        </Box>
      </Box>
    </PageBackground>
  );
}

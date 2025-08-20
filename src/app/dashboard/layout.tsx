'use client';

import { Box } from '@mui/material';
import { PropsWithChildren, useState } from 'react';

import { SideBar, PageBackground, TopBar } from '@/app/core/components/ui/layout';

export default function Layout({ children }: PropsWithChildren) { 
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PageBackground>
      <TopBar setMobileOpen={setMobileOpen} />
      <Box sx={{ display: 'flex' }}>
        <SideBar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </PageBackground>
  );
}

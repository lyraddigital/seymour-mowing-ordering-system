'use client';

import { AppBar, Box, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { PropsWithChildren, useState } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

import { SideBar, PageBackground } from '@/app/core/components/ui/layout';

export default function Layout({ children }: PropsWithChildren) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PageBackground>
      <AppBar position="fixed" sx={{
        boxShadow: 'none', backgroundColor: (theme) => theme.palette.background.default
      }}>
        <Toolbar>
          {isMobile && (
            <>
              <IconButton
                aria-label="open drawer"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1, color: theme.palette.text.primary }}
              >
                <MenuIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Box sx={{ display: 'flex' }}>
        <SideBar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    </PageBackground>
  );
}

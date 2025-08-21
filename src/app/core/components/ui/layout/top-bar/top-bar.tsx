import { AppBar, Toolbar, Box } from '@mui/material';
import React from 'react';

import TopBarMenu from './top-bar-menu';
import HamburgerMenu from './hamburger-menu';

type TopBarProps = {
  setMobileOpen: (open: boolean) => void;
};

export default function TopBar({ setMobileOpen }: TopBarProps) {
  return (
    <>
      <AppBar position="fixed" sx={{
        boxShadow: 'none', backgroundColor: (theme) => theme.palette.background.default
      }}>
        <Toolbar>          
          <HamburgerMenu setMobileOpen={setMobileOpen} />
          <Box sx={{ ml: 'auto' }}>
            <TopBarMenu />
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}

import { AppBar, Toolbar, Box } from '@mui/material';
import React from 'react';

import TopBarMenu from './top-bar-menu';
import HamburgerMenu from './hamburger-menu';

type TopBarProps = {
  setSmallDeviceOpen: (open: boolean) => void;
};

export default function TopBar({ setSmallDeviceOpen }: TopBarProps) {
  return (
    <>
      <AppBar position="fixed" sx={{
        boxShadow: 'none', backgroundColor: (theme) => theme.palette.background.default
      }}>
        <Toolbar>          
          <HamburgerMenu setMobileOpen={setSmallDeviceOpen} />
          <Box sx={{ ml: 'auto' }}>
            <TopBarMenu />
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}

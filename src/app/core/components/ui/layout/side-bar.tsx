'use client';

import { Box, Drawer, IconButton, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Dispatch, SetStateAction } from 'react';

import { SideNavigation } from '@/app/core/components/ui/layout/navigation';

type SideBarProps = {
  smallDeviceOpen: boolean;
  setSmallDeviceOpen: Dispatch<SetStateAction<boolean>>;
};

export default function SideBar({ smallDeviceOpen, setSmallDeviceOpen }: SideBarProps) {
  const theme = useTheme();
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

  return (
    isSmallDevice && !smallDeviceOpen ? null : (
      <Drawer
        variant={isSmallDevice ? "temporary" : "permanent"}
        open={isSmallDevice ? smallDeviceOpen : false}
        onClose={() => setSmallDeviceOpen(false)}
        sx={{
          width: 258,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 258,
            boxSizing: 'border-box',
            backgroundColor: (theme) => theme.palette.mode === 'light'
              ? theme.palette.primary.main: theme.palette.background.default,
            boxShadow: 'none',
            border: 'none'
          },
        }}
      >
        <Toolbar sx={{
          justifyContent: 'flex-end',
          backgroundColor: (theme) => theme.darken(theme.palette.primary.main, 0.1),
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          px: 1,
          minHeight: { xs: 56, sm: 64 }
        }}>
          <Box sx={{ flexGrow: 1 }} />
          {isSmallDevice && (
            <IconButton onClick={() => setSmallDeviceOpen(false)} sx={{ color: theme.palette.primary.contrastText }}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Toolbar>
        <SideNavigation />
      </Drawer>
    )
  );
}
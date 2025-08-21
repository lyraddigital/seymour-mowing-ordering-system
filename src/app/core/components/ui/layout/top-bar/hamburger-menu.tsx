import React from 'react';
import { IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

type HamburgerMenuProps = {
  setMobileOpen: (open: boolean) => void;
};

export default function HamburgerMenu({ setMobileOpen }: HamburgerMenuProps) {
  const theme = useTheme();
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

  if (!isSmallDevice) return null;

  return (
    <IconButton
      aria-label="open drawer"
      edge="start"
      onClick={() => setMobileOpen(true)}
      sx={{ mr: 1, color: theme.palette.text.primary }}
    >
      <MenuIcon />
    </IconButton>
  );
}

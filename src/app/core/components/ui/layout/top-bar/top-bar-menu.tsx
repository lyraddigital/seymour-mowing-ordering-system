import React from 'react';
import { Button, Avatar, Menu, MenuItem, Typography, useTheme } from '@mui/material';

import { signOut } from '@/app/core/actions';

export default function TopBarMenu() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    handleMenuClose();
    
    await signOut();
  }

  return (
    <>
      <Button
        aria-label="open context menu"
        onClick={handleMenuOpen}
        sx={{ minWidth: 0, p: 0, borderRadius: '50%' }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
          }}
        >
          S
        </Avatar>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              border: '1px solid',
              borderColor: theme => theme.palette.grey[300],
              boxShadow: theme => theme.shadows[2],
            }
          }
        }}
      >
        <MenuItem onClick={handleSignOut}>
          <Typography variant="body1">Sign out</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

'use client';

import { ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import { usePathname } from 'next/navigation';

import { IconRenderer } from '@/app/core/components/ui/icons';
import { NavItem } from '@/app/core/types';

type NavigationListItemProps = {
  item: NavItem;
};

export default function NavigationListItem({ item }: NavigationListItemProps) {
  const { text, href, icon } = item;
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <ListItem disablePadding>
      <ListItemButton
        component="a"
        href={href}
        selected={isActive}
        sx={{
          pl: 7,
          '&:hover': {
            backgroundColor: (theme) => theme.darken(theme.palette.primary.main, 0.1),
          },
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: (theme) => theme.darken(theme.palette.primary.main, 0.1),
          },
        }}
      >
        <Box sx={{ minWidth: 32, display: 'flex', alignItems: 'center', mr: 2 }}>
          <IconRenderer icon={icon} />
        </Box>
        <ListItemText
          primary={text}
          sx={{
            color: (theme) => theme.palette.primary.contrastText,
            fontWeight: 'normal'
          }}
          slotProps={{
            primary: {
              variant: 'body1',
            }
          }}
        />
      </ListItemButton>
    </ListItem>
  );
}

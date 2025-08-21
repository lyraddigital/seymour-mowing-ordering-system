import { ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import { usePathname } from 'next/navigation';

import { IconType } from '@/app/core/configuration';
import { IconRenderer } from '@/app/core/components/ui/icons';

type NavigationListItemProps = {
  text: string;
  href: string;
  icon: IconType;
};

export default function NavigationListItem({ text, href, icon }: NavigationListItemProps) {
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

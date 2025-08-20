import { ListItem, ListItemButton, ListItemText } from '@mui/material';
import { usePathname } from 'next/navigation';

type NavigationListItemProps = {
  text: string;
  href: string;
};

export default function NavigationListItem({ text, href }: NavigationListItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <ListItem disablePadding>
      <ListItemButton
        component="a"
        href={href}
        selected={isActive}
        sx={{
          '&:hover': {
            backgroundColor: (theme) => theme.darken(theme.palette.primary.main, 0.1),
          },
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: (theme) => theme.darken(theme.palette.primary.main, 0.1),
          },
        }}
      >
        <ListItemText primary={text} sx={{
          color: (theme) => theme.palette.primary.contrastText
        }} />
      </ListItemButton>
    </ListItem>
  );
}

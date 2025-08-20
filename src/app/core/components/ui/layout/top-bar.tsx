import { AppBar, Toolbar, IconButton,  useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

type TopBarProps = {
  setMobileOpen: (open: boolean) => void;
};

export default function TopBar({ setMobileOpen }: TopBarProps) {
  const theme = useTheme();
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <AppBar position="fixed" sx={{
        boxShadow: 'none', backgroundColor: (theme) => theme.palette.background.default
      }}>
        <Toolbar>
          {isSmallDevice && (
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1, color: theme.palette.text.primary }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}

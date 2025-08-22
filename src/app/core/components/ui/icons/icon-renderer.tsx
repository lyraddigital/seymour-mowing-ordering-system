import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import { Theme } from '@mui/material';

import { IconType } from '@/app/core/enums';

const iconSx = { color: (theme: Theme) => theme.palette.primary.contrastText };

type IconRendererProps = {
  icon: IconType;
};

export default function IconRenderer({ icon }: IconRendererProps) {
  switch (icon) {
    case IconType.dashboard:
      return <DashboardIcon sx={iconSx} />;
    case IconType.customers:
      return <PeopleIcon sx={iconSx} />;
    default:
      return null;
  }
}

import { List } from '@mui/material';

import { navLinks } from '@/app/core/configuration';

import NavigationListItem from './navigation-item';

export default function SideNavigation() {
  return (
    <List>
      {navLinks.map((item) => (
        <NavigationListItem
          key={item.text}
          text={item.text}
          href={item.href}
          icon={item.icon}
        />
      ))}
    </List>
  );
}

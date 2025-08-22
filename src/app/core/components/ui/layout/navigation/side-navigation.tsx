import { List } from '@mui/material';

import { navItems } from '@/app/core/configuration';

import NavigationListItem from './navigation-item';

export default function SideNavigation() {
  return (
    <List>
      {navItems.map((item) => (
        <NavigationListItem key={item.text} item={item}/>
      ))}
    </List>
  );
}

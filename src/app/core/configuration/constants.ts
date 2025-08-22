import { IconType } from "@/app/core/enums";

import {
  PagePaths,
  CookieNames,
  NavItem,
  BreadcrumbItem,
} from "@/app/core/types";

export const pagePaths: PagePaths = {
  dashboard: "/dashboard",
  signIn: "/sign-in",
  customers: "/dashboard/customers",
};

export const cookieNames: CookieNames = {
  sessionCookie: "smom-sesh",
};

export const navItems: NavItem[] = [
  {
    text: "Dashboard",
    href: pagePaths.dashboard,
    icon: IconType.dashboard,
  },
  {
    text: "Customers",
    href: pagePaths.customers,
    icon: IconType.customers,
  },
];

export const breadcrumbItems: { [key: string]: BreadcrumbItem[] } = {
  customers: [
    { text: "Home", href: pagePaths.dashboard },
    { text: "Customers" },
  ],
};

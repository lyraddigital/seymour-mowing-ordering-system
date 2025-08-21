type PagePaths = {
  dashboard: string;
  signIn: string;
  customers: string;
};

type CookieNames = {
  sessionCookie: string;
};

export enum IconType {
  dashboard = "dashboard",
  customers = "customers",
}

type NavLink = {
  text: string;
  href: string;
  icon: IconType;
};

export const pagePaths: PagePaths = {
  dashboard: "/dashboard",
  signIn: "/sign-in",
  customers: "/dashboard/customers",
};

export const cookieNames: CookieNames = {
  sessionCookie: "smom-sesh",
};

export const navLinks: NavLink[] = [
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

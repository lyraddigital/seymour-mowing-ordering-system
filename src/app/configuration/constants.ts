type PagePaths = {
  dashboard: string;
  signIn: string;
  customers: string; // added
};

type CookieNames = {
  sessionCookie: string;
};

type NavLink = {
  text: string;
  href: string;
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
  { text: "Dashboard", href: pagePaths.dashboard },
  { text: "Customers", href: pagePaths.customers },
];

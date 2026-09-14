import type { PropsWithChildren } from "react";
import { NavLink, Outlet } from "react-router";

import type { CurrentUser } from "~/server/auth/principal/types/current-user";

type AppShellProps = PropsWithChildren<{
  currentUser: CurrentUser;
}>;

export default function AppShell({ currentUser }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            s
          </span>
          Seymour<span className="brand-dot">.</span>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/dashboard">Dashboard</NavLink>
          {["Customers", "Jobs", "Invoices", "Payments"].map((name) => (
            <span key={name} className="nav-pending" aria-disabled="true">
              {name}
              <small>Coming soon</small>
            </span>
          ))}
        </nav>
        <div className="account">
          <strong>{currentUser.displayName}</strong>
          <span className="role">{currentUser.role}</span>
          <a href="/cdn-cgi/access/logout">Sign out</a>
        </div>
      </aside>
      <main id="main-content" className="workspace">
        <Outlet />
      </main>
    </div>
  );
}

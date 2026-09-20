import type { PropsWithChildren } from "react";
import type { CurrentUser } from "~/server/auth/principal/types/current-user";
import { NavLink } from "react-router";

type AppShellProps = PropsWithChildren<{ currentUser: CurrentUser }>;

export default function AppShell({ currentUser, children }: AppShellProps) {
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
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/jobs">Jobs</NavLink>
          <NavLink to="/invoices">Invoices</NavLink>

          <NavLink to="/payments">Payments</NavLink>
        </nav>
        <div className="account">
          <strong>{currentUser.displayName}</strong>
          <span>{currentUser.email}</span>
          <span className="role">{currentUser.role}</span>
        </div>
      </aside>
      <main id="main-content" className="workspace">
        {children}
      </main>
    </div>
  );
}

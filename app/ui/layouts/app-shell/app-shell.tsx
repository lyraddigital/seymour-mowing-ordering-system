import type { PropsWithChildren } from "react";
import type { CurrentUser } from "~/server/auth/principal/types/current-user";
import { NavLink } from "react-router";
import Icon from "../../components/icon/icon";

type AppShellProps = PropsWithChildren<{ currentUser: CurrentUser }>;

export default function AppShell({ currentUser, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand" aria-label="Seymour Mowing and Maintenance">
          <img
            src="/seymour-logo-800.png"
            alt="Seymour Mowing & Maintenance"
            width="315"
            height="358"
          />
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/dashboard">
            <Icon name="dashboard" />
            Dashboard
          </NavLink>
          <NavLink to="/customers">
            <Icon name="customers" />
            Customers
          </NavLink>
          <NavLink to="/jobs">
            <Icon name="jobs" />
            Jobs
          </NavLink>
          <NavLink to="/invoices">
            <Icon name="invoice" />
            Invoices
          </NavLink>
          <NavLink to="/payments">
            <Icon name="payment" />
            Payments
          </NavLink>
        </nav>
        <div className="account">
          <span className="account-avatar">
            <Icon name="user" />
          </span>
          <div className="account-details">
            <strong>{currentUser.displayName}</strong>
            <span>{currentUser.email}</span>
            <span className="role">{currentUser.role}</span>
          </div>
        </div>
      </aside>
      <main id="main-content" className="workspace">
        {children}
      </main>
    </div>
  );
}

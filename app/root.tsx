import { Outlet } from "react-router";

import type { Route } from "./+types/root";
import { AppDocument } from "./ui/document/app-document";
import { RootErrorBoundary } from "./ui/errors/root-error-boundary";
import "./ui/styles/global.css";

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon.svg",
    type: "image/svg+xml",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return <AppDocument>{children}</AppDocument>;
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RootErrorBoundary error={error} />;
}

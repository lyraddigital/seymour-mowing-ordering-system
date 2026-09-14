import { getRouteErrorPresentation } from "./get-route-error-presentation";

type RootErrorBoundaryProps = {
  error: unknown;
};

export function RootErrorBoundary({ error }: RootErrorBoundaryProps) {
  const { title, message } = getRouteErrorPresentation(error);

  return (
    <main className="error-page">
      <div className="brand">
        Seymour<span className="brand-dot">.</span>
      </div>

      <h1 className="page-title">{title}</h1>

      <p>{message}</p>
    </main>
  );
}

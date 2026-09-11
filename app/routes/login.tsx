import type { Route } from "./+types/login";

export const meta: Route.MetaFunction = () => [
  { title: "Log in | Seymour" },
  { name: "description", content: "Seymour team login." },
  { name: "robots", content: "noindex, nofollow" },
];

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            s
          </span>
          Seymour
          <span className="brand-dot" aria-hidden="true">
            .
          </span>
        </div>
        <div className="login-content">
          <p className="eyebrow">A fresh start</p>
          <p>Test change 2</p>
          <h1 id="login-heading">Log in</h1>
        </div>
        <div className="login-placeholder" aria-hidden="true" />
      </section>
      <footer>Seymour · Mowing made simple</footer>
    </main>
  );
}

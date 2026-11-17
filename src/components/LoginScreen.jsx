import { MonospacedTitle } from "./MonospacedTitle.jsx";

export function LoginScreen({ onSignIn, error, isLoading }) {
  return (
    <main className="login-screen">
      <section className="login-card panel" aria-labelledby="login-title">
        <pre className="welcome-ascii" role="img" aria-label="A little magical cat">
          {readAsciiTemplate("hero-ascii-template")}
        </pre>
        <h1 id="login-title"><MonospacedTitle>Magical Girl Planner</MonospacedTitle></h1>
        <button className="primary-button google-button" type="button" onClick={onSignIn} disabled={isLoading}>
          {isLoading ? "Loading..." : "Sign in with Google"}
        </button>
        <p className="form-error" role="alert">{error}</p>
      </section>
    </main>
  );
}

function readAsciiTemplate(id) {
  const value = document.getElementById(id)?.content.textContent ?? "";
  return value.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

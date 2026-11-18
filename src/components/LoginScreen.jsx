import { useState } from "react";
import { getAuthErrorMessage, getPasswordConfirmationError } from "../auth-errors.js";
import { MonospacedTitle } from "./MonospacedTitle.jsx";

export function LoginScreen({ onSignIn, onSignUp, configError, isLoading }) {
  const [mode, setMode] = useState("signin");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignUp = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));

    const confirmationError = isSignUp ? getPasswordConfirmationError(password, formData.get("confirm")) : "";
    if (confirmationError) {
      setErrorMessage(confirmationError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await (isSignUp ? onSignUp(email, password) : onSignIn(email, password));
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  function switchMode() {
    setMode(isSignUp ? "signin" : "signup");
    setErrorMessage("");
  }

  const message = configError || errorMessage;

  return (
    <main className="login-screen">
      <section className="login-card panel" aria-labelledby="login-title">
        <pre className="welcome-ascii" role="img" aria-label="A little magical cat">
          {readAsciiTemplate("hero-ascii-template")}
        </pre>
        <h1 id="login-title"><MonospacedTitle>Magical Girl Planner</MonospacedTitle></h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </div>
          {isSignUp && (
            <div>
              <label htmlFor="login-confirm">Confirm password</label>
              <input id="login-confirm" name="confirm" type="password" autoComplete="new-password" required />
            </div>
          )}
          <button className="primary-button" type="submit" disabled={isLoading || isSubmitting || Boolean(configError)}>
            {isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="form-error" role="alert">{message}</p>
        <button className="link-button" type="button" onClick={switchMode}>
          {isSignUp ? "I already have an account" : "Create an account"}
        </button>
      </section>
    </main>
  );
}

function readAsciiTemplate(id) {
  const value = document.getElementById(id)?.content.textContent ?? "";
  return value.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

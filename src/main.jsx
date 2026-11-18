import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { AuthProvider, useAuth } from "./auth.jsx";
import { LoginScreen } from "./components/LoginScreen.jsx";
import { db } from "./firebase.js";
import { createFirestoreRepository } from "./task-repository.js";
import "./styles.css";

function Root() {
  const { user, isLoading, configError, signIn, signUp, logOut } = useAuth();
  const repository = useMemo(() => (user ? createFirestoreRepository(db, user.uid) : null), [user]);

  if (!user) {
    return <LoginScreen onSignIn={signIn} onSignUp={signUp} configError={configError} isLoading={isLoading} />;
  }

  return <App user={user} onSignOut={logOut} repository={repository} />;
}

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <Root />
  </AuthProvider>
);

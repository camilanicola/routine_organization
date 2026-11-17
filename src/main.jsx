import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { AuthProvider, useAuth } from "./auth.jsx";
import { LoginScreen } from "./components/LoginScreen.jsx";
import "./styles.css";

function Root() {
  const { user, isLoading, error, signInWithGoogle, logOut } = useAuth();

  if (!user) {
    return <LoginScreen onSignIn={signInWithGoogle} error={error} isLoading={isLoading} />;
  }

  return <App user={user} onSignOut={logOut} />;
}

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <Root />
  </AuthProvider>
);

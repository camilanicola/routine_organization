import { useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "../../src/App.jsx";
import { LoginScreen } from "../../src/components/LoginScreen.jsx";
import { createMemoryRepository } from "../../src/task-repository.js";
import "../../src/styles.css";

// Entrada exclusiva do servidor de testes. Não conecta a serviços Firebase.
const repository = createMemoryRepository(window.plannerInitialTasks ?? []);
window.plannerTest = { repository };

function TestRoot() {
  const [user, setUser] = useState(null);

  async function signIn(email, password) {
    window.plannerTest.credentials = { email, password };
    setUser({ uid: "test-user", email, displayName: "Test User" });
  }

  if (!user) {
    return <LoginScreen onSignIn={signIn} onSignUp={signIn} configError="" isLoading={false} />;
  }

  return <App user={user} onSignOut={() => setUser(null)} repository={repository} />;
}

createRoot(document.getElementById("root")).render(<TestRoot />);

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState(
    isFirebaseConfigured ? "" : "Firebase is not configured. Add your keys to .env.local."
  );

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
  }, []);

  async function signInWithGoogle() {
    if (!auth) return;
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (signInError) {
      if (signInError.code !== "auth/popup-closed-by-user") {
        setError("Could not sign in. Please try again.");
      }
    }
  }

  async function logOut() {
    if (auth) await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

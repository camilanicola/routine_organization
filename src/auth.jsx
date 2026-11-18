import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase.js";

const AuthContext = createContext(null);

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "This email already has an account.",
  "auth/invalid-email": "Enter a valid email.",
  "auth/weak-password": "Password must have at least 6 characters.",
  "auth/invalid-credential": "Wrong email or password.",
  "auth/too-many-requests": "Too many attempts. Try again later."
};

export function getAuthErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? "Something went wrong. Please try again.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
  }, []);

  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email, password) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function logOut() {
    if (auth) await signOut(auth);
  }

  const configError = isFirebaseConfigured ? "" : "Firebase is not configured. Add your keys to .env.local.";

  return (
    <AuthContext.Provider value={{ user, isLoading, configError, signIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

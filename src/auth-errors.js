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

export function getPasswordConfirmationError(password, confirmation) {
  return password === confirmation ? "" : "Passwords do not match.";
}

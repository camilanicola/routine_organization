import assert from "node:assert/strict";
import test from "node:test";
import { getAuthErrorMessage, getPasswordConfirmationError } from "./auth-errors.js";

test("mostra uma mensagem quando o e-mail ou a senha estão incorretos", () => {
  const mensagem = getAuthErrorMessage({ code: "auth/invalid-credential" });

  assert.equal(mensagem, "Wrong email or password.");
});

test("verifica se a confirmação de senha corresponde à senha", () => {
  assert.equal(getPasswordConfirmationError("senha123", "senha456"), "Passwords do not match.");
  assert.equal(getPasswordConfirmationError("senha123", "senha123"), "");
});

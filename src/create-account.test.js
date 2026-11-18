import assert from "node:assert/strict";
import test from "node:test";
import { getAuthErrorMessage } from "./auth-errors.js";

test("informa que o e-mail já está cadastrado", () => {
  const mensagem = getAuthErrorMessage({ code: "auth/email-already-in-use" });

  assert.equal(mensagem, "This email already has an account.");
});

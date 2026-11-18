import assert from "node:assert/strict";
import test from "node:test";
import { getAuthErrorMessage } from "./auth-errors.js";

test("mostra uma mensagem quando o e-mail ou a senha estão incorretos", () => {
  const mensagem = getAuthErrorMessage({ code: "auth/invalid-credential" });

  assert.equal(mensagem, "Wrong email or password.");
});

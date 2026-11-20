import assert from "node:assert/strict";
import test from "node:test";
import { hasExplicitTiming } from "./task-repository.js";

test("verifica se a tarefa possui definição explícita de horário ou duração", () => {
  assert.equal(hasExplicitTiming({ dueAt: "2026-11-18T10:00:00.000Z", endAt: "2026-11-18T11:00:00.000Z" }), true);
  assert.equal(hasExplicitTiming({ dueAt: "2026-11-18T10:00:00.000Z" }), false);
  assert.equal(hasExplicitTiming({ dueAt: null, endAt: null, durationMinutes: 30 }), true);
  assert.equal(hasExplicitTiming({ dueAt: null, endAt: null, durationMinutes: 0 }), false);
});
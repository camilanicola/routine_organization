import assert from "node:assert/strict";
import test from "node:test";
import { hasExplicitTiming, removeTasksWithoutExplicitTiming, createMemoryRepository } from "./task-repository.js";

test("verifica se a tarefa possui definição explícita de horário ou duração", () => {
  assert.equal(hasExplicitTiming({ dueAt: "2026-11-18T10:00:00.000Z", endAt: "2026-11-18T11:00:00.000Z" }), true);
  assert.equal(hasExplicitTiming({ dueAt: "2026-11-18T10:00:00.000Z" }), false);
  assert.equal(hasExplicitTiming({ dueAt: null, endAt: null, durationMinutes: 30 }), true);
  assert.equal(hasExplicitTiming({ dueAt: null, endAt: null, durationMinutes: 0 }), false);
});

test("remove tarefas sem horário explícito do repositório e retorna as válidas", async () => {
  const valida = { id: "1", title: "Estudar", dueAt: null, endAt: null, durationMinutes: 30 };
  const antiga = { id: "2", title: "Antiga", dueAt: "2026-11-18T10:00:00.000Z" };
  const repository = createMemoryRepository([valida, antiga]);

  const resultado = await removeTasksWithoutExplicitTiming(repository, [valida, antiga]);

  assert.equal(resultado.removedCount, 1);
  assert.deepEqual(resultado.tasks, [valida]);
  assert.deepEqual(await repository.load(), [valida]);
});
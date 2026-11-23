import assert from "node:assert/strict";
import test from "node:test";
import { hasExplicitTiming, removeTasksWithoutExplicitTiming, createMemoryRepository } from "./task-repository.js";
import { createTask } from "./task-scheduler.js";

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

test("preserva a tarefa salva quando uma edição ultrapassa o limite de tamanho", async () => {
  const task = createTask({ title: "Estudar", dueAt: null, durationMinutes: 30, priority: "important" });
  const repository = createMemoryRepository();
  await repository.save(task);

  await assert.rejects(repository.save({ ...task, notes: "a".repeat(1_048_576) }), {
    name: "RangeError",
    message: "This task is too large to save. Reduce its content."
  });

  assert.deepEqual(await repository.load(), [task]);
});

test("rejeita todo o lote com uma tarefa grande demais e permite uma nova tentativa válida", async () => {
  const original = createTask({ title: "Estudar", dueAt: null, durationMinutes: 30, priority: "important" });
  const updated = { ...original, title: "Revisar para a prova" };
  const next = createTask({ title: "Ler", dueAt: null, durationMinutes: 45, priority: "neither" });
  const repository = createMemoryRepository([original]);

  await assert.rejects(repository.saveMany([updated, { ...next, iconData: "a".repeat(1_048_576) }]), {
    name: "RangeError",
    message: "This task is too large to save. Choose a smaller PNG or remove the current icon."
  });
  assert.deepEqual(await repository.load(), [original]);

  await repository.saveMany([updated, next]);
  assert.deepEqual(await repository.load(), [updated, next]);
});

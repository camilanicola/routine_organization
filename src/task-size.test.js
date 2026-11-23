import assert from "node:assert/strict";
import test from "node:test";
import { createTask } from "./task-scheduler.js";
import { validateTaskSize } from "./task-size.js";

// Em { notes }, 6.183 bytes são reservados para o nome do documento (6 KiB),
// os metadados (32), o nome do campo (6) e o terminador do texto (1).
const MAX_NOTES_BYTES = 1_042_393;
const CONTENT_ERROR = { name: "RangeError", message: "This task is too large to save. Reduce its content." };
const ICON_ERROR = {
  name: "RangeError",
  message: "This task is too large to save. Choose a smaller PNG or remove the current icon."
};

test("aceita uma tarefa completa com notas, ícone e histórico de conclusões", () => {
  const task = {
    ...createTask({
      title: "Estudar matemática",
      dueAt: "2026-11-18T10:00:00.000Z",
      endAt: "2026-11-18T11:00:00.000Z",
      priority: "important",
      repeatDays: [3, 5],
      notes: "Revisão do capítulo 📚",
      iconData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="
    }),
    completedDates: ["2026-11-18"]
  };

  assert.doesNotThrow(() => validateTaskSize(task));
});

test("aceita o tamanho exato do limite e rejeita um byte a mais", () => {
  const notes = "a".repeat(MAX_NOTES_BYTES);

  assert.doesNotThrow(() => validateTaskSize({ notes }));
  assert.throws(() => validateTaskSize({ notes: `${notes}a` }), CONTENT_ERROR);
});

for (const [description, text, bytes] of [["acento", "é", 2], ["emoji", "📚", 4]]) {
  test(`conta os bytes UTF-8 de texto com ${description} no limite do documento`, () => {
    const notes = "a".repeat(MAX_NOTES_BYTES - bytes) + text;

    assert.doesNotThrow(() => validateTaskSize({ notes }));
    assert.throws(() => validateTaskSize({ notes: `${notes}a` }), CONTENT_ERROR);
  });
}

test("inclui os dias de repetição e o histórico no tamanho total", () => {
  // Os dois campos acrescentam 61 bytes: 35 para repeatDays e 26 para completedDates.
  const task = {
    notes: "a".repeat(MAX_NOTES_BYTES - 61),
    repeatDays: [1, 3, 5],
    completedDates: ["2026-11-18"]
  };

  assert.doesNotThrow(() => validateTaskSize(task));
  assert.throws(() => validateTaskSize({ ...task, repeatDays: [1, 3, 5, 6] }), CONTENT_ERROR);
  assert.throws(() => validateTaskSize({ ...task, completedDates: ["2026-11-18", "2026-11-20"] }), CONTENT_ERROR);
});

test("conta os campos nulos das tarefas sem data", () => {
  // dueAt ocupa 7 bytes (nome + null); endAt também ocupa 7.
  const task = { notes: "a".repeat(MAX_NOTES_BYTES - 14), dueAt: null, endAt: null };

  assert.doesNotThrow(() => validateTaskSize(task));
  assert.throws(() => validateTaskSize({ ...task, notes: `${task.notes}a` }), CONTENT_ERROR);
});

test("rejeita um ícone abaixo de 1 MB quando sua representação Base64 excede o limite", () => {
  const imageBytes = Buffer.alloc(800_000);
  const iconData = `data:image/png;base64,${imageBytes.toString("base64")}`;

  assert.ok(imageBytes.byteLength < 1_000_000);
  assert.throws(() => validateTaskSize({ iconData }), ICON_ERROR);
});

test("rejeita a tarefa completa quando apenas o ícone cabe no limite", () => {
  // O campo iconData comporta 1.042.390 bytes, incluindo o prefixo de 22 bytes.
  const iconData = `data:image/png;base64,${"A".repeat(1_042_368)}`;
  const task = createTask({ title: "Estudar", dueAt: null, durationMinutes: 30, priority: "important", iconData });

  assert.doesNotThrow(() => validateTaskSize({ iconData }));
  assert.throws(() => validateTaskSize(task), ICON_ERROR);
});

test("rejeita valores não suportados, inclusive dentro de arrays e objetos", () => {
  const error = { name: "TypeError", message: "Task contains an unsupported field value." };

  assert.throws(() => validateTaskSize({ notes: undefined }), error);
  assert.throws(() => validateTaskSize({ dueAt: new Date("2026-11-18T10:00:00.000Z") }), error);
  assert.throws(() => validateTaskSize({ completedDates: [undefined] }), error);
  assert.throws(() => validateTaskSize({ extra: { value: 1n } }), error);
});

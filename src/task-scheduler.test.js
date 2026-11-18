import assert from "node:assert/strict";
import test from "node:test";
import { createTask, findNextAvailableSlot } from "./task-scheduler.js";

test("cria uma tarefa removendo espaços extras e organizando os dias de repetição", () => {
  const task = createTask({
    title: "  Estudar  ",
    dueAt: "2026-11-18T10:00:00.000Z",
    endAt: "2026-11-18T10:45:00.000Z",
    priority: "important",
    notes: "  Revisar capítulo  ",
    iconText: "  ☆  ",
    repeatDays: [3, 1, 3]
  });

  assert.equal(task.title, "Estudar");
  assert.equal(task.dueAt, "2026-11-18T10:00:00.000Z");
  assert.equal(task.notes, "Revisar capítulo");
  assert.equal(task.iconText, "☆");
  assert.deepEqual(task.repeatDays, [1, 3]);
  assert.equal(task.status, "pending");
});

test("encontra o próximo horário livre depois de uma tarefa de uma hora", () => {
  const tasks = [
    createTask({
      title: "Reunião",
      dueAt: "2026-11-18T09:30:00.000Z",
      endAt: "2026-11-18T10:30:00.000Z",
      priority: "urgent"
    })
  ];

  const nextSlot = findNextAvailableSlot(tasks, "2026-11-18T09:00:00.000Z", 30);

  assert.equal(nextSlot, "2026-11-18T10:30:00.000Z");
});

test("cria uma tarefa sem data com a duração informada", () => {
  const task = createTask({
    title: "Ler",
    dueAt: null,
    durationMinutes: 45,
    priority: "important"
  });

  assert.equal(task.dueAt, null);
  assert.equal(task.endAt, null);
  assert.equal(task.durationMinutes, 45);
});

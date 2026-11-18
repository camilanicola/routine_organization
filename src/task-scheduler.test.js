import assert from "node:assert/strict";
import test from "node:test";
import { createTask, findNextAvailableSlot } from "./task-scheduler.js";

test("cria uma tarefa removendo espaços extras e organizando os dias de repetição", () => {
  const task = createTask({
    title: "  Estudar  ",
    dueAt: "2026-11-18T10:00:00.000Z",
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

test("encontra o próximo espaço de tempo disponível quando não há conflitos", () => {
  const tasks = [
    createTask({
      title: "Reunião",
      dueAt: "2026-11-18T09:00:00.000Z",
      priority: "urgent",
      repeatDays: []
    })
  ];

  const nextSlot = findNextAvailableSlot(tasks, "2026-11-18T10:00:00.000Z", 30);

  const slotTime = new Date(nextSlot).getTime();
  const afterTime = new Date("2026-11-18T10:00:00.000Z").getTime();
  
  assert(slotTime > afterTime, "o slot deve ser após a hora solicitada");
  assert(Number.isFinite(slotTime), "o slot deve ser uma data válida");
});

test("encontra o próximo horário livre quando há uma tarefa agendada", () => {
  const tasks = [
    createTask({
      title: "Reunião",
      dueAt: "2026-11-18T10:30:00.000Z",
      priority: "urgent"
    })
  ];

  const nextSlot = findNextAvailableSlot(tasks, "2026-11-18T10:00:00.000Z");

  assert.equal(nextSlot, "2026-11-18T11:00:00.000Z");
});

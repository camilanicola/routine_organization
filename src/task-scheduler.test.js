import assert from "node:assert/strict";
import test from "node:test";
import { createTask, findNextAvailableSlot, rescheduleOverdueTasks } from "./task-scheduler.js";

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

test("não cria uma tarefa com título vazio", () => {
  assert.throws(() => createTask({
    title: "   ",
    dueAt: null,
    durationMinutes: 45,
    priority: "important"
  }), { message: "Enter a task title." });
});

test("reagenda uma tarefa atrasada mantendo sua duração", () => {
  const task = createTask({
    title: "Estudar",
    dueAt: "2026-11-18T09:00:00.000Z",
    endAt: "2026-11-18T10:45:00.000Z",
    priority: "important"
  });

  const [rescheduledTask] = rescheduleOverdueTasks([task], "2026-11-18T11:00:00.000Z");

  assert.equal(rescheduledTask.dueAt, "2026-11-18T11:30:00.000Z");
  assert.equal(rescheduledTask.endAt, "2026-11-18T13:15:00.000Z");
  assert.equal(rescheduledTask.durationMinutes, 105);
});

test("não cria uma tarefa quando o horário de término não é posterior ao início", () => {
  assert.throws(() => createTask({
    title: "Estudar",
    dueAt: "2026-11-18T11:00:00.000Z",
    endAt: "2026-11-18T10:00:00.000Z",
    priority: "important"
  }), { name: "TypeError", message: "The end date and time must be after the start." });
});

test("reagenda tarefas atrasadas priorizando a maior prioridade primeiro", () => {
  const baixa = createTask({
    title: "Organizar mesa",
    dueAt: "2026-11-18T08:00:00.000Z",
    endAt: "2026-11-18T08:30:00.000Z",
    priority: "neither"
  });
  const alta = createTask({
    title: "Entregar trabalho",
    dueAt: "2026-11-18T09:00:00.000Z",
    endAt: "2026-11-18T09:30:00.000Z",
    priority: "important-urgent"
  });

  const [baixaReagendada, altaReagendada] = rescheduleOverdueTasks(
    [baixa, alta],
    "2026-11-18T11:00:00.000Z"
  );

  assert.equal(altaReagendada.dueAt, "2026-11-18T11:30:00.000Z");
  assert.equal(baixaReagendada.dueAt, "2026-11-18T12:00:00.000Z");
});

test("encontra um horário depois de vários intervalos ocupados consecutivos", () => {
  const tasks = [
    createTask({ title: "Reunião", dueAt: "2026-11-18T09:30:00.000Z", endAt: "2026-11-18T10:30:00.000Z", priority: "important" }),
    createTask({ title: "Estudar", dueAt: "2026-11-18T10:30:00.000Z", endAt: "2026-11-18T11:00:00.000Z", priority: "important" })
  ];

  assert.equal(findNextAvailableSlot(tasks, "2026-11-18T09:00:00.000Z", 45), "2026-11-18T11:00:00.000Z");
});

test("não considera tarefas concluídas ou sem data como horários ocupados", () => {
  const tasks = [
    { ...createTask({ title: "Concluída", dueAt: "2026-11-18T09:30:00.000Z", endAt: "2026-11-18T10:30:00.000Z", priority: "important" }), status: "done" },
    createTask({ title: "Sem data", dueAt: null, durationMinutes: 60, priority: "urgent" })
  ];

  assert.equal(findNextAvailableSlot(tasks, "2026-11-18T09:00:00.000Z", 30), "2026-11-18T09:30:00.000Z");
});

test("informa quando não há horário livre nos próximos sete dias", () => {
  const tasks = [createTask({
    title: "Intervalo ocupado",
    dueAt: "2026-11-18T09:00:00.000Z",
    endAt: "2026-11-26T09:00:00.000Z",
    priority: "important"
  })];

  assert.throws(() => findNextAvailableSlot(tasks, "2026-11-18T09:00:00.000Z", 30), {
    name: "RangeError",
    message: "No free time slot found in the next seven days."
  });
});

test("preserva os dados originais e não reagenda tarefas repetitivas ou concluídas", () => {
  const original = createTask({ title: "Estudar", dueAt: "2026-11-18T08:00:00.000Z", endAt: "2026-11-18T09:00:00.000Z", priority: "important" });
  const tasks = [
    original,
    { ...original, id: "repetitiva", repeatDays: [3, 5], completedDates: ["2026-11-18"] },
    { ...original, id: "concluida", status: "done" }
  ];
  const before = structuredClone(tasks);

  const result = rescheduleOverdueTasks(tasks, "2026-11-18T11:00:00.000Z");

  assert.deepEqual(tasks, before);
  assert.notEqual(result[0].dueAt, original.dueAt);
  assert.deepEqual(result.slice(1), tasks.slice(1));
});

test("não permite repetição em uma tarefa sem data", () => {
  assert.throws(() => createTask({ title: "Treinar", dueAt: null, durationMinutes: 30, priority: "important", repeatDays: [1] }), {
    message: "Repeating tasks need a date and time."
  });
});

test("evita conflito com a próxima ocorrência de uma tarefa semanal", {
  todo: "O reagendamento ainda compara apenas o intervalo original; corrigir a expansão das ocorrências semanais."
}, () => {
  const weekly = createTask({
    title: "Reunião semanal",
    dueAt: "2026-11-16T10:00:00",
    endAt: "2026-11-16T11:00:00",
    priority: "important",
    repeatDays: [1]
  });

  const nextSlot = findNextAvailableSlot([weekly], new Date("2026-11-23T09:30:00"), 30);

  assert.equal(nextSlot, new Date("2026-11-23T11:00:00").toISOString());
});

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

test("evita conflito com a próxima ocorrência de uma tarefa semanal", () => {
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

test("considera todos os dias de repetição e permite intervalos adjacentes", () => {
  const weekly = createTask({
    title: "Reunião semanal",
    dueAt: "2026-11-16T10:00:00",
    endAt: "2026-11-16T11:00:00",
    priority: "important",
    repeatDays: [1, 3]
  });

  assert.equal(findNextAvailableSlot([weekly], "2026-11-25T09:00:00", 60), new Date("2026-11-25T11:00:00").toISOString());
  assert.equal(findNextAvailableSlot([weekly], "2026-11-25T09:00:00", 30), new Date("2026-11-25T09:30:00").toISOString());
  assert.equal(findNextAvailableSlot([weekly], "2026-11-25T10:30:00", 30), new Date("2026-11-25T11:00:00").toISOString());
});

test("libera apenas a ocorrência concluída e mantém as próximas ocupadas", () => {
  const weekly = {
    ...createTask({
      title: "Reunião semanal",
      dueAt: "2026-11-16T10:00:00",
      endAt: "2026-11-16T11:00:00",
      priority: "important",
      repeatDays: [1]
    }),
    status: "done",
    completedDates: ["2026-11-23"]
  };

  // Como no calendário, a conclusão da série depende de cada data, não de status.
  assert.equal(findNextAvailableSlot([weekly], "2026-11-23T09:30:00", 30), new Date("2026-11-23T10:00:00").toISOString());
  assert.equal(findNextAvailableSlot([weekly], "2026-11-30T09:30:00", 30), new Date("2026-11-30T11:00:00").toISOString());
});

test("não reserva dias anteriores ao início nem dias fora da repetição", () => {
  const weekly = createTask({
    title: "Reunião de quarta",
    dueAt: "2026-11-23T10:00:00",
    endAt: "2026-11-23T11:00:00",
    priority: "important",
    repeatDays: [3]
  });

  assert.equal(findNextAvailableSlot([weekly], "2026-11-18T09:30:00", 30), new Date("2026-11-18T10:00:00").toISOString());
  assert.equal(findNextAvailableSlot([weekly], "2026-11-23T09:30:00", 30), new Date("2026-11-23T10:00:00").toISOString());
  assert.equal(findNextAvailableSlot([weekly], "2026-11-25T09:30:00", 30), new Date("2026-11-25T11:00:00").toISOString());
});

test("considera a ocorrência que começou no dia anterior e sua data de conclusão", () => {
  const weekly = createTask({
    title: "Turno noturno",
    dueAt: "2026-11-16T23:30:00",
    endAt: "2026-11-17T01:00:00",
    priority: "important",
    repeatDays: [1]
  });

  assert.equal(findNextAvailableSlot([weekly], "2026-11-24T00:00:00", 30), new Date("2026-11-24T01:00:00").toISOString());
  assert.equal(findNextAvailableSlot([{ ...weekly, completedDates: ["2026-11-23"] }], "2026-11-24T00:00:00", 30), new Date("2026-11-24T00:30:00").toISOString());
});

test("considera ocorrências semanais com duração maior que um dia", () => {
  const weekly = createTask({
    title: "Evento de três dias",
    dueAt: "2026-11-16T10:00:00",
    endAt: "2026-11-18T11:00:00",
    priority: "important",
    repeatDays: [1]
  });

  assert.equal(findNextAvailableSlot([weekly], "2026-11-25T09:30:00", 30), new Date("2026-11-25T11:00:00").toISOString());
});

test("verifica conflitos até o término da tarefa mesmo além dos sete dias de busca", () => {
  const busy = createTask({
    title: "Semana ocupada",
    dueAt: "2026-11-16T10:00:00",
    endAt: "2026-11-23T09:30:00",
    priority: "important"
  });
  const weekly = createTask({
    title: "Reunião de terça",
    dueAt: "2026-11-10T10:00:00",
    endAt: "2026-11-10T11:00:00",
    priority: "important",
    repeatDays: [2]
  });

  assert.throws(() => findNextAvailableSlot([busy, weekly], "2026-11-16T09:30:00", 26 * 60), {
    name: "RangeError",
    message: "No free time slot found in the next seven days."
  });
});

test("informa quando as repetições ocupam todos os horários da semana", () => {
  const daily = createTask({
    title: "Todos os dias ocupados",
    dueAt: "2026-11-16T00:00:00",
    endAt: "2026-11-17T00:00:00",
    priority: "important",
    repeatDays: [0, 1, 2, 3, 4, 5, 6]
  });

  assert.throws(() => findNextAvailableSlot([daily], "2026-11-23T09:30:00", 30), {
    name: "RangeError",
    message: "No free time slot found in the next seven days."
  });
});

test("reagenda uma tarefa atrasada após a ocorrência semanal preservando a duração e a série", () => {
  const overdue = createTask({
    title: "Estudar",
    dueAt: "2026-11-16T08:00:00",
    endAt: "2026-11-16T09:00:00",
    priority: "urgent"
  });
  const weekly = createTask({
    title: "Reunião semanal",
    dueAt: "2026-11-16T10:00:00",
    endAt: "2026-11-16T11:00:00",
    priority: "important",
    repeatDays: [1]
  });
  const tasks = [overdue, weekly];
  const before = structuredClone(tasks);

  const result = rescheduleOverdueTasks(tasks, "2026-11-23T09:30:00");

  assert.deepEqual(result, [{
    ...overdue,
    dueAt: new Date("2026-11-23T11:00:00").toISOString(),
    endAt: new Date("2026-11-23T12:00:00").toISOString()
  }, weekly]);
  assert.deepEqual(tasks, before);
});

// Execute também com TZ=America/New_York para atravessar as mudanças de horário.
for (const [startDate, nextDate] of [["2026-03-02", "2026-03-09"], ["2026-10-26", "2026-11-02"]]) {
  test(`mantém o horário local da repetição entre ${startDate} e ${nextDate}`, () => {
    const weekly = createTask({
      title: "Reunião semanal",
      dueAt: `${startDate}T10:00:00`,
      endAt: `${startDate}T11:00:00`,
      priority: "important",
      repeatDays: [1]
    });

    assert.equal(findNextAvailableSlot([weekly], `${nextDate}T09:30:00`, 30), new Date(`${nextDate}T11:00:00`).toISOString());
  });
}

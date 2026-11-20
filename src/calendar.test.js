import assert from "node:assert/strict";
import test from "node:test";
import { getTasksOnDate, shiftDate, getCalendarDays, getAgendaTasks } from "./calendar.js";

test("avança para o próximo mês depois do último dia", () => {
  const dia = new Date("2026-01-31T00:00:00");
  const proximoDia = shiftDate(dia, 1);

  assert.deepEqual(proximoDia, new Date("2026-02-01T00:00:00"));
});

test("mostra apenas as tarefas da data selecionada", () => {
  const tarefas = [
    { title: "Estudar", dueAt: new Date("2026-11-18T12:00:00").toISOString() },
    { title: "Ler", dueAt: new Date("2026-11-19T12:00:00").toISOString() }
  ];

  const resultado = getTasksOnDate(tarefas, new Date("2026-11-18T12:00:00"));

  assert.deepEqual(resultado, [tarefas[0]]);
});

test("gera uma grade de 42 dias começando na segunda-feira", () => {
  const dias = getCalendarDays(2026, 10);

  assert.equal(dias.length, 42);
  assert.equal(dias[0].getDay(), 1);
  assert.deepEqual(dias[0], new Date(2026, 9, 26));
  assert.deepEqual(dias[41], new Date(2026, 11, 6));
});

test("marca tarefa repetitiva como concluída apenas nas datas em completedDates", () => {
  const tarefa = {
    title: "Treinar",
    dueAt: new Date("2026-11-16T09:00:00").toISOString(),
    repeatDays: [1, 3],
    completedDates: ["2026-11-18"]
  };

  const segunda = getTasksOnDate([tarefa], new Date("2026-11-16T09:00:00"));
  const terca = getTasksOnDate([tarefa], new Date("2026-11-17T09:00:00"));
  const quarta = getTasksOnDate([tarefa], new Date("2026-11-18T09:00:00"));

  assert.equal(segunda[0].status, "pending");
  assert.deepEqual(terca, []);
  assert.equal(quarta[0].status, "done");
});

test("ordena tarefas do dia por horário e inclui tarefas sem data apenas hoje", () => {
  const hoje = new Date("2026-11-18T12:00:00");
  const amanha = new Date("2026-11-19T12:00:00");
  const tarefas = [
    { title: "Tarde", dueAt: new Date("2026-11-18T15:00:00").toISOString() },
    { title: "Sem data", dueAt: null },
    { title: "Manhã", dueAt: new Date("2026-11-18T08:30:00").toISOString() }
  ];

  const agendaHoje = getAgendaTasks(tarefas, hoje, hoje);
  const agendaAmanha = getAgendaTasks(tarefas, amanha, hoje);

  assert.deepEqual(agendaHoje.map((t) => t.title), ["Sem data", "Manhã", "Tarde"]);
  assert.deepEqual(agendaAmanha, []);
});
import assert from "node:assert/strict";
import test from "node:test";
import { getTasksOnDate, shiftDate, getCalendarDays } from "./calendar.js";

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

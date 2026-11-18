import assert from "node:assert/strict";
import test from "node:test";
import { getTasksOnDate, shiftDate } from "./calendar.js";

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

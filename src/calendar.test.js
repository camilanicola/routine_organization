import assert from "node:assert/strict";
import test from "node:test";
import { shiftDate } from "./calendar.js";

test("avança para o próximo mês depois do último dia", () => {
  const dia = new Date("2026-01-31T00:00:00");
  const proximoDia = shiftDate(dia, 1);

  assert.deepEqual(proximoDia, new Date("2026-02-01T00:00:00"));
});

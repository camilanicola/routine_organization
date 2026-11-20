import assert from "node:assert/strict";
import test from "node:test";
import { loadTasks, TASK_STORAGE_KEY } from "./task-storage.js";

test("carrega apenas tarefas válidas salvas no armazenamento local", () => {
  const dados = [
    { id: "1", title: "Estudar", dueAt: "2026-11-18T10:00:00.000Z", priority: "important" },
    { id: "2", title: "Sem data", dueAt: null, priority: "urgent" },
    { id: "3", title: "Prioridade inválida", dueAt: null, priority: "alta" },
    { id: 4, title: "ID inválido", dueAt: null, priority: "neither" }
  ];
  const storage = {
    getItem: (key) => (key === TASK_STORAGE_KEY ? JSON.stringify(dados) : null)
  };

  const resultado = loadTasks(storage);

  assert.equal(resultado.error, null);
  assert.deepEqual(resultado.tasks.map((t) => t.id), ["1", "2"]);
});
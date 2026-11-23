import assert from "node:assert/strict";
import test from "node:test";
import { clearLocalTasks, loadTasks, TASK_STORAGE_KEY } from "./task-storage.js";

test("carrega apenas tarefas válidas salvas no armazenamento local", () => {
  const dados = [
    null,
    { id: "1", title: "Estudar", dueAt: "2026-11-18T10:00:00.000Z", priority: "important" },
    { id: "2", title: "Sem data", dueAt: null, priority: "urgent" },
    { id: "3", title: "Prioridade inválida", dueAt: null, priority: "alta" },
    { id: 4, title: "ID inválido", dueAt: null, priority: "neither" },
    { id: "5", title: 123, dueAt: null, priority: "important" },
    { id: "6", title: "Data inválida", dueAt: "data-inválida", priority: "important" },
    { id: "7", title: "Prioridade herdada", dueAt: null, priority: "toString" }
  ];
  const storage = {
    getItem: (key) => (key === TASK_STORAGE_KEY ? JSON.stringify(dados) : null)
  };

  const resultado = loadTasks(storage);

  assert.equal(resultado.error, null);
  assert.deepEqual(resultado.tasks, [dados[1], dados[2]]);
});

test("retorna lista vazia sem erro quando não há tarefas no armazenamento local", () => {
  const storage = { getItem: () => null };

  assert.deepEqual(loadTasks(storage), { tasks: [], error: null });
});

test("retorna lista vazia e erro de sintaxe quando o JSON salvo está corrompido", () => {
  const storage = { getItem: () => '{"id":' };

  const resultado = loadTasks(storage);

  assert.deepEqual(resultado.tasks, []);
  assert.ok(resultado.error instanceof SyntaxError);
});

test("retorna lista vazia e preserva o erro quando a leitura do armazenamento falha", () => {
  const falha = new DOMException("Acesso ao armazenamento bloqueado.", "SecurityError");
  const storage = { getItem: () => { throw falha; } };

  const resultado = loadTasks(storage);

  assert.deepEqual(resultado.tasks, []);
  assert.equal(resultado.error, falha);
});

test("retorna lista vazia e erro quando os dados salvos não são uma lista", () => {
  const storage = {
    getItem: () => JSON.stringify({ invalido: true })
  };

  const resultado = loadTasks(storage);

  assert.deepEqual(resultado.tasks, []);
  assert.equal(resultado.error?.message, "Saved data is not a task list.");
});

test("limpa apenas a chave de tarefas e permite repetir a limpeza sem dados", () => {
  const dados = new Map([
    [TASK_STORAGE_KEY, JSON.stringify([{ id: "1", title: "Estudar", dueAt: null, priority: "important" }])],
    ["outra-chave", "preservar"]
  ]);
  const storage = { removeItem: (key) => dados.delete(key) };

  clearLocalTasks(storage);

  assert.deepEqual(dados, new Map([["outra-chave", "preservar"]]));
  assert.doesNotThrow(() => clearLocalTasks(storage));
  assert.deepEqual(dados, new Map([["outra-chave", "preservar"]]));
});

test("propaga o erro quando a remoção das tarefas do armazenamento falha", () => {
  const falha = new DOMException("Remoção do armazenamento bloqueada.", "SecurityError");
  const storage = { removeItem: () => { throw falha; } };

  assert.throws(() => clearLocalTasks(storage), (erro) => erro === falha);
});

test("usa o localStorage padrão para carregar e limpar as tarefas", (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  const tarefa = { id: "1", title: "Estudar", dueAt: null, priority: "important" };
  const dados = new Map([[TASK_STORAGE_KEY, JSON.stringify([tarefa])]]);
  const storage = {
    getItem: (key) => dados.get(key) ?? null,
    removeItem: (key) => dados.delete(key)
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });

  assert.deepEqual(loadTasks(), { tasks: [tarefa], error: null });

  clearLocalTasks();

  assert.equal(dados.has(TASK_STORAGE_KEY), false);
  assert.deepEqual(loadTasks(), { tasks: [], error: null });
});

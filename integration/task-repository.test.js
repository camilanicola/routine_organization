import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, collection, doc, getDocFromServer, getDocsFromServer, terminate } from "firebase/firestore";
import { createFirestoreRepository } from "../src/task-repository.js";
import { createTask } from "../src/task-scheduler.js";

function getEmulatorAddress(name) {
  const address = process.env[name] ?? "";
  assert.match(address, /^127\.0\.0\.1:\d+$/, "Execute este teste com npm run test:integration para usar os emuladores locais.");
  const [host, port] = address.split(":");
  return { host, port: Number(port) };
}

async function createAuthenticatedRepository(t) {
  const authAddress = getEmulatorAddress("FIREBASE_AUTH_EMULATOR_HOST");
  const firestoreAddress = getEmulatorAddress("FIRESTORE_EMULATOR_HOST");
  const app = initializeApp({
    projectId: "demo-magical-girl-planner",
    apiKey: "demo-api-key"
  }, `integration-${randomUUID()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${authAddress.host}:${authAddress.port}`, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, firestoreAddress.host, firestoreAddress.port);
  t.after(async () => {
    try {
      await terminate(db);
    } finally {
      await deleteApp(app);
    }
  });

  const { user } = await createUserWithEmailAndPassword(auth, `${randomUUID()}@example.com`, "senha123");
  const repository = createFirestoreRepository(db, user.uid);
  return { db, user, repository };
}

test("salva e carrega a tarefa do usuário autenticado no Firestore", { timeout: 30_000 }, async (t) => {
  const { db, user, repository } = await createAuthenticatedRepository(t);
  const tarefa = createTask({
    title: "Estudar integração",
    dueAt: null,
    durationMinutes: 30,
    priority: "important",
    notes: "Revisar o conteúdo salvo no Firebase",
    iconText: "☆"
  });

  await repository.save(tarefa);

  // Confere o documento no servidor, sem aceitar apenas uma leitura do cache.
  const documento = await getDocFromServer(doc(db, "users", user.uid, "tasks", tarefa.id));
  assert.equal(documento.exists(), true);
  assert.deepEqual(documento.data(), tarefa);
  assert.deepEqual(await repository.load(), [tarefa]);
});

test("atualiza uma tarefa existente no Firestore sem duplicar o documento", { timeout: 30_000 }, async (t) => {
  const { db, user, repository } = await createAuthenticatedRepository(t);
  const tarefa = createTask({
    title: "Revisar conteúdo",
    dueAt: null,
    durationMinutes: 30,
    priority: "important",
    notes: "Revisar o primeiro capítulo",
    iconText: "☆"
  });
  await repository.save(tarefa);

  const tarefaEditada = {
    ...tarefa,
    title: "Revisar conteúdo para a prova",
    durationMinutes: 45,
    priority: "important-urgent",
    notes: "Revisar os dois primeiros capítulos"
  };
  await repository.save(tarefaEditada);

  const documento = await getDocFromServer(doc(db, "users", user.uid, "tasks", tarefa.id));
  assert.equal(documento.exists(), true);
  assert.deepEqual(documento.data(), tarefaEditada);
  assert.deepEqual(await repository.load(), [tarefaEditada]);
});

test("rejeita uma edição grande demais sem alterar a tarefa salva no Firestore", { timeout: 30_000 }, async (t) => {
  const { db, user, repository } = await createAuthenticatedRepository(t);
  const tarefa = createTask({
    title: "Preservar tarefa",
    dueAt: null,
    durationMinutes: 30,
    priority: "important"
  });
  await repository.save(tarefa);

  await assert.rejects(repository.save({
    ...tarefa,
    title: "Alteração rejeitada",
    iconData: `data:image/png;base64,${"A".repeat(1_048_576)}`
  }), {
    name: "RangeError",
    message: "This task is too large to save. Choose a smaller PNG or remove the current icon."
  });

  const documento = await getDocFromServer(doc(db, "users", user.uid, "tasks", tarefa.id));
  assert.equal(documento.exists(), true);
  assert.deepEqual(documento.data(), tarefa);
  assert.deepEqual(await repository.load(), [tarefa]);
});

test("salva e carrega várias tarefas com saveMany no Firestore", { timeout: 30_000 }, async (t) => {
  const { db, user, repository } = await createAuthenticatedRepository(t);
  const tarefas = [
    createTask({
      title: "Ler um capítulo",
      dueAt: null,
      durationMinutes: 30,
      priority: "important",
      notes: "Anotar dúvidas",
      iconText: "📚"
    }),
    createTask({
      title: "Revisão semanal",
      dueAt: "2026-11-18T10:00:00.000Z",
      endAt: "2026-11-18T11:00:00.000Z",
      priority: "urgent",
      repeatDays: [3, 5]
    })
  ];

  await repository.saveMany(tarefas);

  const documentos = await Promise.all(tarefas.map((tarefa) =>
    getDocFromServer(doc(db, "users", user.uid, "tasks", tarefa.id))
  ));
  documentos.forEach((documento, index) => {
    assert.equal(documento.exists(), true);
    assert.deepEqual(documento.data(), tarefas[index]);
  });

  const carregadas = await repository.load();
  assert.equal(carregadas.length, tarefas.length);
  // A leitura não promete a mesma ordem em que as tarefas foram enviadas.
  assert.deepEqual(
    new Map(carregadas.map((tarefa) => [tarefa.id, tarefa])),
    new Map(tarefas.map((tarefa) => [tarefa.id, tarefa]))
  );
});

test("exclui apenas as tarefas selecionadas com deleteMany no Firestore", { timeout: 30_000 }, async (t) => {
  const { db, user, repository } = await createAuthenticatedRepository(t);
  const tarefas = ["Remover primeira tarefa", "Preservar tarefa", "Remover última tarefa"].map((title) =>
    createTask({ title, dueAt: null, durationMinutes: 30, priority: "important" })
  );
  const [primeira, preservada, ultima] = tarefas;
  await repository.saveMany(tarefas);
  assert.equal((await repository.load()).length, tarefas.length);

  await repository.deleteMany([primeira, ultima]);

  const documentos = await Promise.all(tarefas.map((tarefa) =>
    getDocFromServer(doc(db, "users", user.uid, "tasks", tarefa.id))
  ));
  assert.equal(documentos[0].exists(), false);
  assert.equal(documentos[2].exists(), false);
  assert.equal(documentos[1].exists(), true);
  assert.deepEqual(documentos[1].data(), preservada);
  assert.deepEqual(await repository.load(), [preservada]);
});

test("exclui mais de 500 tarefas com deleteMany preservando a tarefa não selecionada", { timeout: 30_000 }, async (t) => {
  const { db, user, repository } = await createAuthenticatedRepository(t);
  const selecionadas = Array.from({ length: 501 }, (_, index) => createTask({
    title: `Remover tarefa ${index + 1}`,
    dueAt: null,
    durationMinutes: 30,
    priority: "neither"
  }));
  const preservada = createTask({
    title: "Preservar fora dos lotes",
    dueAt: null,
    durationMinutes: 45,
    priority: "important",
    notes: "Esta tarefa deve permanecer intacta."
  });

  // Prepara os documentos em dois lotes; a exclusão recebe a lista inteira.
  await repository.saveMany(selecionadas.slice(0, 500));
  await repository.saveMany([selecionadas[500], preservada]);
  const tasksCollection = collection(db, "users", user.uid, "tasks");
  assert.equal((await getDocsFromServer(tasksCollection)).size, 502);

  await repository.deleteMany(selecionadas);

  const restantes = await getDocsFromServer(tasksCollection);
  assert.equal(restantes.size, 1);
  assert.equal(restantes.docs[0].id, preservada.id);
  assert.deepEqual(restantes.docs[0].data(), preservada);
  assert.deepEqual(await repository.load(), [preservada]);
});

test("rejeita o lote inteiro de saveMany quando uma tarefa ultrapassa o limite de tamanho", { timeout: 30_000 }, async (t) => {
  const { db, user, repository } = await createAuthenticatedRepository(t);
  const original = createTask({
    title: "Preservar tarefa original",
    dueAt: null,
    durationMinutes: 30,
    priority: "important"
  });
  await repository.save(original);

  const editada = { ...original, title: "Edição que deve ser rejeitada", durationMinutes: 45 };
  const nova = createTask({ title: "Nova tarefa válida", dueAt: null, durationMinutes: 60, priority: "urgent" });
  const grandeDemais = createTask({
    title: "Tarefa grande demais",
    dueAt: null,
    durationMinutes: 30,
    priority: "neither",
    notes: "a".repeat(1_048_576)
  });

  // A tarefa inválida fica por último para detectar gravações parciais anteriores.
  await assert.rejects(repository.saveMany([editada, nova, grandeDemais]), {
    name: "RangeError",
    message: "This task is too large to save. Reduce its content."
  });

  const documentos = await getDocsFromServer(collection(db, "users", user.uid, "tasks"));
  assert.equal(documentos.size, 1);
  assert.equal(documentos.docs[0].id, original.id);
  assert.deepEqual(documentos.docs[0].data(), original);
  assert.deepEqual(await repository.load(), [original]);
});

test("isola as tarefas de cada usuário e bloqueia o acesso à coleção de outro usuário", { timeout: 30_000 }, async (t) => {
  const usuariaA = await createAuthenticatedRepository(t);
  const usuariaB = await createAuthenticatedRepository(t);
  assert.notEqual(usuariaA.user.uid, usuariaB.user.uid);

  const tarefaA = createTask({
    title: "Tarefa da usuária A",
    dueAt: null,
    durationMinutes: 30,
    priority: "important",
    notes: "Anotações da usuária A"
  });
  // O mesmo ID deve identificar documentos independentes nas duas coleções.
  const tarefaB = { ...tarefaA, title: "Tarefa da usuária B", notes: "Anotações da usuária B" };
  await usuariaA.repository.save(tarefaA);
  await usuariaB.repository.save(tarefaB);

  assert.deepEqual(await usuariaA.repository.load(), [tarefaA]);
  assert.deepEqual(await usuariaB.repository.load(), [tarefaB]);

  // Usa a sessão de A com o caminho de B para exercitar as regras do emulador.
  const acessoIndevido = createFirestoreRepository(usuariaA.db, usuariaB.user.uid);
  const erroDePermissao = { code: "permission-denied" };
  await assert.rejects(acessoIndevido.load(), erroDePermissao);
  await assert.rejects(
    getDocFromServer(doc(usuariaA.db, "users", usuariaB.user.uid, "tasks", tarefaB.id)),
    erroDePermissao
  );
  const alterada = { ...tarefaB, title: "Alteração não autorizada" };
  await assert.rejects(acessoIndevido.save(alterada), erroDePermissao);
  const nova = createTask({ title: "Inclusão não autorizada", dueAt: null, durationMinutes: 45, priority: "urgent" });
  await assert.rejects(acessoIndevido.saveMany([alterada, nova]), erroDePermissao);
  await assert.rejects(acessoIndevido.deleteMany([tarefaB]), erroDePermissao);

  const [documentosA, documentosB] = await Promise.all([
    getDocsFromServer(collection(usuariaA.db, "users", usuariaA.user.uid, "tasks")),
    getDocsFromServer(collection(usuariaB.db, "users", usuariaB.user.uid, "tasks"))
  ]);
  assert.deepEqual(documentosA.docs.map((documento) => documento.data()), [tarefaA]);
  assert.deepEqual(documentosB.docs.map((documento) => documento.data()), [tarefaB]);
});

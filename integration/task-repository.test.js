import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, getDocFromServer, terminate } from "firebase/firestore";
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

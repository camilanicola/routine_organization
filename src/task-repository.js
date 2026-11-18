import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";

export function createFirestoreRepository(db, userId) {
  const tasksCollection = collection(db, "users", userId, "tasks");

  return {
    async load() {
      const snapshot = await getDocs(tasksCollection);
      return snapshot.docs.map((item) => item.data());
    },

    async save(task) {
      await setDoc(doc(tasksCollection, task.id), task);
    },

    async saveMany(tasks) {
      const batch = writeBatch(db);
      tasks.forEach((task) => batch.set(doc(tasksCollection, task.id), task));
      await batch.commit();
    }
  };
}

export function createMemoryRepository(initialTasks = []) {
  const stored = new Map(initialTasks.map((task) => [task.id, structuredClone(task)]));

  return {
    async load() {
      return [...stored.values()].map((task) => structuredClone(task));
    },

    async save(task) {
      stored.set(task.id, structuredClone(task));
    },

    async saveMany(tasks) {
      tasks.forEach((task) => stored.set(task.id, structuredClone(task)));
    }
  };
}

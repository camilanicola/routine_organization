import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { validateTaskSize } from "./task-size.js";

export function hasExplicitTiming(task) {
  if (!Object.hasOwn(task, "endAt")) return false;
  if (task.dueAt === null) {
    return task.endAt === null && Number.isInteger(task.durationMinutes) && task.durationMinutes > 0;
  }
  return Boolean(task.endAt);
}

export async function removeTasksWithoutExplicitTiming(repository, tasks) {
  const removed = tasks.filter((task) => !hasExplicitTiming(task));
  if (removed.length > 0) await repository.deleteMany(removed);
  return { tasks: tasks.filter(hasExplicitTiming), removedCount: removed.length };
}

export function createFirestoreRepository(db, userId) {
  const tasksCollection = collection(db, "users", userId, "tasks");

  return {
    async load() {
      const snapshot = await getDocs(tasksCollection);
      return snapshot.docs.map((item) => item.data());
    },

    async save(task) {
      validateTaskSize(task);
      await setDoc(doc(tasksCollection, task.id), task);
    },

    async saveMany(tasks) {
      tasks.forEach(validateTaskSize);
      const batch = writeBatch(db);
      tasks.forEach((task) => batch.set(doc(tasksCollection, task.id), task));
      await batch.commit();
    },

    async deleteMany(tasks) {
      for (let index = 0; index < tasks.length; index += 500) {
        const batch = writeBatch(db);
        tasks.slice(index, index + 500).forEach((task) => batch.delete(doc(tasksCollection, task.id)));
        await batch.commit();
      }
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
      validateTaskSize(task);
      stored.set(task.id, structuredClone(task));
    },

    async saveMany(tasks) {
      tasks.forEach(validateTaskSize);
      tasks.forEach((task) => stored.set(task.id, structuredClone(task)));
    },

    async deleteMany(tasks) {
      tasks.forEach((task) => stored.delete(task.id));
    }
  };
}

import { PRIORITIES } from "./task-scheduler.js";

export const TASK_STORAGE_KEY = "maho-planner-tasks";

export function loadTasks(storage = globalThis.localStorage) {
  try {
    const stored = JSON.parse(storage.getItem(TASK_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) {
      throw new TypeError("Saved data is not a task list.");
    }

    return {
      tasks: stored.filter((task) => task && typeof task.id === "string"
        && typeof task.title === "string" && (task.dueAt === null || Number.isFinite(Date.parse(task.dueAt)))
        && Object.hasOwn(PRIORITIES, task.priority)),
      error: null
    };
  } catch (error) {
    return { tasks: [], error };
  }
}

export function clearLocalTasks(storage = globalThis.localStorage) {
  try {
    storage.removeItem(TASK_STORAGE_KEY);
  } catch {
    // Leftover local data is harmless because it is only imported into an empty account.
  }
}

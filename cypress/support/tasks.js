export function makeTask(changes = {}) {
  return {
    id: "task-1",
    title: "Estudar",
    dueAt: null,
    endAt: null,
    durationMinutes: 30,
    priority: "important",
    notes: "Revisar capítulo",
    iconText: "☆",
    iconData: "",
    repeatDays: [],
    completedDates: [],
    status: "pending",
    ...changes
  };
}

export function makeRepeatingTask(changes = {}) {
  return makeTask({
    dueAt: new Date(2026, 10, 18, 10).toISOString(),
    endAt: new Date(2026, 10, 18, 10, 30).toISOString(),
    repeatDays: [3, 5],
    ...changes
  });
}

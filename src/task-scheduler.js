export const PRIORITIES = Object.freeze({
  "important-urgent": 4,
  urgent: 3,
  important: 2,
  neither: 1
});

const SEARCH_INTERVAL_MINUTES = 30;
const SEARCH_DAYS = 7;

export function createTask({
  title,
  dueAt,
  endAt,
  durationMinutes,
  priority,
  notes = "",
  iconText = "(˶ᵔ ᵕ ᵔ˶)",
  iconData = "",
  repeatDays = []
}) {
  const cleanTitle = String(title ?? "").trim();
  const hasDate = dueAt !== null;

  if (!cleanTitle) {
    throw new TypeError("Enter a task title.");
  }
  if (hasDate && !Number.isFinite(Date.parse(dueAt))) {
    throw new TypeError("Enter a valid date and time.");
  }
  const taskDuration = hasDate
    ? (Date.parse(endAt) - Date.parse(dueAt)) / 60_000
    : durationMinutes;
  if (hasDate && (!Number.isFinite(taskDuration) || taskDuration <= 0)) {
    throw new TypeError("The end date and time must be after the start.");
  }
  if (!hasDate && (!Number.isInteger(taskDuration) || taskDuration <= 0)) {
    throw new TypeError("Enter a valid duration in minutes.");
  }
  if (!repeatDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) {
    throw new TypeError("Choose valid repeat days.");
  }
  if (repeatDays.length > 0 && !hasDate) {
    throw new TypeError("Repeating tasks need a date and time.");
  }
  if (!Object.hasOwn(PRIORITIES, priority)) {
    throw new TypeError("Choose a valid priority.");
  }

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: cleanTitle,
    dueAt: hasDate ? new Date(dueAt).toISOString() : null,
    endAt: hasDate ? new Date(endAt).toISOString() : null,
    repeatDays: [...new Set(repeatDays)].sort((a, b) => a - b),
    completedDates: [],
    priority,
    notes: String(notes).trim(),
    iconText: String(iconText).trim() || "(˶ᵔ ᵕ ᵔ˶)",
    iconData,
    durationMinutes: taskDuration,
    status: "pending"
  };
}

export function findNextAvailableSlot(tasks, after, durationMinutes) {
  const startAfter = new Date(after).getTime();
  if (!Number.isFinite(startAfter) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new TypeError("Enter a valid time and duration.");
  }

  const step = SEARCH_INTERVAL_MINUTES * 60_000;
  const duration = durationMinutes * 60_000;
  let candidate = Math.ceil((startAfter + 1) / step) * step;
  const deadline = startAfter + SEARCH_DAYS * 24 * 60 * 60_000;

  while (candidate <= deadline) {
    const candidateEnd = candidate + duration;
    const overlaps = tasks.some((task) => {
      if (task.status === "done") return false;
      const taskStart = Date.parse(task.dueAt);
      if (!Number.isFinite(taskStart)) return false;
      const taskEnd = Date.parse(task.endAt);
      if (!Number.isFinite(taskEnd) || taskEnd <= taskStart) {
        throw new TypeError("A task has an invalid end date and time.");
      }
      return candidate < taskEnd && candidateEnd > taskStart;
    });

    if (!overlaps) return new Date(candidate).toISOString();
    candidate += step;
  }

  throw new RangeError("No free time slot found in the next seven days.");
}

export function rescheduleOverdueTasks(tasks, now) {
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(nowMs)) {
    throw new TypeError("Enter a valid date and time.");
  }

  const overdue = tasks
    .filter((task) => task.status !== "done" && !task.repeatDays?.length
      && task.dueAt && Date.parse(task.endAt) <= nowMs)
    .sort((a, b) => PRIORITIES[b.priority] - PRIORITIES[a.priority] || Date.parse(a.dueAt) - Date.parse(b.dueAt));
  const rescheduled = tasks.map((task) => ({ ...task }));

  for (const task of overdue) {
    const nextSlot = findNextAvailableSlot(rescheduled, now, task.durationMinutes);
    const match = rescheduled.find((item) => item.id === task.id);
    match.dueAt = nextSlot;
    match.endAt = new Date(Date.parse(nextSlot) + task.durationMinutes * 60_000).toISOString();
  }

  return rescheduled;
}

export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

export function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const REPEAT_DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" }
];

export function shiftDate(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function getTasksOnDate(tasks, date) {
  const dateKey = getDateKey(date);

  return tasks.flatMap((task) => {
    if (!task.dueAt) return [];
    const dueDate = new Date(task.dueAt);
    if (!Number.isFinite(dueDate.getTime())) return [];

    if (task.repeatDays?.length) {
      if (dateKey < getDateKey(dueDate) || !task.repeatDays.includes(date.getDay())) return [];
      const isDone = task.completedDates?.includes(dateKey);
      return [{ ...task, status: isDone ? "done" : "pending" }];
    }

    return getDateKey(dueDate) === dateKey ? [task] : [];
  });
}

export function getAgendaTasks(tasks, date, today = new Date()) {
  const dated = getTasksOnDate(tasks, date).sort((a, b) => minutesOfDay(a.dueAt) - minutesOfDay(b.dueAt));
  const undated = getDateKey(date) === getDateKey(today) ? tasks.filter((task) => !task.dueAt) : [];
  return [...undated, ...dated];
}

function minutesOfDay(value) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

export function formatMonth(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(date);
}

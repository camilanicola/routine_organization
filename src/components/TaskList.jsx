import { REPEAT_DAYS } from "../calendar.js";

const priorityNames = {
  "important-urgent": "Urgent & important",
  urgent: "Urgent",
  important: "Important",
  neither: "Neither urgent nor important"
};

const dayLabels = Object.fromEntries(REPEAT_DAYS.map(({ value, label }) => [value, label]));

function formatTime(value) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatWhen(task) {
  if (!task.dueAt) return `No date · ${task.durationMinutes} min · until done`;
  const start = new Date(task.dueAt);
  const end = new Date(task.endAt);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(end);
  if (task.repeatDays?.length) {
    const days = REPEAT_DAYS.filter(({ value }) => task.repeatDays.includes(value)).map(({ value }) => dayLabels[value]);
    const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const daysLater = (endDay - startDay) / 86_400_000;
    const daySuffix = daysLater ? ` (+${daysLater} ${daysLater === 1 ? "day" : "days"})` : "";
    return `${days.join(", ")} · ${formatTime(task.dueAt)} – ${formatTime(end)}${daySuffix} · ${task.durationMinutes} min`;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(start) + ` – ${endLabel} · ${task.durationMinutes} min`;
}

export function TaskList({ tasks, dateKey, onToggle, onEdit }) {
  if (tasks.length === 0) {
    return <pre className="empty-state" role="img" aria-label="No tasks yet"> ≽^-⩊-^≼ Zzzz</pre>;
  }

  return (
    <div className="task-list" aria-live="polite">
      {tasks.map((task) => (
        <article className={`task-card priority-${task.priority}${task.status === "done" ? " is-done" : ""}`} key={task.id}>
          {task.iconData
            ? <img className="task-icon" src={task.iconData} alt="" aria-hidden="true" />
            : <span className="task-icon" aria-hidden="true">{task.iconText || "(˶ᵔ ᵕ ᵔ˶)"}</span>}
          <div className="task-content">
            <h3>{task.title}</h3>
            <p className="task-when">{formatWhen(task)}</p>
            <span className="priority-badge">{priorityNames[task.priority]}</span>
            {task.notes && <p className="task-notes">{task.notes}</p>}
          </div>
          <div className="task-actions">
            <button
              className="complete-button"
              type="button"
              onClick={() => onEdit(task.id)}
              aria-label={`Edit ${task.title}`}
            >
              Edit
            </button>
            <button
              className="complete-button"
              type="button"
              onClick={() => onToggle(task.id, dateKey)}
              aria-label={`${task.status === "done" ? "Undo" : "Complete"} ${task.title}`}
            >
              {task.status === "done" ? "Undo" : "Done"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

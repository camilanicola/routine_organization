import { useState } from "react";
import { formatMonth, getCalendarDays, getDateKey, getTasksOnDate } from "../calendar.js";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric"
});

export function CalendarView({ tasks, onEdit }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const days = getCalendarDays(month.getFullYear(), month.getMonth());
  const selectedTasks = getTasksOnDate(tasks, selectedDate);

  function changeMonth(amount) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <section className="calendar-panel panel" aria-labelledby="calendar-title">
      <div className="calendar-heading">
        <div>
          <h2 id="calendar-title">{formatMonth(month)}</h2>
        </div>
        <div className="calendar-controls">
          <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
          <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label={formatMonth(month)}>
        {weekDays.map((day) => <span className="calendar-weekday" role="columnheader" key={day}>{day}</span>)}
        {days.map((day) => {
          const dateTasks = getTasksOnDate(tasks, day);
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isSelected = getDateKey(day) === getDateKey(selectedDate);

          return (
            <button
              className={`calendar-day${isCurrentMonth ? "" : " outside-month"}${isSelected ? " selected-day" : ""}${dateTasks.length ? " has-tasks" : ""}`}
              type="button"
              role="gridcell"
              aria-label={fullDateFormatter.format(day)}
              aria-pressed={isSelected}
              data-calendar-date={getDateKey(day)}
              key={getDateKey(day)}
              onClick={() => setSelectedDate(day)}
            >
              <span>{day.getDate()}</span>
              {dateTasks.length > 0 && <span className="calendar-task-count">{dateTasks.length}</span>}
            </button>
          );
        })}
      </div>

      <section className="selected-day-panel" aria-live="polite" aria-labelledby="selected-day-title">
        <h3 id="selected-day-title">{fullDateFormatter.format(selectedDate)}</h3>
        {selectedTasks.length === 0
          ? <p className="calendar-empty">No tasks planned.</p>
          : <ul>{selectedTasks.map((task) => (
            <li key={task.id}>
              {task.title}{" "}
              <button className="complete-button" type="button" onClick={() => onEdit(task.id, selectedDate)} aria-label={`Edit ${task.title}`}>Edit</button>
            </li>
          ))}</ul>}
      </section>
    </section>
  );
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

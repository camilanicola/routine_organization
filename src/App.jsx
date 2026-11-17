import { useEffect, useRef, useState } from "react";
import { getAgendaTasks, getDateKey, shiftDate } from "./calendar.js";
import { CalendarView } from "./components/CalendarView.jsx";
import { MonospacedTitle } from "./components/MonospacedTitle.jsx";
import { TaskForm } from "./components/TaskForm.jsx";
import { TaskList } from "./components/TaskList.jsx";
import { rescheduleOverdueTasks } from "./task-scheduler.js";
import { loadTasks, saveTasks } from "./task-storage.js";

export function App() {
  const [initialState] = useState(loadTasks);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [statusMessage, setStatusMessage] = useState(
    initialState.error ? `Could not load saved tasks: ${initialState.error.message}` : ""
  );
  const [activeView, setActiveView] = useState("agenda");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const hasRescheduled = useRef(false);

  useEffect(() => {
    if (hasRescheduled.current) return;
    hasRescheduled.current = true;

    try {
      const adjustedTasks = rescheduleOverdueTasks(tasks, new Date());
      const movedCount = adjustedTasks.filter((task, index) => task.dueAt !== tasks[index]?.dueAt).length;
      if (movedCount === 0) return;

      const error = saveTasks(adjustedTasks);
      if (error) {
        setStatusMessage(`Could not save rescheduled tasks: ${error.message}`);
        return;
      }

      setTasks(adjustedTasks);
      setStatusMessage(`${movedCount} overdue task(s) rescheduled.`);
    } catch (error) {
      setStatusMessage(`Could not reschedule tasks: ${error.message}`);
    }
  }, []);

  function handleCreateTask(task) {
    const updatedTasks = [...tasks, task];
    const error = saveTasks(updatedTasks);
    if (error) {
      setStatusMessage(`Could not save tasks in this browser: ${error.message}`);
      return false;
    }

    setTasks(updatedTasks);
    setSelectedDate(task.dueAt ? new Date(task.dueAt) : new Date());
    setStatusMessage("Task added.");
    return true;
  }

  function handleToggleTask(taskId, dateKey) {
    let isNowDone = false;
    const updatedTasks = tasks.map((task) => {
      if (task.id !== taskId) return task;

      if (task.repeatDays?.length) {
        const completed = task.completedDates ?? [];
        isNowDone = !completed.includes(dateKey);
        return {
          ...task,
          completedDates: isNowDone ? [...completed, dateKey] : completed.filter((key) => key !== dateKey)
        };
      }

      isNowDone = task.status !== "done";
      return { ...task, status: isNowDone ? "done" : "pending" };
    });
    const error = saveTasks(updatedTasks);
    if (error) {
      setStatusMessage(`Could not save tasks in this browser: ${error.message}`);
      return;
    }

    setTasks(updatedTasks);
    setStatusMessage(isNowDone ? "Task completed." : "Task restored.");
  }

  const today = new Date();
  const isToday = getDateKey(selectedDate) === getDateKey(today);
  const dayTasks = getAgendaTasks(tasks, selectedDate, today);

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Magical Girl Planner home">
          <MonospacedTitle>Magical Girl Planner</MonospacedTitle>
        </a>
        <span className="topbar-date">{formatToday()}</span>
      </header>

      <main>
        <section className="welcome" aria-labelledby="welcome-title">
          <h1 id="welcome-title"><MonospacedTitle>A little magic for your day.</MonospacedTitle></h1>
          <pre className="welcome-ascii" role="img" aria-label="A little magical cat">
            {readAsciiTemplate("hero-ascii-template")}
          </pre>
        </section>

        <nav className="view-switch" role="tablist" aria-label="Planner views">
          <button
            type="button"
            role="tab"
            id="agenda-tab"
            aria-selected={activeView === "agenda"}
            aria-controls="agenda-panel"
            onClick={() => setActiveView("agenda")}
          >
            Agenda
          </button>
          <button
            type="button"
            role="tab"
            id="calendar-tab"
            aria-selected={activeView === "calendar"}
            aria-controls="calendar-panel"
            onClick={() => setActiveView("calendar")}
          >
            Calendar
          </button>
        </nav>

        <p className="notice" role="status" aria-live="polite">{statusMessage}</p>

        {activeView === "agenda" ? (
          <section className="workspace" id="agenda-panel" role="tabpanel" aria-labelledby="agenda-tab">
            <section className="agenda-panel panel" aria-labelledby="agenda-title">
              <div className="section-heading">
                <div>
                  <h2 id="agenda-title">{isToday ? "Today’s plans" : formatDay(selectedDate)}</h2>
                </div>
                <div className="day-controls">
                  <button type="button" aria-label="Previous day" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}>‹</button>
                  {!isToday && <button type="button" className="today-button" onClick={() => setSelectedDate(new Date())}>Today</button>}
                  <button type="button" aria-label="Next day" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}>›</button>
                  <span className="task-count">{dayTasks.length} {dayTasks.length === 1 ? "task" : "tasks"}</span>
                </div>
              </div>
              <TaskList tasks={dayTasks} dateKey={getDateKey(selectedDate)} onToggle={handleToggleTask} />
            </section>

            <aside className="side-column">
              <TaskForm onCreate={handleCreateTask} />
            </aside>
          </section>
        ) : (
          <section id="calendar-panel" role="tabpanel" aria-labelledby="calendar-tab">
            <CalendarView tasks={tasks} />
          </section>
        )}
      </main>
    </div>
  );
}

function formatDay(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short"
  }).format(date);
}

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(new Date());
}

function readAsciiTemplate(id) {
  const value = document.getElementById(id)?.content.textContent ?? "";
  return value.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

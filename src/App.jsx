import { useEffect, useState } from "react";
import { getAgendaTasks, getDateKey, shiftDate } from "./calendar.js";
import { CalendarView } from "./components/CalendarView.jsx";
import { MonospacedTitle } from "./components/MonospacedTitle.jsx";
import { TaskForm } from "./components/TaskForm.jsx";
import { TaskList } from "./components/TaskList.jsx";
import { rescheduleOverdueTasks } from "./task-scheduler.js";
import { hasExplicitTiming, removeTasksWithoutExplicitTiming } from "./task-repository.js";
import { clearLocalTasks, loadTasks as loadLocalTasks } from "./task-storage.js";

export function App({ user, onSignOut, repository }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeView, setActiveView] = useState("agenda");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadAgenda() {
      try {
        let loadedTasks = await repository.load();
        const messages = [];

        if (loadedTasks.length === 0) {
          const { tasks: localTasks, error } = loadLocalTasks();
          if (error) throw error;
          if (localTasks.length > 0) {
            const importableTasks = localTasks.filter(hasExplicitTiming);
            if (importableTasks.length > 0) await repository.saveMany(importableTasks);
            clearLocalTasks();
            loadedTasks = importableTasks;
            if (importableTasks.length > 0) messages.push(`${importableTasks.length} task(s) imported from this browser.`);
            if (importableTasks.length < localTasks.length) {
              messages.push(`${localTasks.length - importableTasks.length} old task(s) without explicit timing removed.`);
            }
          }
        }

        const cleaned = await removeTasksWithoutExplicitTiming(repository, loadedTasks);
        loadedTasks = cleaned.tasks;
        if (cleaned.removedCount > 0) messages.push(`${cleaned.removedCount} old task(s) without explicit timing removed.`);

        const adjustedTasks = rescheduleOverdueTasks(loadedTasks, new Date());
        const movedTasks = adjustedTasks.filter((task, index) => task.dueAt !== loadedTasks[index]?.dueAt);
        if (movedTasks.length > 0) {
          await repository.saveMany(movedTasks);
          messages.push(`${movedTasks.length} overdue task(s) rescheduled.`);
        }

        if (isCancelled) return;
        setTasks(adjustedTasks);
        setStatusMessage(messages.join(" "));
      } catch (error) {
        if (!isCancelled) setStatusMessage(`Could not load your tasks: ${error.message}`);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadAgenda();
    return () => {
      isCancelled = true;
    };
  }, [repository]);

  async function handleCreateTask(task) {
    try {
      await repository.save(task);
    } catch (error) {
      setStatusMessage(`Could not save your task: ${error.message}`);
      throw error;
    }

    setTasks((current) => [...current, task]);
    setSelectedDate(task.dueAt ? new Date(task.dueAt) : new Date());
    setStatusMessage("Task added.");
    return true;
  }

  function handleEditTask(taskId, date) {
    if (date) setSelectedDate(date);
    setEditingTaskId(taskId);
    setActiveView("agenda");
  }

  async function handleSaveEdit(changes) {
    const original = tasks.find((task) => task.id === editingTaskId);
    if (!original) {
      setStatusMessage("Could not edit this task: task not found.");
      throw new Error("Task not found.");
    }

    const updatedTask = {
      ...original,
      ...changes,
      id: original.id,
      status: original.status,
      completedDates: original.completedDates ?? []
    };

    try {
      await repository.save(updatedTask);
    } catch (error) {
      setStatusMessage(`Could not save your task: ${error.message}`);
      throw error;
    }

    setTasks((current) => current.map((task) => task.id === original.id ? updatedTask : task));
    if (updatedTask.dueAt !== original.dueAt) {
      setSelectedDate(updatedTask.dueAt ? new Date(updatedTask.dueAt) : new Date());
    }
    setEditingTaskId(null);
    setStatusMessage("Task updated.");
    return true;
  }

  async function handleToggleTask(taskId, dateKey) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    let updatedTask;
    let isNowDone;
    if (task.repeatDays?.length) {
      const completed = task.completedDates ?? [];
      isNowDone = !completed.includes(dateKey);
      updatedTask = {
        ...task,
        completedDates: isNowDone ? [...completed, dateKey] : completed.filter((key) => key !== dateKey)
      };
    } else {
      isNowDone = task.status !== "done";
      updatedTask = { ...task, status: isNowDone ? "done" : "pending" };
    }

    try {
      await repository.save(updatedTask);
    } catch (error) {
      setStatusMessage(`Could not save your task: ${error.message}`);
      return;
    }

    setTasks((current) => current.map((item) => item.id === taskId ? updatedTask : item));
    setStatusMessage(isNowDone ? "Task completed." : "Task restored.");
  }

  const today = new Date();
  const isToday = getDateKey(selectedDate) === getDateKey(today);
  const dayTasks = getAgendaTasks(tasks, selectedDate, today);
  const editingTask = tasks.find((task) => task.id === editingTaskId);

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Magical Girl Planner home">
          <MonospacedTitle>Magical Girl Planner</MonospacedTitle>
        </a>
        <div className="topbar-user">
          <span className="topbar-date">{formatToday()}</span>
          {onSignOut && (
            <button type="button" className="signout-button" onClick={onSignOut} aria-label={`Sign out ${user?.displayName ?? ""}`.trim()}>
              Sign out
            </button>
          )}
        </div>
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

        <p className="notice" role="status" aria-live="polite">{isLoading ? "Loading your tasks..." : statusMessage}</p>

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
              <TaskList tasks={dayTasks} dateKey={getDateKey(selectedDate)} onToggle={handleToggleTask} onEdit={handleEditTask} />
            </section>

            <aside className="side-column">
              <TaskForm
                key={editingTask?.id ?? "new"}
                task={editingTask}
                onSave={editingTask ? handleSaveEdit : handleCreateTask}
                onCancel={() => setEditingTaskId(null)}
              />
            </aside>
          </section>
        ) : (
          <section id="calendar-panel" role="tabpanel" aria-labelledby="calendar-tab">
            <CalendarView tasks={tasks} onEdit={handleEditTask} />
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

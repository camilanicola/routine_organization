import { useEffect, useRef, useState } from "react";
import { REPEAT_DAYS } from "../calendar.js";
import { createTask } from "../task-scheduler.js";

export function readPng(file) {
  if (file.type !== "image/png") {
    return Promise.reject(new TypeError("Choose a PNG file."));
  }
  if (file.size > 1_000_000) {
    return Promise.reject(new RangeError("PNG files must be 1 MB or smaller."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(new Error("Could not read the PNG file.")));
    reader.readAsDataURL(file);
  });
}

function localDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function TaskForm({ task, onSave, onCancel }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [hasNoDate, setHasNoDate] = useState(task?.dueAt === null);
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState(() => localDateTime(task?.dueAt));
  const [endTime, setEndTime] = useState(() => localDateTime(task?.endAt));
  const titleRef = useRef(null);
  const durationMinutes = (Date.parse(endTime) - Date.parse(startTime)) / 60_000;

  useEffect(() => {
    if (task) titleRef.current?.focus();
  }, [task]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const image = formData.get("iconFile");

    setIsSaving(true);
    setErrorMessage("");
    try {
      const updatedTask = createTask({
        title: formData.get("title"),
        dueAt: hasNoDate ? null : formData.get("dueAt"),
        endAt: hasNoDate ? null : formData.get("endAt"),
        durationMinutes: hasNoDate ? Number(formData.get("durationMinutes")) : undefined,
        priority: formData.get("priority"),
        repeatDays: formData.getAll("repeat").map(Number),
        notes: formData.get("notes"),
        iconText: formData.get("iconText"),
        iconData: image && image.size > 0
          ? await readPng(image)
          : formData.has("removeIcon") ? "" : task?.iconData ?? ""
      });

      if (await onSave(updatedTask)) {
        if (!task) {
          form.reset();
          setHasNoDate(false);
          setStartTime("");
          setEndTime("");
        }
        setErrorMessage("");
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="form-panel panel" aria-labelledby="form-title">
      <h2 id="form-title">{task ? "Edit task" : "New task"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="task-title">Task</label>
          <input ref={titleRef} id="task-title" name="title" type="text" maxLength="80" placeholder="e.g. Study for an exam" defaultValue={task?.title ?? ""} required />
        </div>

        <div>
          <label htmlFor="task-due">Start date &amp; time</label>
          <input id="task-due" name="dueAt" type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} disabled={hasNoDate} required={!hasNoDate} />
          <label htmlFor="task-end">End date &amp; time</label>
          <input id="task-end" name="endAt" type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled={hasNoDate} required={!hasNoDate} />
          {!hasNoDate && Number.isFinite(durationMinutes) && durationMinutes > 0 && (
            <p className="duration-hint" aria-live="polite">Duration: {durationMinutes} min</p>
          )}
          <label className="check-label" htmlFor="task-no-date">
            <input id="task-no-date" type="checkbox" checked={hasNoDate} onChange={(event) => setHasNoDate(event.target.checked)} />
            No date, keep it until done
          </label>
        </div>

        {hasNoDate && (
          <div>
            <label htmlFor="task-duration">Duration in minutes</label>
            <input id="task-duration" name="durationMinutes" type="number" min="1" step="1" defaultValue={task?.dueAt === null ? task.durationMinutes : ""} required />
          </div>
        )}

        <div>
          <label htmlFor="task-priority">Priority</label>
          <select id="task-priority" name="priority" defaultValue={task?.priority ?? "important-urgent"} required>
            <option value="important-urgent">Urgent &amp; important</option>
            <option value="urgent">Urgent</option>
            <option value="important">Important</option>
            <option value="neither">Neither urgent nor important</option>
          </select>
        </div>

        <fieldset className="repeat-days" disabled={hasNoDate}>
          <legend>Repeat on</legend>
          <div>
            {REPEAT_DAYS.map(({ value, label }) => (
              <label className="day-chip" key={value}>
                <input type="checkbox" name="repeat" value={value} defaultChecked={task?.repeatDays?.includes(value) ?? false} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="notes-paper" aria-labelledby="task-notes-title">
          <div className="notes-paper-heading">
            <h3 id="task-notes-title">Little notes</h3>
            <pre aria-hidden="true">{readAsciiTemplate("notes-ascii-template")}</pre>
          </div>
          <label className="visually-hidden" htmlFor="task-notes">Little notes</label>
          <textarea id="task-notes" name="notes" rows="8" maxLength="280" placeholder="Anything to remember..." defaultValue={task?.notes ?? ""} />
        </section>

        <div className="icon-fields">
          <div>
            <label htmlFor="task-icon-text">Your icon</label>
            <input id="task-icon-text" name="iconText" type="text" maxLength="64" placeholder="૮꒰ ˶• ༝ •˶꒱ა ♡" defaultValue={task?.iconText ?? ""} />
          </div>
          <div>
            <label htmlFor="task-icon-file">Or add a PNG</label>
            <input id="task-icon-file" name="iconFile" type="file" accept="image/png" aria-describedby="icon-hint" />
          </div>
        </div>
        <p className="field-hint" id="icon-hint">PNG · up to 1 MB</p>
        {task?.iconData && (
          <label className="check-label">
            <input type="checkbox" name="removeIcon" />
            Remove current PNG (a new PNG replaces it)
          </label>
        )}
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <button className="primary-button" type="submit" disabled={isSaving}>{task ? "Save changes" : "Add task"}</button>
        {task && <button className="link-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel editing</button>}
      </form>
    </section>
  );
}

function readAsciiTemplate(id) {
  const value = document.getElementById(id)?.content.textContent ?? "";
  return value.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

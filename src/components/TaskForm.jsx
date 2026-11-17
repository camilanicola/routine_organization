import { useState } from "react";
import { REPEAT_DAYS } from "../calendar.js";
import { createTask } from "../task-scheduler.js";

function getDefaultDateTime() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

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

export function TaskForm({ onCreate }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [hasNoDate, setHasNoDate] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const image = formData.get("iconFile");

    try {
      const task = createTask({
        title: formData.get("title"),
        dueAt: hasNoDate ? null : formData.get("dueAt"),
        priority: formData.get("priority"),
        repeatDays: formData.getAll("repeat").map(Number),
        notes: formData.get("notes"),
        iconText: formData.get("iconText"),
        iconData: image && image.size > 0 ? await readPng(image) : ""
      });

      if (onCreate(task)) {
        form.reset();
        setHasNoDate(false);
        form.elements.dueAt.value = getDefaultDateTime();
        setErrorMessage("");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <section className="form-panel panel" aria-labelledby="form-title">
      <h2 id="form-title">New task</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="task-title">Task</label>
          <input id="task-title" name="title" type="text" maxLength="80" placeholder="e.g. Study for an exam" required />
        </div>

        <div>
          <label htmlFor="task-due">Date &amp; time</label>
          <input id="task-due" name="dueAt" type="datetime-local" defaultValue={getDefaultDateTime()} disabled={hasNoDate} required={!hasNoDate} />
          <label className="check-label" htmlFor="task-no-date">
            <input id="task-no-date" type="checkbox" checked={hasNoDate} onChange={(event) => setHasNoDate(event.target.checked)} />
            No date, keep it until done
          </label>
        </div>

        <div>
          <label htmlFor="task-priority">Priority</label>
          <select id="task-priority" name="priority" defaultValue="important-urgent" required>
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
                <input type="checkbox" name="repeat" value={value} />
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
          <textarea id="task-notes" name="notes" rows="8" maxLength="280" placeholder="Anything to remember..." />
        </section>

        <div className="icon-fields">
          <div>
            <label htmlFor="task-icon-text">Your icon</label>
            <input id="task-icon-text" name="iconText" type="text" maxLength="12" placeholder="૮꒰ ˶• ༝ •˶꒱ა ♡" />
          </div>
          <div>
            <label htmlFor="task-icon-file">Or add a PNG</label>
            <input id="task-icon-file" name="iconFile" type="file" accept="image/png" aria-describedby="icon-hint" />
          </div>
        </div>
        <p className="field-hint" id="icon-hint">PNG · up to 1 MB</p>
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <button className="primary-button" type="submit">Add task</button>
      </form>
    </section>
  );
}

function readAsciiTemplate(id) {
  const value = document.getElementById(id)?.content.textContent ?? "";
  return value.replace(/^\r?\n/, "").replace(/\r?\n$/, "");
}

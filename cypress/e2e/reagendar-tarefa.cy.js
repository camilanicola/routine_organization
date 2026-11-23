import { makeTask, makeRepeatingTask } from "../support/tasks.js";

describe("Reagendamento de tarefa", () => {
  it("salva a tarefa atrasada após a ocorrência semanal ao carregar a agenda", () => {
    const atrasada = makeTask({
      id: "atrasada",
      dueAt: new Date(2026, 10, 17, 8).toISOString(),
      endAt: new Date(2026, 10, 17, 9).toISOString(),
      durationMinutes: 60
    });
    const semanal = makeRepeatingTask({
      id: "semanal",
      title: "Reunião semanal",
      dueAt: new Date(2026, 10, 11, 8, 30).toISOString(),
      endAt: new Date(2026, 10, 11, 9, 30).toISOString(),
      durationMinutes: 60,
      repeatDays: [3],
      completedDates: ["2026-11-11"]
    });

    cy.visitPlanner([atrasada, semanal]);
    cy.signInPlanner();

    cy.get(".notice").should("contain", "1 overdue task(s) rescheduled.");
    cy.get(".task-card").should("have.length", 2);
    cy.loadPlannerTasks().should("deep.equal", [{
      ...atrasada,
      dueAt: new Date(2026, 10, 18, 9, 30).toISOString(),
      endAt: new Date(2026, 10, 18, 10, 30).toISOString()
    }, semanal]);
  });
});

import { makeTask, makeRepeatingTask } from "../support/tasks.js";

describe("Conclusão de tarefa", () => {
  it("conclui e restaura uma tarefa sem data", () => {
    const tarefa = makeTask();
    cy.visitPlanner([tarefa]);
    cy.signInPlanner();

    cy.get('[aria-label="Complete Estudar"]').click();
    cy.get(".notice").should("contain", "Task completed.");
    cy.get(".task-card").should("have.class", "is-done");
    cy.loadPlannerTasks().should("deep.equal", [{ ...tarefa, status: "done" }]);

    cy.get('[aria-label="Undo Estudar"]').click();
    cy.get(".notice").should("contain", "Task restored.");
    cy.get(".task-card").should("not.have.class", "is-done");
    cy.loadPlannerTasks().should("deep.equal", [tarefa]);
  });

  it("conclui e restaura apenas a ocorrência selecionada de uma tarefa repetitiva", () => {
    const tarefa = makeRepeatingTask();
    cy.visitPlanner([tarefa]);
    cy.signInPlanner();

    cy.get('[aria-label="Complete Estudar"]').click();
    cy.get(".task-card").should("have.class", "is-done");
    cy.loadPlannerTasks().should("deep.equal", [{ ...tarefa, completedDates: ["2026-11-18"] }]);

    cy.get('[aria-label="Next day"]').click();
    cy.get(".task-card").should("not.exist");
    cy.get('[aria-label="Next day"]').click();
    cy.get(".task-card").should("not.have.class", "is-done");
    cy.get('[aria-label="Complete Estudar"]').click();
    cy.get(".task-card").should("have.class", "is-done");
    cy.loadPlannerTasks().should("deep.equal", [{ ...tarefa, completedDates: ["2026-11-18", "2026-11-20"] }]);

    cy.get('[aria-label="Previous day"]').click();
    cy.get('[aria-label="Previous day"]').click();
    cy.get('[aria-label="Undo Estudar"]').click();
    cy.get(".task-card").should("not.have.class", "is-done");
    cy.loadPlannerTasks().should("deep.equal", [{ ...tarefa, completedDates: ["2026-11-20"] }]);
  });
});

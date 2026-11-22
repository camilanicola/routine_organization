import { makeTask, makeRepeatingTask } from "../support/tasks.js";

describe("Edição de tarefa", () => {
  it("salva as alterações sem duplicar a tarefa nem perder sua conclusão", () => {
    const tarefa = makeTask({ status: "done" });
    cy.visitPlanner([tarefa]);
    cy.signInPlanner();

    cy.get('[aria-label="Edit Estudar"]').click();
    cy.get("#task-title").should("have.focus").clear().type("Revisar prova");
    cy.get("#task-duration").clear().type("45");
    cy.get("#task-priority").select("urgent");
    cy.get("#task-notes").clear().type("Resolver exercícios");
    cy.contains("button", "Save changes").click();

    cy.get(".notice").should("contain", "Task updated.");
    cy.get(".task-card").should("have.length", 1).and("have.class", "is-done");
    cy.contains(".task-card h3", "Revisar prova").should("be.visible");
    cy.get(".task-notes").should("contain", "Resolver exercícios");
    cy.get("#form-title").should("have.text", "New task");
    cy.loadPlannerTasks().should("deep.equal", [{
      ...tarefa,
      title: "Revisar prova",
      durationMinutes: 45,
      priority: "urgent",
      notes: "Resolver exercícios"
    }]);
  });

  it("cancela a edição sem alterar os dados salvos", () => {
    const tarefa = makeTask();
    cy.visitPlanner([tarefa]);
    cy.signInPlanner();

    cy.get('[aria-label="Edit Estudar"]').click();
    cy.get("#task-title").clear().type("Alteração descartada");
    cy.contains("button", "Cancel editing").click();

    cy.get("#form-title").should("have.text", "New task");
    cy.get("#task-title").should("have.value", "");
    cy.contains(".task-card h3", "Estudar").should("be.visible");
    cy.loadPlannerTasks().should("deep.equal", [tarefa]);
  });

  it("edita pelo calendário preservando os dias de repetição e as ocorrências concluídas", () => {
    const tarefa = makeRepeatingTask({ completedDates: ["2026-11-18"] });
    cy.visitPlanner([tarefa]);
    cy.signInPlanner();

    cy.get("#calendar-tab").click();
    cy.get('[data-calendar-date="2026-11-20"]').click();
    cy.get('[aria-label="Edit Estudar"]').click();
    cy.get("#agenda-tab").should("have.attr", "aria-selected", "true");
    cy.get("#task-title").clear().type("Estudar matemática");
    cy.contains("button", "Save changes").click();

    cy.get(".notice").should("contain", "Task updated.");
    cy.get(".task-card").should("not.have.class", "is-done");
    cy.loadPlannerTasks().should("deep.equal", [{ ...tarefa, title: "Estudar matemática" }]);
  });
});

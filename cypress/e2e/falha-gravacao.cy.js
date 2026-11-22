import { makeTask, makeRepeatingTask } from "../support/tasks.js";

describe("Falha ao gravar tarefa", () => {
  it("mantém o formulário preenchido e permite tentar criar novamente", () => {
    cy.visitPlanner();
    cy.signInPlanner();
    cy.window().then((window) => {
      cy.stub(window.plannerTest.repository, "save").rejects(new Error("Falha de gravação")).as("saveTask");
    });

    cy.get("#task-title").type("Estudar");
    cy.get("#task-no-date").check();
    cy.get("#task-duration").type("30");
    cy.contains("button", "Add task").click();

    cy.get(".form-error").should("contain", "Falha de gravação");
    cy.get(".notice").should("contain", "Could not save your task");
    cy.get("#task-title").should("have.value", "Estudar");
    cy.get("#task-duration").should("have.value", "30");
    cy.get(".task-card").should("not.exist");
    cy.loadPlannerTasks().should("deep.equal", []);

    cy.get("@saveTask").then((save) => save.restore());
    cy.contains("button", "Add task").should("not.be.disabled").click();
    cy.get(".notice").should("contain", "Task added.");
    cy.get(".task-card").should("have.length", 1);
    cy.loadPlannerTasks().should("have.length", 1);
  });

  it("preserva a tarefa original quando a edição não pode ser salva", () => {
    const tarefa = makeTask();
    cy.visitPlanner([tarefa]);
    cy.signInPlanner();
    cy.window().then((window) => {
      cy.stub(window.plannerTest.repository, "save").rejects(new Error("Falha de gravação"));
    });

    cy.get('[aria-label="Edit Estudar"]').click();
    cy.get("#task-title").clear().type("Revisar prova");
    cy.contains("button", "Save changes").click();

    cy.get(".form-error").should("contain", "Falha de gravação");
    cy.get("#task-title").should("have.value", "Revisar prova");
    cy.contains(".task-card h3", "Estudar").should("be.visible");
    cy.loadPlannerTasks().should("deep.equal", [tarefa]);
  });

  it("não marca a ocorrência como concluída quando a gravação falha", () => {
    const tarefa = makeRepeatingTask();
    cy.visitPlanner([tarefa]);
    cy.signInPlanner();
    cy.window().then((window) => {
      cy.stub(window.plannerTest.repository, "save").rejects(new Error("Falha de gravação"));
    });

    cy.get('[aria-label="Complete Estudar"]').click();

    cy.get(".notice").should("contain", "Could not save your task");
    cy.get(".task-card").should("not.have.class", "is-done");
    cy.get('[aria-label="Complete Estudar"]').should("be.visible");
    cy.loadPlannerTasks().should("deep.equal", [tarefa]);
  });
});

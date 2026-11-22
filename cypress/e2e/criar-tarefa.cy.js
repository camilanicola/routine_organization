describe("Criação de tarefa", () => {
  it("faz login e cria uma nova tarefa sem data na agenda", () => {
    const titulo = "Tarefa E2E";

    cy.visitPlanner();
    cy.signInPlanner();

    cy.get("#task-title", { timeout: 10000 }).should("be.visible").type(titulo);
    cy.get("#task-no-date").check();
    cy.get("#task-duration").type("30");
    cy.get("#task-priority").select("important");
    cy.contains("button.primary-button", "Add task").click();

    cy.get(".notice").should("contain", "Task added.");
    cy.contains(".task-card h3", titulo).should("be.visible");
    cy.loadPlannerTasks().should((tasks) => {
      expect(tasks).to.have.length(1);
      expect(tasks[0]).to.include({ title: titulo, dueAt: null, endAt: null, durationMinutes: 30, priority: "important" });
    });
  });
});

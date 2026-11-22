beforeEach(() => {
  cy.clock(new Date(2026, 10, 18, 8).getTime(), ["Date"]);
});

Cypress.Commands.add("visitPlanner", (tasks = []) => {
  cy.visit("/", {
    onBeforeLoad(window) {
      window.plannerInitialTasks = tasks;
    }
  });
  // Falha antes de enviar o formulário se o servidor de testes não estiver ativo.
  cy.window().its("plannerTest.repository").should("exist");
});

Cypress.Commands.add("signInPlanner", () => {
  cy.get("#login-email").type("e2e.planner@teste.com");
  cy.get("#login-password").type("teste123", { log: false });
  cy.contains("button.primary-button", "Sign in").click();
  cy.get("#task-title").should("be.visible");
  cy.get(".notice").should("not.contain", "Loading your tasks...");
});

Cypress.Commands.add("loadPlannerTasks", () => {
  return cy.window().then((window) => window.plannerTest.repository.load());
});

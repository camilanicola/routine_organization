describe("Alternar entre login e cadastro", () => {
  it("alterna para o formulário de cadastro e volta para login", () => {
    cy.visitPlanner();
    
    cy.contains("button", "Create an account").click();
    cy.get("#login-confirm").should("be.visible");
    
    cy.contains("button", "I already have an account").click();
    cy.get("#login-confirm").should("not.exist");
  });

  it("envia as credenciais e permite sair da agenda", () => {
    cy.visitPlanner();
    cy.signInPlanner();

    cy.window().its("plannerTest.credentials").should("deep.equal", {
      email: "e2e.planner@teste.com",
      password: "teste123"
    });
    cy.contains("button", "Sign out").click();
    cy.get("#login-email").should("be.visible");
    cy.get("#task-title").should("not.exist");
  });
});

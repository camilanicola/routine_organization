describe("Alternar entre login e cadastro", () => {
  it("alterna para o formulário de cadastro e volta para login", () => {
    cy.visit("/");
    
    cy.contains("button", "Create an account").click();
    cy.get("#login-confirm").should("be.visible");
    
    cy.contains("button", "I already have an account").click();
    cy.get("#login-confirm").should("not.exist");
  });
});

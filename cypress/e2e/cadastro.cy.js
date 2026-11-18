describe("Cadastro", () => {
  it("mostra os campos de cadastro ao selecionar criar uma conta", () => {
    cy.visit("/");
    cy.contains("button", "Create an account").click();

    cy.get("#login-email").should("be.visible");
    cy.get("#login-password").should("be.visible");
    cy.get("#login-confirm").should("be.visible");
    cy.contains("button.primary-button", "Create account").should("be.visible");
  });
});

describe("Validação de senha no cadastro", () => {
  it("exibe erro quando a confirmação de senha é diferente da senha", () => {
    cy.visit("/");
    cy.contains("button", "Create an account").click();

    cy.get("#login-email").type("teste@example.com");
    cy.get("#login-password").type("senha123");
    cy.get("#login-confirm").type("senha456");
    cy.contains("button.primary-button", "Create account").click();

    cy.get(".form-error").should("contain", "Passwords do not match.");
  });
});
describe("Ícone da tarefa", () => {
  beforeEach(() => {
    cy.visitPlanner();
    cy.signInPlanner();
    cy.get("#task-title").type("Estudar");
    cy.get("#task-no-date").check();
    cy.get("#task-duration").type("30");
    cy.window().then((window) => {
      cy.spy(window.plannerTest.repository, "save").as("saveTask");
    });
  });

  it("rejeita um PNG maior que 1 MB antes de gravar a tarefa", () => {
    cy.get("#task-icon-file").selectFile({
      contents: Cypress.Buffer.alloc(1_000_001),
      fileName: "grande.png",
      mimeType: "image/png"
    });
    cy.contains("button", "Add task").click();

    cy.get(".form-error").should("contain", "PNG files must be 1 MB or smaller.");
    cy.get("#task-title").should("have.value", "Estudar");
    cy.get("@saveTask").should("not.have.been.called");
    cy.get(".task-card").should("not.exist");
  });

  it("rejeita arquivos que não são PNG", () => {
    cy.get("#task-icon-file").selectFile({
      contents: Cypress.Buffer.from("imagem inválida"),
      fileName: "icone.jpg",
      mimeType: "image/jpeg"
    });
    cy.contains("button", "Add task").click();

    cy.get(".form-error").should("contain", "Choose a PNG file.");
    cy.get("@saveTask").should("not.have.been.called");
  });

  it("salva um PNG válido e permite preservar ou remover o ícone durante a edição", () => {
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
    const iconData = `data:image/png;base64,${png}`;
    cy.get("#task-icon-file").selectFile({
      contents: Cypress.Buffer.from(png, "base64"),
      fileName: "icone.png",
      mimeType: "image/png"
    });
    cy.contains("button", "Add task").click();

    cy.get(".notice").should("contain", "Task added.");
    cy.get("img.task-icon").should("have.attr", "src", iconData);
    cy.loadPlannerTasks().its("0.iconData").should("equal", iconData);

    cy.get('[aria-label="Edit Estudar"]').click();
    cy.get("#task-notes").type("Manter o ícone");
    cy.contains("button", "Save changes").click();
    cy.get(".notice").should("contain", "Task updated.");
    cy.loadPlannerTasks().its("0.iconData").should("equal", iconData);

    cy.get('[aria-label="Edit Estudar"]').click();
    cy.get('[name="removeIcon"]').check();
    cy.contains("button", "Save changes").click();
    cy.get("img.task-icon").should("not.exist");
    cy.get("span.task-icon").should("be.visible");
    cy.loadPlannerTasks().its("0.iconData").should("equal", "");
  });
});

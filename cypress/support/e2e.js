beforeEach(() => {
  cy.window().then((window) => {
    window.localStorage.setItem("firebase:authUser:AIzaSyB0wA_x2VlnPwzNrq2vjn1XP6VKpU4Gfpc:[DEFAULT]", JSON.stringify({
      uid: "test-user",
      displayName: "Test User",
      email: "test@example.com",
      stsTokenManager: { refreshToken: "test-token" }
    }));
  });

  cy.intercept("GET", "**/docs**", { statusCode: 200, body: { documents: [] } }).as("loadTasks");
});

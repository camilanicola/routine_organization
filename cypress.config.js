import { fileURLToPath } from "node:url";
import { defineConfig } from "cypress";
import { createServer } from "vite";

export default defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    async setupNodeEvents(on, config) {
      const server = await createServer({
        configFile: fileURLToPath(new URL("./vite.e2e.config.js", import.meta.url)),
        root: config.projectRoot,
        server: { host: "127.0.0.1", port: 5174, strictPort: false }
      });

      try {
        await server.listen();
        config.baseUrl = server.resolvedUrls.local[0];
      } catch (error) {
        await server.close();
        throw error;
      }

      // No modo interativo, o servidor acompanha o processo de configuração.
      if (config.isTextTerminal) on("after:run", () => server.close());
      return config;
    }
  },
  video: false,
  screenshotOnRunFailure: false
});

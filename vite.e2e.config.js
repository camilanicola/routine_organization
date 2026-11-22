import { mergeConfig } from "vite";
import config from "./vite.config.js";

export default mergeConfig(config, {
  cacheDir: "node_modules/.vite-e2e",
  plugins: [{
    name: "planner-e2e",
    apply: "serve",
    transformIndexHtml(html) {
      return html.replace('src="/src/main.jsx"', 'src="/cypress/support/planner.jsx"');
    }
  }]
});

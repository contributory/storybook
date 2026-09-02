import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // Tests run in Node against a local file: SQLite DB — the web-standard
      // client cannot open file: URLs, so swap in the Node client for tests.
      "@libsql/client/web": path.resolve(
        __dirname,
        "node_modules/@libsql/client/lib-esm/node.js"
      ),
    },
  },
  test: {
    environment: "node",
  },
});

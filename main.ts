import * as db from "./app/db.ts";
import app, { ensureOwnerAccount } from "./app/app.ts";

// 1. Initialize the Database tables
await db.initDb();

// 2. Ensure owner account credentials are set up
await ensureOwnerAccount();

// 3. Start Hono Node.js web server
console.log("Starting Storybook Hono app on Node.js...");

// Boot server locally if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { serve } = await import("@hono/node-server");
  const port = Number(process.env.PORT || 8000);
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Storybook listening on http://localhost:${info.port}`);
  });
}

export default app.fetch;

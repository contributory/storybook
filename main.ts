import * as db from "./app/db.ts";
import app, { ensureOwnerAccount } from "./app/app.ts";

// 1. Initialize the Database tables
await db.initDb();

// 2. Ensure owner account credentials are set up
await ensureOwnerAccount();

// 3. Start Hono Deno web server
console.log("Starting Storybook Hono app on Deno...");

// Boot server locally if run directly
if (import.meta.main) {
  Deno.serve({ port: 8000 }, app.fetch);
}

export default app.fetch; // This is the entry point for HTTP vals on Val Town / Deno Context

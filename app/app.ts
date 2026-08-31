import { Hono } from "hono";
import * as db from "./db.js";
import { mcpHttpHandler } from "./mcp.js";
import { authMiddleware } from "./middleware.js";
import type { AppType } from "./middleware.js";
import { registerS3Routes } from "./routes/s3.js";
import { registerViewRoutes } from "./routes/views.js";
import { registerProfileRoutes } from "./routes/profile.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerStorybookRoutes } from "./routes/storybooks.js";
import { registerStoryverseRoutes } from "./routes/storyverses.js";
import { registerCharacterRoutes } from "./routes/characters.js";
import { registerCommentRoutes } from "./routes/comments.js";
import { registerFollowRoutes } from "./routes/follows.js";
import { registerAdminRoutes } from "./routes/admin.js";

const app: AppType = new Hono();

// Unwrap errors to see stack traces
app.onError((err, c) => {
  console.error("Hono error:", err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

// Authentication middleware (applies to all routes)
app.use("*", authMiddleware);

// --- Route modules ---
registerS3Routes(app);
registerViewRoutes(app);
registerProfileRoutes(app);
registerNotificationRoutes(app);
registerAuthRoutes(app);
registerStorybookRoutes(app);
registerStoryverseRoutes(app);
registerCharacterRoutes(app);
registerCommentRoutes(app);
registerFollowRoutes(app);
registerAdminRoutes(app);

// --- MCP SERVER INTEGRATION (Streamable HTTP, stateless) ---
// Implemented with @modelcontextprotocol/sdk + @hono/mcp (StreamableHTTPTransport).
// Each request creates a brand-new transport + server bound to the authenticated
// user, so no session state is kept between calls (stateless mode).

app.all("/mcp", async (c) => {
  try {
    // Retrieve API Token from URL query params only
    const token = c.req.query("api_key") || "";

    if (!token) {
      return c.json(
        {
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message:
              "Unauthorized: Missing API Token. Please generate an API Token in settings.",
          },
          id: null,
        },
        401,
      );
    }

    const mcpUser = await db.getUserByApiToken(token);
    if (!mcpUser) {
      return c.json(
        {
          jsonrpc: "2.0",
          error: { code: -32001, message: "Unauthorized: Invalid API Token." },
          id: null,
        },
        401,
      );
    }

    return await mcpHttpHandler(c, mcpUser);
  } catch (err: any) {
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: err.message },
        id: null,
      },
      500,
    );
  }
});

export default app;

// Re-exported for consumers (main.ts, tests)
export { ensureOwnerAccount, sha256 } from "./middleware.js";

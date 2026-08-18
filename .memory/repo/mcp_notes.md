# MCP server notes

- MCP is implemented with `@modelcontextprotocol/sdk` (`McpServer`) + `@hono/mcp`
  (`StreamableHTTPTransport`), deployed **stateless**: `backend/mcp.ts` exports
  `buildMcpServer(user)` and `mcpHttpHandler(c, user)`. Each HTTP request creates a
  fresh transport + server bound to the authenticated user (api_key query param).
- Auth: `app.ts` `app.all("/mcp", ...)` checks `?api_key=` via `db.getUserByApiToken`.
- Tools are registered with Zod schemas in `buildMcpServer`. Permission lists
  (SENSITIVE_TOOLS / CREATOR_TOOLS) enforced via `guard()`.
- Backward-compat helpers `executeMcpTool` / `handleMcpRequest` are kept for
  `tests/app_test.ts` and dispatch through an in-memory SDK Client.

## Pre-existing gap (not fixed here)
- `backend/ui/creator.tsx` POSTs to `/api/mcp`, but the only MCP route is `/mcp`.
  Also it sends no `api_key`, so the AI-export feature 401s/404s. Was already broken
  before the refactor. To fix: add a `/api/mcp` alias and session-cookie auth fallback.

## Deps (Deno, inline npm specifiers)
- `npm:@modelcontextprotocol/sdk@^1.17.3` (peer: zod ^3.25)
- `npm:@hono/mcp@0.2.0`
- `npm:zod@^3.25`

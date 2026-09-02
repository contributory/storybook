import { Hono } from "hono";
import * as db from "./db";
import { mcpHttpHandler } from "./mcp";
import { getUserFromRequest } from "./session";
import { ensureReady } from "./bootstrap";

function unauthorized(message: string) {
  return Response.json({ jsonrpc: "2.0", error: { code: -32001, message }, id: null }, { status: 401 });
}

function mcpError(err: any) {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32603, message: err.message }, id: null },
    { status: 500 }
  );
}

// Run the stateless Streamable-HTTP MCP transport against a Web Request.
// Each request creates a brand-new transport + server bound to the
// authenticated user (stateless mode — same as the previous Hono app).
async function runTransport(req: Request, user: db.User): Promise<Response> {
  const app = new Hono().all("*", (c) => mcpHttpHandler(c, user));
  const response = await app.fetch(req);
  // Stateless transports may return undefined for notification-only requests.
  return response ?? new Response(null, { status: 202 });
}

// Browser-friendly variant used by /api/mcp: simple browser fetches send
// `Accept: */*` (rejected by the strict MCP transport) and cannot parse an SSE
// stream. Normalize the Accept header and unwrap a single SSE `data:` frame
// back into a plain JSON response.
async function runTransportBrowserFriendly(req: Request, user: db.User): Promise<Response> {
  const headers = new Headers(req.headers);
  const accept = headers.get("accept") || "";
  if (!accept.includes("application/json") || !accept.includes("text/event-stream")) {
    headers.set("accept", "application/json, text/event-stream");
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.text() : undefined;
  const normalized = new Request(req.url, {
    method: req.method,
    headers,
    body,
  });

  const response = await runTransport(normalized, user);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    return response;
  }

  // Unwrap the SSE frame: keep only the first `data:` JSON payload
  const text = await response.text();
  const dataLine = text.split("\n").find((line) => line.startsWith("data:"));
  if (!dataLine) return response;
  try {
    const json = JSON.parse(dataLine.slice(5).trim());
    return Response.json(json);
  } catch {
    return response;
  }
}

// --- /mcp endpoint: API-token authentication only (same as the previous app) ---
export async function handleMcpEndpoint(req: Request): Promise<Response> {
  await ensureReady();
  try {
    // Retrieve API Token from URL query params only
    const token = new URL(req.url).searchParams.get("api_key") || "";

    if (!token) {
      return unauthorized(
        "Unauthorized: Missing API Token. Please generate an API Token in settings."
      );
    }

    const mcpUser = await db.getUserByApiToken(token);
    if (!mcpUser) {
      return unauthorized("Unauthorized: Invalid API Token.");
    }

    return await runTransport(req, mcpUser);
  } catch (err: any) {
    return mcpError(err);
  }
}

// --- /api/mcp endpoint: session-cookie auth first, api_key fallback. ---
// This enables the in-app "AI Context Compiler" (creator dashboard), which
// previously failed because it POSTs without an api_key.
export async function handleMcpEndpointWithSession(req: Request): Promise<Response> {
  await ensureReady();
  try {
    let user = await getUserFromRequest(req);
    if (!user) {
      const token = new URL(req.url).searchParams.get("api_key") || "";
      if (token) user = await db.getUserByApiToken(token);
    }
    if (!user) {
      return unauthorized(
        "Unauthorized: Missing API Token. Please generate an API Token in settings."
      );
    }
    return await runTransportBrowserFriendly(req, user);
  } catch (err: any) {
    return mcpError(err);
  }
}

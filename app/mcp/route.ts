import { handleMcpEndpoint } from "@/lib/mcp-handler";

// MCP Server endpoint (Streamable HTTP, stateless) — API-token auth via ?api_key=
// Same contract as the previous Hono app.all("/mcp", ...) handler.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleMcpEndpoint(req);
}

export async function POST(req: Request) {
  return handleMcpEndpoint(req);
}

export async function DELETE(req: Request) {
  return handleMcpEndpoint(req);
}

export async function PUT(req: Request) {
  return handleMcpEndpoint(req);
}

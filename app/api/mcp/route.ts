import { handleMcpEndpointWithSession } from "@/lib/mcp-handler";

// MCP alias for the in-app client (creator dashboard "AI Context Compiler").
// Authenticates via session cookie first, then falls back to ?api_key=.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleMcpEndpointWithSession(req);
}

export async function POST(req: Request) {
  return handleMcpEndpointWithSession(req);
}

export async function DELETE(req: Request) {
  return handleMcpEndpointWithSession(req);
}

export async function PUT(req: Request) {
  return handleMcpEndpointWithSession(req);
}

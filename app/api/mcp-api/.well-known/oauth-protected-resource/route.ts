import { NextResponse } from "next/server";

export async function GET() {
  // Protected resource metadata for OAuth compatibility
  return NextResponse.json({
    type: "oauth-protected-resource",
    authorization_servers: [
      "https://twitter.com/i/oauth2/authorize",
      "https://www.reddit.com/api/v1/authorize"
    ],
    resource: "Nexa MCP Server",
    scopes_supported: ["read", "write"], // Example scopes
  });
}

// MCP-compatible handler for Nexa
export async function GET() {
  return Response.json({
    jsonrpc: "2.0",
    id: null,
    result: {
      tools: [
        {
          name: "post_to_x",
          description: "Posts a message to the user's X (Twitter) account",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string", minLength: 1, maxLength: 280 }
            },
            required: ["message"]
          }
        },
        {
          name: "post_to_reddit",
          description: "Submits a post to a subreddit",
          inputSchema: {
            type: "object",
            properties: {
              subreddit: { type: "string" },
              title: { type: "string", minLength: 1 },
              body: { type: "string" }
            },
            required: ["subreddit", "title"]
          }
        }
      ]
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  // Handle tool calls
  if (body.method === "tools/call") {
    const { name, arguments: args } = body.params;

    if (name === "post_to_x") {
      return Response.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          content: [{ type: "text", text: `Mock: Posted to Twitter: "${args.message}"` }]
        }
      });
    }

    if (name === "post_to_reddit") {
      return Response.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          content: [{ type: "text", text: `Mock: Posted to r/${args.subreddit}: "${args.title}"` }]
        }
      });
    }
  }

  return Response.json({
    jsonrpc: "2.0",
    id: body.id,
    error: { code: -32601, message: "Method not found" }
  });
}

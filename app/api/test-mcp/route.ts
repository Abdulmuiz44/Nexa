// Simple MCP-like handler for testing
export async function GET() {
  return Response.json({
    jsonrpc: "2.0",
    id: null,
    result: {
      tools: [
        {
          name: "test_tool",
          description: "A test tool",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string" }
            },
            required: ["message"]
          }
        }
      ]
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.method === "tools/call" && body.params?.name === "test_tool") {
    return Response.json({
      jsonrpc: "2.0",
      id: body.id,
      result: {
        content: [{ type: "text", text: `Test response: ${body.params.arguments.message}` }]
      }
    });
  }

  return Response.json({
    jsonrpc: "2.0",
    id: body.id,
    error: { code: -32601, message: "Method not found" }
  });
}


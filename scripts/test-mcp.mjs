#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/api/mcp-api/streamable-http';

// Mock tokens for testing (simple test token)
const mockTokens = 'test-token';

// Simple HTTP test first
async function testBasicConnectivity() {
  console.log('Testing basic connectivity...');
  try {
    const response = await fetch(MCP_SERVER_URL.replace('/streamable-http', '/.well-known/oauth-protected-resource'));
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OAuth metadata endpoint accessible:', data);
      return true;
    } else {
      console.log('❌ OAuth metadata endpoint failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Basic connectivity test failed:', error.message);
    return false;
  }
}

async function testMCP() {
  console.log('Testing MCP Server...');
  console.log(`Server URL: ${MCP_SERVER_URL}`);
  console.log(`Using mock auth token: ${mockTokens}`);

  // First test basic connectivity
  const basicOk = await testBasicConnectivity();
  if (!basicOk) {
    console.log('❌ Skipping MCP test due to connectivity issues');
    return;
  }

  try {
    // Create transport
    const transport = new StreamableHTTPClientTransport(
      new URL(MCP_SERVER_URL),
      {
        headers: {
          'Authorization': `Bearer ${mockTokens}`
        }
      }
    );

    // Create client
    const client = new Client(
      {
        name: 'test-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    // Connect
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List available tools
    const toolsResponse = await client.request(
      { method: 'tools/list' },
      {
        timeout: 10000
      }
    );

    console.log('✅ Available tools:', toolsResponse.tools.map(t => t.name));

    // Test post_to_x tool (this will fail with mock token, but tests the connection)
    try {
      console.log('Testing post_to_x tool...');
      const result = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'post_to_x',
            arguments: {
              message: 'Test message from MCP test client'
            }
          }
        },
        {
          timeout: 30000
        }
      );
      console.log('✅ post_to_x result:', result);
    } catch (error) {
      console.log('⚠️ post_to_x failed (expected with mock token):', error.message);
    }

    // Test post_to_reddit tool
    try {
      console.log('Testing post_to_reddit tool...');
      const result = await client.request(
        {
          method: 'tools/call',
          params: {
            name: 'post_to_reddit',
            arguments: {
              subreddit: 'test',
              title: 'Test post from MCP client',
              body: 'This is a test post'
            }
          }
        },
        {
          timeout: 30000
        }
      );
      console.log('✅ post_to_reddit result:', result);
    } catch (error) {
      console.log('⚠️ post_to_reddit failed (expected with mock token):', error.message);
    }

    // Close connection
    await client.close();
    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run tests when executed directly
testMCP().catch(console.error);

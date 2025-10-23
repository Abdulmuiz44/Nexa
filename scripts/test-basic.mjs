#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testEndpoint(url, description) {
  console.log(`Testing ${description}...`);
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${description} - Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`❌ ${description} - Status: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.log(`   Error:`, JSON.stringify(errorData, null, 2));
      } catch {
        console.log(`   Response:`, await response.text());
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Network error: ${error.message}`);
    return false;
  }
}

async function testOAuthMetadata() {
  return await testEndpoint(
    `${BASE_URL}/api/mcp-api/.well-known/oauth-protected-resource`,
    'OAuth Metadata Endpoint'
  );
}

async function testMCPTransport() {
  console.log('Testing MCP Transport Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/mcp-api/streamable-http`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      })
    });

    console.log(`✅ MCP Transport - Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log(`   Response:`, await response.text());
      return false;
    }
  } catch (error) {
    console.log(`❌ MCP Transport - Network error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Nexa MCP Server');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('=' .repeat(50));

  const results = [];

  // Test OAuth metadata endpoint
  results.push(await testOAuthMetadata());

  // Test MCP transport endpoint
  results.push(await testMCPTransport());

  console.log('=' .repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the output above.');
    process.exit(1);
  }
}

runTests().catch(console.error);

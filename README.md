# Nexa - Autonomous AI Growth Agent

Nexa is a production-ready autonomous AI agent designed for marketing and content creation. It helps businesses scale their marketing efforts through intelligent automation, multi-channel content distribution, and data-driven optimization.

## 🚀 Features

- **Autonomous Campaign Management**: Create and manage marketing campaigns with minimal human intervention
- **Multi-Channel Content Generation**: Generate content optimized for Twitter and Reddit
- **Intelligent Scheduling**: AI-powered content scheduling based on audience engagement patterns
- **Real-time Analytics**: Track campaign performance, engagement rates, and ROI
- **Modular Architecture**: Extensible skill-based system for adding new capabilities
- **Production Ready**: Built with TypeScript, Next.js, and comprehensive testing

## 🏗️ Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Dashboard │    │   API Gateway   │    │  Agent Runner   │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│  (TypeScript)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Rate Limiter  │    │  Skills Registry│
                       │   & Auth        │    │  (Modular)      │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vector DB     │    │   Job Queue     │    │   LLM Wrapper   │
│   (Optional)    │◄──►│   (BullMQ)      │◄──►│   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- OpenAI API key
- Optional: Redis for production job queue and SSE chat sessions

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/nexa.git
   cd nexa
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env .env.local
   # Edit .env.local with your API keys
   \`\`\`

4. **Run development server**
   \`\`\`bash
   pnpm run dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

\`\`\`bash
# Required
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=file:./dev.db
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
REDIS_URL=redis://localhost:6379
SENTRY_DSN=your_sentry_dsn
JWT_SECRET=your_jwt_secret

# MCP Server (for OAuth and API access)
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run all tests
npm run check

# Unit tests
npm run test
npm run test:watch
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui
\`\`\`

## 🐳 Docker

\`\`\`bash
# Build and run with Docker
npm run docker:build
npm run docker:run

# Or use docker-compose for full stack
docker-compose up -d
\`\`\`

## 📊 API Endpoints

### Agent Management
- `POST /api/agent/start` - Start a new campaign
- `GET /api/agent/:id/status` - Get agent status
- `GET /api/agent/:id/logs` - Get agent logs
- `POST /api/agent/:id/feedback` - Provide feedback

### Campaign Management
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Health & Monitoring
- `GET /api/health` - Health check
- `GET /api/metrics` - System metrics

### MCP Server
- `GET/POST /api/mcp/[transport]` - MCP endpoint for real-time chat and tools
- `GET /api/mcp/.well-known/oauth-protected-resource` - OAuth metadata endpoint

## 🔧 Configuration

### Agent Configuration

\`\`\`typescript
const config: AgentConfig = {
  id: "my-agent",
  name: "Marketing Campaign",
  maxConcurrentTasks: 3,
  retryAttempts: 3,
  timeoutMs: 300000,
  metadata: {
    targetAudience: "Tech enthusiasts",
    channels: ["twitter", "X"],
    contentTopics: ["AI", "Technology"],
    schedule: {
      postsPerDay: 5,
      timezone: "UTC"
    }
  }
}
\`\`\`

### Skills System

Add custom skills by implementing the `Skill` interface:

\`\`\`typescript
export class CustomSkill implements Skill {
  name = "custom-skill"
  description = "A custom skill"

  async execute(payload: any): Promise<SkillResult> {
    // Your custom logic here
    return {
      data: { result: "success" },
      metadata: { tokensUsed: 100, apiCalls: 1 }
    }
  }
}
\`\`\`

## 📈 Monitoring

Nexa includes built-in monitoring and observability:

- **Health Checks**: Automated system health monitoring
- **Metrics Collection**: Performance and usage metrics
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Error Tracking**: Integration with Sentry for error monitoring

## 🔗 MCP Server

Nexa includes a Model Context Protocol (MCP) server that enables real-time chat and content posting to X (Twitter) and Reddit.

### Features

- **Real-time Chat**: SSE-based chat sessions with Redis pub/sub
- **OAuth Integration**: Secure access to X and Reddit APIs
- **Content Tools**: Post messages to Twitter and submit content to Reddit subreddits

### Setup OAuth Credentials

1. **Twitter/X API**:
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Create an app and get Client ID and Client Secret
   - Set `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` in environment variables

2. **Reddit API**:
   - Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
   - Create a "script" app and get Client ID and Client Secret
   - Set `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` in environment variables

### Using the MCP Server

The MCP endpoint is available at `/api/mcp-api/[transport]` where `[transport]` can be:
- `sse` for Server-Sent Events (with Redis for persistence)
- `streamable-http` for HTTP streaming

Clients should authenticate with a Bearer token containing base64-encoded JSON:
```json
{
  "twitterToken": "your_twitter_access_token",
  "redditToken": "your_reddit_access_token"
}
```

### Available Tools

- `post_to_x`: Post a message to the user's Twitter account
- `post_to_reddit`: Submit a post to a subreddit

### Testing the MCP Server

1. **Start the development server**:
   ```bash
   pnpm dev
   ```

2. **Run the basic connectivity test**:
   ```bash
   node scripts/test-basic.mjs
   ```

   This tests:
   - OAuth metadata endpoint accessibility
   - MCP transport endpoint with basic JSON-RPC call

3. **Run the full MCP client test**:
   ```bash
   node scripts/test-mcp.mjs
   ```

   This uses the MCP SDK to:
   - Connect to the MCP server at `http://localhost:3000/api/mcp-api/streamable-http`
   - List available tools
   - Test both `post_to_x` and `post_to_reddit` tools
   - Report success/failure

### Using Real OAuth Tokens

For production testing with real API access:

1. Get OAuth tokens from Twitter and Reddit APIs
2. Create a base64-encoded JSON token:
```bash
echo '{"twitterToken":"YOUR_TWITTER_TOKEN","redditToken":"YOUR_REDDIT_TOKEN"}' | base64
```
3. Set this as the `MCP_SERVER_URL` environment variable and run the test

### Testing Without MCP Client

For basic connectivity testing, you can also test the OAuth metadata endpoint directly:

```bash
curl http://localhost:3000/api/mcp-api/.well-known/oauth-protected-resource
```

This should return JSON with OAuth server information.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard (including MCP OAuth credentials)
3. Enable Redis if using SSE transport
4. Enable Fluid Compute for optimal performance
5. Deploy automatically on push to main branch

The MCP endpoint will be available at `https://your-app.vercel.app/api/mcp/[transport]`

### Docker

\`\`\`bash
# Production build
docker build -t nexa .
docker run -p 3000:3000 nexa
\`\`\`

### Manual Deployment

\`\`\`bash
npm run build
npm start
\`\`\`

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/your-username/nexa/issues)
- 💬 [Discussions](https://github.com/your-username/nexa/discussions)

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
- Optional: Redis for production job queue

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

# Optional
REDIS_URL=redis://localhost:6379
SENTRY_DSN=your_sentry_dsn
JWT_SECRET=your_jwt_secret
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

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

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

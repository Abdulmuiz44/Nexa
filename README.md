Nexa - Autonomous AI Growth Agent
Nexa is a production-ready autonomous AI agent designed for marketing and content creation. It helps businesses scale their marketing efforts through intelligent automation, multi-channel content distribution, and data-driven optimization.

🚀 Live Demo
[Link to the live demo]

✨ Features
Autonomous Campaign Management: Create and manage marketing campaigns with minimal human intervention.
Multi-Channel Content Generation: Generate content optimized for Twitter and Reddit.
Intelligent Scheduling: AI-powered content scheduling based on audience engagement patterns.
Real-time Analytics: Track campaign performance, engagement rates, and ROI.
Modular Architecture: Extensible skill-based system for adding new capabilities.
Production Ready: Built with TypeScript, Next.js, and comprehensive testing.
⚙️ How it Works
The diagram below illustrates the architecture of Nexa:

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
Nexa's architecture is composed of three main components:

Web Dashboard: A Next.js application that provides a user interface for managing campaigns, viewing analytics, and configuring the agent.
API Gateway: A Next.js application that exposes a REST API for interacting with the agent.
Agent Runner: A TypeScript application that runs the agent, executes skills, and interacts with the job queue and LLM wrapper.
🛠️ Tech Stack
Frontend: Next.js, React, Tailwind CSS
Backend: Next.js, TypeScript, Node.js
Database: Supabase
Job Queue: BullMQ, Redis
AI: OpenAI
Testing: Jest, Playwright
Deployment: Docker, Vercel
🏁 Getting Started
Prerequisites
Node.js 18+
npm 8+
Docker (optional)
Installation
Clone the repository:

git clone https://github.com/your-username/nexa.git
cd nexa
Install dependencies:

pnpm install
Set up the environment:

cp .env .env.local
Update the .env.local file with your API keys and configuration.

Run the development server:

npm run dev
Open your browser and navigate to http://localhost:3000.

⚙️ Configuration
The following environment variables can be configured in the .env.local file:

OPENAI_API_KEY: Your OpenAI API key.
DATABASE_URL: The connection string for your PostgreSQL database.
REDIS_URL: The connection string for your Redis server.
NEXTAUTH_URL: The URL of your Next.js application.
NEXTAUTH_SECRET: A secret for NextAuth.js.
📖 Usage
Create a new campaign from the dashboard.
Configure the campaign with your target audience, channels, and content topics.
Start the campaign and monitor its performance from the analytics dashboard.
🧪 Testing
To run the tests, use the following commands:

pnpm run test: Run unit tests.
pnpm run test:watch: Run unit tests in watch mode.
pnpm run test:coverage: Generate a code coverage report.
pnpm run test:e2e: Run end-to-end tests.
🐳 Docker
To build and run the application with Docker, use the following commands:

pnpm run docker:build: Build the Docker image.
pnpm run docker:run: Run the Docker container.
Alternatively, you can use Docker Compose to run the entire stack:

docker-compose up -d
🔗 API Endpoints
The following API endpoints are available:

POST /api/agent/start: Start a new campaign.
GET /api/agent/:id/status: Get the status of an agent.
GET /api/agent/:id/logs: Get the logs of an agent.
POST /api/agent/:id/feedback: Provide feedback to an agent.
GET /api/campaigns: Get all campaigns.
POST /api/campaigns: Create a new campaign.
PUT /api/campaigns/:id: Update a campaign.
DELETE /api/campaigns/:id: Delete a campaign.
GET /api/health: Get the health status of the application.
GET /api/metrics: Get the metrics of the application.
🤝 Contributing
Contributions are welcome! Please read the CONTRIBUTING.md file for more information.

📄 License
This project is licensed under the MIT License. See the LICENSE file for more information.

🆘 Support
If you have any questions or need support, please open an issue on GitHub.
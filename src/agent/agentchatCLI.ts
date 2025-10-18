import readline from "readline";
import dotenv from "dotenv";
import snoowrap from "snoowrap";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// --- Task Types ---
enum TaskType {
  GENERATE = "generate",
  POST_REDDIT = "post_reddit",
}

// --- Simple Metrics ---
const metrics = {
  totalTasks: 0,
  completed: 0,
  failed: 0,
  tokens: 0,
  apiCalls: 0,
};

// --- SimpleSkills ---
class SimpleSkills {
  async execute(type: TaskType, payload: any) {
    switch (type) {
      case TaskType.GENERATE:
        metrics.totalTasks++;
        metrics.tokens += 5;
        metrics.apiCalls++;
        // Simulate generation delay
        await new Promise((r) => setTimeout(r, 1000));
        return `Generated content for query: "${payload.query}"`;
      case TaskType.POST_REDDIT:
        metrics.totalTasks++;
        metrics.apiCalls++;
        try {
          const reddit = new snoowrap({
            userAgent: "nexa-cli-agent",
            clientId: process.env.REDDIT_CLIENT_ID!,
            clientSecret: process.env.REDDIT_CLIENT_SECRET!,
            username: process.env.REDDIT_USERNAME!,
            password: process.env.REDDIT_PASSWORD!,
          });
          const submission = await reddit.getSubreddit(payload.subreddit).submitSelfpost({
            title: payload.title,
            text: payload.content,
          });
          metrics.completed++;
          return `Reddit post successful: ${submission.url}`;
        } catch (err: any) {
          metrics.failed++;
          throw new Error(err.message);
        }
      default:
        throw new Error("Unknown task type");
    }
  }
}

// --- CLI Interface ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "You: ",
});

const skills = new SimpleSkills();

console.log("🚀 Agent started. Type 'help' for commands.");

rl.prompt();

rl.on("line", async (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();

  const [cmd, ...args] = input.split(" ");

  try {
    switch (cmd.toLowerCase()) {
      case "help":
        console.log(`
Commands:
  generate <query>          → Generate content about something
  post reddit <subreddit>   → Post content to Reddit
  metrics                   → Show task metrics
  exit                      → Exit agent
        `);
        break;

      case "generate": {
        const query = args.join(" ");
        if (!query) {
          console.log("Please provide a query.");
          break;
        }
        console.log(`[Agent] Generating content...`);
        const content = await skills.execute(TaskType.GENERATE, { query });
        console.log(content);

        rl.question("Approve content? (y/n): ", async (answer) => {
          if (answer.toLowerCase() === "y") {
            console.log("You approved the content.");
          } else {
            console.log("Content rejected.");
          }
          rl.prompt();
        });
        return; // wait for approval before prompt

      }

      case "post": {
        const platform = args.shift();
        if (platform?.toLowerCase() === "reddit") {
          const subreddit = args.shift();
          const content = args.join(" ");
          if (!subreddit || !content) {
            console.log("Usage: post reddit <subreddit> <content>");
            break;
          }
          console.log(`[Agent] Posting to Reddit...`);
          try {
            const result = await skills.execute(TaskType.POST_REDDIT, {
              subreddit,
              title: `Automated Post ${uuidv4().slice(0, 6)}`,
              content,
            });
            console.log(result);
          } catch (err: any) {
            console.log(`[Task Failed] ${err.message}`);
          }
        } else {
          console.log("Unknown platform. Only 'reddit' is supported in CLI.");
        }
        break;
      }

      case "metrics":
        console.log("=== Agent Live Metrics ===");
        console.log(metrics);
        break;

      case "exit":
        console.log("Exiting agent...");
        process.exit(0);

      default:
        console.log("Unknown command. Type 'help' for commands.");
    }
  } catch (err: any) {
    console.log(`[Error] ${err.message}`);
  }

  rl.prompt();
});

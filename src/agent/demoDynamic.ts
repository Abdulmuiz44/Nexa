import dotenv from "dotenv"
dotenv.config()

import { AgentRunner } from "./runner"
import { TaskType, TaskPriority, SkillResult } from "../types/agent"
import { SkillRegistry, Skill } from "./skills/registry"
import readline from "readline"
import puppeteer, { Browser, Page } from "puppeteer-core"

// --- In-memory Job Queue ---
class SimpleQueue {
  private tasks: any[] = []
  async add(task: any) { this.tasks.push(task) }
  async getNext(): Promise<any | null> { return this.tasks.shift() || null }
}

// --- Mock AgentStore ---
class SimpleStore {
  async loadState() { return {} }
  async saveState(state: any) { console.log("[Store] State saved:", state.status) }
  async deleteState(id: string) { console.log("[Store] Task deleted:", id) }
  async saveTask(task: any) { console.log("[Store] Task saved:", task.id) }
  async loadTask(id: string) { return null }
  async deleteTask(id: string) { console.log("[Store] Task deleted:", id) }
  async listTasks() { return [] }
}

// --- Logger ---
const logger = { info: console.log, error: console.error }

// --- Approval helper ---
const askApproval = (content: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`Approve content? (y/n):\n${content}\n> `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === "y")
    })
  })
}

// --- Puppeteer helpers ---
const launchBrowser = async (): Promise<Browser> => {
  return puppeteer.launch({
    headless: true, // headless for Termux
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
}

const loginReddit = async (page: Page) => {
  await page.goto("https://www.reddit.com/login", { waitUntil: "networkidle2" })
  await page.type("#loginUsername", process.env.REDDIT_USERNAME!)
  await page.type("#loginPassword", process.env.REDDIT_PASSWORD!)
  await page.click("button[type='submit']")
  await page.waitForNavigation({ waitUntil: "networkidle2" })
  console.log("✅ Logged into Reddit web (headless)")
}

const postToRedditWeb = async (browser: Browser, subreddit: string, content: string) => {
  const page = await browser.newPage()
  await page.goto(`https://www.reddit.com/r/${subreddit}/submit`, { waitUntil: "networkidle2" })
  await page.type("textarea", content)
  console.log(`[Reddit] Typed content in /r/${subreddit}`)
  // Optional: uncomment to submit
  // await page.click("button[type='submit']")
}

const loginX = async (page: Page) => {
  await page.goto("https://twitter.com/i/flow/login", { waitUntil: "networkidle2" })
  await page.type('input[name="text"]', process.env.X_USERNAME!)
  await page.keyboard.press("Enter")
  await page.waitForTimeout(2000)
  await page.type('input[name="password"]', process.env.X_PASSWORD!)
  await page.keyboard.press("Enter")
  await page.waitForNavigation({ waitUntil: "networkidle2" })
  console.log("✅ Logged into X web (headless)")
}

const postToXWeb = async (browser: Browser, content: string) => {
  const page = await browser.newPage()
  await page.goto("https://twitter.com/compose/tweet", { waitUntil: "networkidle2" })
  await page.type('div[data-testid="tweetTextarea_0"]', content)
  console.log("[X] Typed content in tweet composer")
  // Optional: uncomment to submit
  // await page.click('div[data-testid="tweetButtonInline"]')
}

// --- Initialize Skill Registry ---
const skillRegistry = new SkillRegistry()

const skillMap: Record<TaskType, (payload: any, browser: Browser) => Promise<string>> = {
  [TaskType.CONTENT_GENERATION]: async (payload) => `Generated content for query: "${payload.query}"`,
  [TaskType.MARKET_RESEARCH]: async (payload) => `Market research for query: "${payload.query}"`,
  [TaskType.SOCIAL_MEDIA_POST]: async (payload) => `Social post: "${payload.content}"`,
}

// Register skills with approval + headless browser posting
Object.entries(skillMap).forEach(([type, func]) => {
  const skill: Skill = {
    name: `Skill for ${type}`,
    description: `Executes task type ${type}`,
    type: type as TaskType,
    execute: async (payload): Promise<SkillResult> => {
      try {
        const browser = await launchBrowser()
        const generated = await func(payload, browser)
        const approved = await askApproval(generated)
        if (!approved) throw new Error("User rejected content")

        if (type === TaskType.SOCIAL_MEDIA_POST) {
          await postToXWeb(browser, payload.content)
        } else if (type === TaskType.MARKET_RESEARCH) {
          await postToRedditWeb(browser, "nexa_demo", generated)
        }

        await browser.close()
        return { success: true, data: generated, metadata: { tokensUsed: 10, apiCalls: 1 } }
      } catch (err: any) {
        console.error("[Skill Error]", err)
        return { success: false, data: null, metadata: { tokensUsed: 0, apiCalls: 1 } }
      }
    },
  }
  skillRegistry.register(skill)
})

// --- Agent Config ---
const config = {
  id: "agent-1",
  name: "Headless Browser Agent",
  description: "Agent with Puppeteer headless automation",
  skills: skillRegistry.getSkillTypes(),
  maxConcurrentTasks: 1,
  timeoutMs: 300000, // 5min
  retryAttempts: 1,
}

// --- Initialize Agent ---
const agent = new AgentRunner(config, skillRegistry, new SimpleStore(), logger, new SimpleQueue())

// --- Events ---
agent.on("started", () => console.log("[Event] Agent started"))
agent.on("taskStarted", (task) => console.log("[Event] Task started:", task.id, task.type))
agent.on("taskCompleted", (task) => console.log("[Event] Task completed successfully", task))
agent.on("taskFailed", (task) => console.log("[Event] Task failed", task))
agent.on("stopped", () => console.log("[Event] Agent stopped"))

// --- Start agent ---
;(async () => {
  await agent.start()

  const initialTasks = [
    { type: TaskType.CONTENT_GENERATION, payload: { query: "Write a blog post" }, priority: TaskPriority.MEDIUM },
    { type: TaskType.MARKET_RESEARCH, payload: { query: "Analyze crypto market" }, priority: TaskPriority.HIGH },
    { type: TaskType.SOCIAL_MEDIA_POST, payload: { content: "Hello world!" }, priority: TaskPriority.MEDIUM },
  ]

  for (const t of initialTasks) {
    await agent.addTask({ ...t, maxRetries: config.retryAttempts })
  }

  // Dynamic tasks every 10s
  const taskTypes = skillRegistry.getSkillTypes()
  let counter = 1
  const dynamicInterval = setInterval(async () => {
    counter++
    const type = taskTypes[counter % taskTypes.length] as TaskType
    const payload =
      type === TaskType.SOCIAL_MEDIA_POST
        ? { content: `Dynamic post #${counter}` }
        : { query: `Dynamic query #${counter}` }
    console.log(`[Dynamic] Adding new task: ${type} - ${JSON.stringify(payload)}`)
    await agent.addTask({ type, payload, priority: TaskPriority.MEDIUM, maxRetries: config.retryAttempts })
  }, 10000)

  // Stop agent after 2 minutes
  setTimeout(async () => {
    clearInterval(dynamicInterval)
    await agent.stop()
  }, 120000)
})()

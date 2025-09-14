import pino from "pino"

export type Logger = pino.Logger

export function createLogger(name: string, level = "info"): Logger {
  return pino({
    name,
    level,
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  })
}

export const logger = createLogger("nexa-agent", process.env.LOG_LEVEL || "info")

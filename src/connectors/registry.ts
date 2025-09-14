import type { BaseConnector, ConnectorConfig } from "./base"
import { TwitterConnector } from "./twitter"
import { LinkedInConnector } from "./linkedin"
import { EmailConnector } from "./email"

export type ConnectorType = "twitter" | "linkedin" | "email"

export class ConnectorRegistry {
  private connectors = new Map<string, BaseConnector>()

  register(name: string, connector: BaseConnector): void {
    this.connectors.set(name, connector)
  }

  get(name: string): BaseConnector | undefined {
    return this.connectors.get(name)
  }

  getAll(): BaseConnector[] {
    return Array.from(this.connectors.values())
  }

  getEnabled(): BaseConnector[] {
    return this.getAll().filter((connector) => connector.isEnabled())
  }

  async initializeConnectors(configs: Record<string, ConnectorConfig>): Promise<void> {
    for (const [name, config] of Object.entries(configs)) {
      if (!config.enabled) continue

      let connector: BaseConnector

      switch (name) {
        case "twitter":
          connector = new TwitterConnector(config)
          break
        case "linkedin":
          connector = new LinkedInConnector(config)
          break
        case "email":
          connector = new EmailConnector(config)
          break
        default:
          console.warn(`Unknown connector type: ${name}`)
          continue
      }

      const authenticated = await connector.authenticate()
      if (authenticated) {
        this.register(name, connector)
        console.log(`[ConnectorRegistry] Initialized ${name} connector`)
      } else {
        console.error(`[ConnectorRegistry] Failed to authenticate ${name} connector`)
      }
    }
  }
}

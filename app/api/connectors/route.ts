import { type NextRequest, NextResponse } from "next/server"
import { ConnectorRegistry } from "@/src/connectors/registry"

const connectorRegistry = new ConnectorRegistry()

export async function GET() {
  try {
    const connectors = connectorRegistry.getAll().map((connector) => ({
      name: connector.getName(),
      enabled: connector.isEnabled(),
    }))

    return NextResponse.json({
      success: true,
      connectors,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to get connectors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { configs } = await request.json()

    await connectorRegistry.initializeConnectors(configs)

    return NextResponse.json({
      success: true,
      message: "Connectors initialized successfully",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to initialize connectors" }, { status: 500 })
  }
}

"use client"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-6">Nexa AI Growth Agent</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Autonomous AI agent that markets your tools through multi-channel campaigns
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <a
              href="/dashboard"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Launch Dashboard
            </a>
            <a
              href="/api-docs"
              className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              API Documentation
            </a>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">Multi-Channel Marketing</h3>
              <p className="text-muted-foreground">Twitter, LinkedIn, Reddit, and more platforms</p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">Content Generation</h3>
              <p className="text-muted-foreground">AI-powered content creation and optimization</p>
            </div>
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">Campaign Analytics</h3>
              <p className="text-muted-foreground">Real-time performance tracking and insights</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, Zap, TrendingUp, Users } from 'lucide-react';

export const metadata = {
  title: 'AI Agents - Nexa',
  description: 'Manage and interact with AI agents for content generation, analytics, and engagement',
};

export default async function AgentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const agents = [
    {
      id: 'content',
      name: 'Content Agent',
      description: 'Generate platform-specific content powered by Mistral AI',
      icon: Sparkles,
      href: '/dashboard/agent-demo',
      status: 'Active',
      capabilities: ['Multi-platform content', 'Tone customization', 'Engagement analysis'],
    },
    {
      id: 'workflow',
      name: 'Workflow Engine',
      description: 'Orchestrate multi-step workflows: Generate → Publish → Analyze',
      icon: Zap,
      href: '/dashboard/workflow-demo',
      status: 'Active',
      capabilities: ['Real-time streaming', 'Auto-publishing', 'Live analytics'],
    },
    {
      id: 'analytics',
      name: 'Analytics Agent',
      description: 'Track performance metrics and engagement insights',
      icon: TrendingUp,
      href: '#',
      status: 'Coming Soon',
      capabilities: ['Performance tracking', 'Trend analysis', 'ROI measurement'],
    },
    {
      id: 'engagement',
      name: 'Engagement Agent',
      description: 'Manage interactions and respond to comments automatically',
      icon: Users,
      href: '#',
      status: 'Coming Soon',
      capabilities: ['Auto-responses', 'Sentiment analysis', 'Community management'],
    },
  ];

  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">AI Agents Hub</h1>
          <p className="text-muted-foreground mt-2">
            Manage and interact with AI agents for content creation, publishing, and analytics
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => {
            const IconComponent = agent.icon;
            const isActive = agent.status === 'Active';

            return (
              <div key={agent.id} className={`p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors ${isActive ? '' : 'opacity-75'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{agent.name}</h3>
                      <div className="text-xs mt-1">
                        {agent.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <span className="h-2 w-2 rounded-full bg-green-600"></span>
                            {agent.status}
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">{agent.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>

                  {/* Capabilities */}
                  <div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Capabilities</div>
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  {isActive ? (
                    <Button asChild className="w-full">
                      <Link href={agent.href}>Launch Agent</Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Start Section */}
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors border-l-4 border-l-blue-500">
          <h3 className="text-lg font-semibold text-base mb-2">Quick Start</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get started with the agent system</p>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-6">1.</span>
              <span>
                Try the <Link href="/dashboard/agent-demo" className="font-semibold text-blue-600 hover:underline">
                  Content Agent
                </Link>{' '}
                to generate platform-specific content
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-6">2.</span>
              <span>
                Use the{' '}
                <Link href="/dashboard/workflow-demo" className="font-semibold text-blue-600 hover:underline">
                  Workflow Engine
                </Link>{' '}
                to automate the entire pipeline
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-6">3.</span>
              <span>Monitor results in the Analytics dashboard</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 min-w-6">4.</span>
              <span>Set up automated workflows in your campaigns</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

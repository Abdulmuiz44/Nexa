import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentAgentUI } from '@/components/agents/ContentAgentUI';

export const metadata = {
  title: 'Content Agent Demo - Nexa',
  description: 'Test the content generation agent',
};

export default async function AgentDemoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Generation Agent</h1>
        <p className="text-muted-foreground mt-2">
          Powered by Mistral AI • Real-time content generation for multiple platforms
        </p>
      </div>

      <ContentAgentUI />
    </div>
  );
}

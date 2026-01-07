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
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Generation Agent</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Powered by Mistral AI • Real-time content generation for multiple platforms
        </p>
      </div>

      <ContentAgentUI />
      </div>
    </div>
  );
}

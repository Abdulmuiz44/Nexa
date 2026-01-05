import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkflowUI } from '@/components/agents/WorkflowUI';

export const metadata = {
  title: 'AI Workflow Demo - Nexa',
  description: 'Test the complete AI workflow with real-time streaming',
};

export default async function WorkflowDemoPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Workflow Engine Demo</h1>
        <p className="text-muted-foreground mt-2">
          Real-time multi-step workflow: Generate → Publish → Analyze
        </p>
      </div>

      <WorkflowUI />
      </div>
    </div>
  );
}

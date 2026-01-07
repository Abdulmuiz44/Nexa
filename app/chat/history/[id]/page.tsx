import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ChatUI from '@/components/ChatUI';

export const metadata = {
  title: 'Chat Conversation - Nexa',
  description: 'View a chat conversation',
};

export default async function ChatConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <ChatUI conversationId={params.id} />
    </div>
  );
}

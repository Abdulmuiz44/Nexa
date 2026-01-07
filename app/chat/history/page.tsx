import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ChatHistoryUI from '@/components/ChatHistoryUI';

export const metadata = {
  title: 'Chat History - Nexa',
  description: 'View and manage your chat conversation history',
};

export default async function ChatHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <ChatHistoryUI />
    </div>
  );
}

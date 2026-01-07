import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ChatUI from '@/components/ChatUI';

export const metadata = {
  title: 'Chat with Nexa - AI Assistant',
  description: 'Chat with Nexa to manage your social media, create content, and execute tasks',
};

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <ChatUI />
    </div>
  );
}

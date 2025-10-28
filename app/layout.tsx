import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { SessionContextProvider } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabaseClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Nexa',
  description: 'Autonomous AI Growth Agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <SessionContextProvider supabaseClient={supabase}>
          {children}
        </SessionContextProvider>
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const links = [
  { href: '/dashboard/chat', label: 'Chat' },
  { href: '/dashboard/campaigns', label: 'Campaigns' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/connections', label: 'Connections' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
    router.push('/auth/login');
  };

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h1 className="text-xl">Nexa</h1>
      </div>
      <nav className="mt-4">
        {links.map(({ href, label }) => (
          <Link key={href} href={href}>
            <div className={`p-4 hover:bg-gray-700 ${pathname === href ? 'bg-gray-700' : ''}`}>
              {label}
            </div>
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <button onClick={handleLogout} className="w-full text-left p-4 hover:bg-gray-700">
          Logout
        </button>
      </div>
    </div>
  );
}

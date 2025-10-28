'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    </div>
  );
}

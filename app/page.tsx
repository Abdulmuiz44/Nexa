'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LandingPage = () => {
const { data: session, status } = useSession();
const router = useRouter();

  useEffect(() => {
if (status === 'loading') return; // Still loading

if (session) {
router.push('/dashboard');
} else {
router.push('/signup');
}
}, [session, status, router]);

if (status === 'loading') {
return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
}

return null; // Will redirect
};

export default LandingPage;
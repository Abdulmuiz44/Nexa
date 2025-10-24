'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import TrustedBy from '@/components/TrustedBy';

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
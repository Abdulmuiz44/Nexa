'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import ContactForm from '@/components/ContactForm';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export default function ContactPage() {
    const handleEmailClick = () => {
        window.location.href = 'mailto:support@nexa.ai';
    };

    const handlePhoneClick = () => {
        window.location.href = 'tel:+1-555-NEXA-123';
    };

    const handleLiveChat = () => {
        alert('Live chat feature coming soon! Available Monday-Friday, 9:00 AM - 5:00 PM EST');
    };

    const handleDocsClick = () => {
        window.location.href = '/docs';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        📧 Get in Touch
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Contact Our Team</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Have questions about Nexa? We're here to help. Send us a message and we'll get back to you within 24 hours.
                    </p>
                </div>
            </section>

            {/* Contact Form & Info */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-12 lg:grid-cols-2">
                        {/* Contact Form */}
                        <div>
                            <h2 className="mb-6 text-2xl font-bold">Send us a message</h2>
                            <ContactForm />
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="mb-6 text-2xl font-bold">Other ways to reach us</h2>
                                <div className="space-y-4">
                                    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer" onClick={handleEmailClick}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                                                <Mail className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="mb-1 font-semibold">Email</h3>
                                                <div className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                                                    support@nexa.ai
                                                </div>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    For general inquiries
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer" onClick={handleLiveChat}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                                                <MessageSquare className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="mb-1 font-semibold cursor-pointer">Live Chat</h3>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    Available Monday-Friday
                                                </p>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    9:00 AM - 5:00 PM EST
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer" onClick={handlePhoneClick}>
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                                                <Phone className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="mb-1 font-semibold">Phone</h3>
                                                <div className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                                                    +1 (555) NEXA-123
                                                </div>
                                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    For enterprise support
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ Link */}
                            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer" onClick={handleDocsClick}>
                                <h3 className="mb-2 text-lg font-semibold">Need quick answers?</h3>
                                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    Check out our documentation and FAQ section for instant help with common questions.
                                </p>
                                <div className="text-sm font-semibold text-black dark:text-white hover:underline cursor-pointer">
                                    View Documentation →
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-6 py-12">
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold mb-4">Nexa</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">AI agent for marketing and content creation.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                                <li><Link href="/#features" className="hover:text-black dark:hover:text-white transition-colors">Features</Link></li>
                                <li><Link href="/#pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing</Link></li>
                                <li><Link href="/docs" className="hover:text-black dark:hover:text-white transition-colors">Documentation</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                                <li><Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">About</Link></li>
                                <li><Link href="/blog" className="hover:text-black dark:hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href="/contact" className="hover:text-black dark:hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                                <li><Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                        <p className="text-gray-600 dark:text-gray-400 text-sm text-center">&copy; 2025 Nexa. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

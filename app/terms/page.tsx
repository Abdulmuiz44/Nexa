'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            <main className="min-h-screen bg-white dark:bg-black">
                {/* Hero */}
                <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                            📜 Terms of Service
                        </div>
                        <h1 className="text-5xl font-bold mb-2">Terms of Service</h1>
                        <p className="text-gray-600 dark:text-gray-400">Last updated: December 2, 2024</p>
                    </div>
                </section>

                <section className="px-6 py-20">
                    <div className="mx-auto max-w-4xl">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Nexa ("the Service"), you accept and agree to be bound by
                            these Terms of Service. If you do not agree to these terms, please do not use the
                            Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            Nexa provides an AI-powered social media automation platform that helps users
                            create, schedule, and publish content across multiple social media platforms. The
                            Service includes content generation, scheduling, analytics, and engagement features.
                        </p>

                        <h2>3. User Accounts</h2>
                        <p>You are responsible for:</p>
                        <ul>
                            <li>Maintaining the security of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Ensuring your account information is accurate and up-to-date</li>
                            <li>Notifying us immediately of any unauthorized access</li>
                        </ul>

                        <h2>4. Acceptable Use</h2>
                        <p>You agree NOT to use the Service to:</p>
                        <ul>
                            <li>Violate any laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Publish spam, malicious content, or misinformation</li>
                            <li>Harass, abuse, or harm others</li>
                            <li>Interfere with the Service's operation</li>
                            <li>Attempt to gain unauthorized access to systems</li>
                        </ul>

                        <h2>5. Content and Intellectual Property</h2>
                        <p>
                            You retain all rights to content you create using the Service. By using the
                            Service, you grant us a license to host, store, and display your content as
                            necessary to provide the Service.
                        </p>
                        <p>
                            All Service features, functionality, and intellectual property are owned by Nexa
                            and protected by copyright, trademark, and other laws.
                        </p>

                        <h2>6. AI-Generated Content</h2>
                        <p>
                            Our Service uses AI to generate content. While we strive for accuracy, you are
                            responsible for reviewing and approving all content before publication. We are not
                            liable for any issues arising from AI-generated content.
                        </p>

                        <h2>7. Third-Party Integrations</h2>
                        <p>
                            The Service integrates with third-party platforms (Twitter/X, Reddit, LinkedIn,
                            etc.). Your use of these integrations is subject to their respective terms of
                            service and privacy policies.
                        </p>

                        <h2>8. Payment Terms</h2>
                        <p>
                            Paid subscriptions are billed in advance on a monthly or annual basis. You
                            authorize us to charge your payment method for applicable fees. Refunds are
                            provided at our discretion.
                        </p>

                        <h2>9. Cancellation and Termination</h2>
                        <p>
                            You may cancel your subscription at any time. We reserve the right to suspend or
                            terminate your account if you violate these Terms or engage in fraudulent activity.
                        </p>

                        <h2>10. Disclaimer of Warranties</h2>
                        <p>
                            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                            WE DO NOT GUARANTEE UNINTERRUPTED, SECURE, OR ERROR-FREE OPERATION.
                        </p>

                        <h2>11. Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEXA SHALL NOT BE LIABLE FOR ANY INDIRECT,
                            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF
                            THE SERVICE.
                        </p>

                        <h2>12. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. Continued use of the
                            Service after changes constitutes acceptance of the modified Terms.
                        </p>

                        <h2>13. Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of [Your Jurisdiction], without regard to
                            conflict of law principles.
                        </p>

                        <h2>14. Contact Information</h2>
                        <p>
                            For questions about these Terms, contact us at{' '}
                            <a href="mailto:legal@nexa.ai">legal@nexa.ai</a>.
                        </p>
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
            </main>
        </div>
    );
}

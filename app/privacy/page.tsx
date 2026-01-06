'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            <main className="min-h-screen bg-white dark:bg-black">
                {/* Hero */}
                <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                            🔒 Privacy Policy
                        </div>
                        <h1 className="text-5xl font-bold mb-2">Privacy Policy</h1>
                        <p className="text-gray-600 dark:text-gray-400">Last updated: December 2, 2024</p>
                    </div>
                </section>

                <section className="px-6 py-20">
                    <div className="mx-auto max-w-4xl">
                        <h2>1. Information We Collect</h2>
                        <p>
                            We collect information that you provide directly to us when you create an account,
                            use our services, or communicate with us. This includes:
                        </p>
                        <ul>
                            <li>Account information (name, email address, password)</li>
                            <li>Profile information and business details</li>
                            <li>Social media account connection data</li>
                            <li>Content you create through our platform</li>
                            <li>Payment and billing information</li>
                            <li>Communications with our support team</li>
                        </ul>

                        <h2>2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process your transactions and send related information</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                            <li>Monitor and analyze trends and usage</li>
                            <li>Detect, prevent, and address technical issues</li>
                        </ul>

                        <h2>3. Information Sharing and Disclosure</h2>
                        <p>
                            We do not sell, trade, or rent your personal information to third parties. We may
                            share your information in the following circumstances:
                        </p>
                        <ul>
                            <li>With your consent or at your direction</li>
                            <li>With service providers who assist in our operations</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and prevent fraud</li>
                        </ul>

                        <h2>4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your
                            personal information against unauthorized access, alteration, disclosure, or
                            destruction. However, no internet transmission is ever fully secure.
                        </p>

                        <h2>5. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Object to processing of your information</li>
                            <li>Export your data</li>
                            <li>Withdraw consent at any time</li>
                        </ul>

                        <h2 id="cookies">6. Cookies and Tracking Technologies</h2>
                        <p>
                            We use cookies and similar tracking technologies to track activity on our service
                            and hold certain information. You can instruct your browser to refuse all cookies
                            or to indicate when a cookie is being sent.
                        </p>

                        <h2>7. Data Retention</h2>
                        <p>
                            We retain your personal information for as long as necessary to provide our
                            services, comply with legal obligations, resolve disputes, and enforce our
                            agreements.
                        </p>

                        <h2>8. International Data Transfers</h2>
                        <p>
                            Your information may be transferred to and maintained on computers located outside
                            of your state, province, country, or other governmental jurisdiction where data
                            protection laws may differ.
                        </p>

                        <h2>9. Children's Privacy</h2>
                        <p>
                            Our service is not intended for children under 13. We do not knowingly collect
                            personal information from children under 13.
                        </p>

                        <h2>10. Changes to This Policy</h2>
                        <p>
                            We may update our Privacy Policy from time to time. We will notify you of any
                            changes by posting the new Privacy Policy on this page and updating the "Last
                            updated" date.
                        </p>

                        <h2>11. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at{' '}
                            <a href="mailto:privacy@nexa.ai">privacy@nexa.ai</a>.
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

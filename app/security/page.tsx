'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

export default function SecurityPage() {
    const handleSecurityEmail = () => {
        window.location.href = 'mailto:security@nexa.ai';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navigation />

            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block mb-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-sm font-medium">
                        🔐 Security
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Enterprise-Grade Security</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Your data security and privacy are our top priorities. Learn about the measures we take to protect your information.
                    </p>
                </div>
            </section>

            {/* Security Features */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Lock,
                                title: "End-to-End Encryption",
                                description: "All data transmitted to and from Nexa is encrypted using industry-standard TLS 1.3 protocol. Your content and credentials are always protected.",
                            },
                            {
                                icon: Key,
                                title: "Secure Authentication",
                                description: "We use OAuth 2.0 for social media connections and support two-factor authentication (2FA) for added account security.",
                            },
                            {
                                icon: Shield,
                                title: "Data Protection",
                                description: "Your data is stored in secure, SOC 2 compliant data centers with regular backups and disaster recovery procedures.",
                            },
                            {
                                icon: Eye,
                                title: "Privacy First",
                                description: "We never sell your data. Your content and analytics are private and only accessible to you and authorized team members.",
                            },
                            {
                                icon: AlertTriangle,
                                title: "Threat Monitoring",
                                description: "24/7 security monitoring and automated threat detection systems protect against unauthorized access attempts.",
                            },
                            {
                                icon: CheckCircle,
                                title: "Compliance",
                                description: "We maintain compliance with GDPR, CCPA, and other data protection regulations to ensure your privacy rights.",
                            },
                        ].map((feature, idx) => (
                            <div key={idx} className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Practices */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20 bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-4xl font-bold mb-12 text-center">Our Security Practices</h2>
                    <div className="space-y-6">
                        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                            <h3 className="mb-3 text-xl font-semibold">Infrastructure Security</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• Hosted on enterprise-grade cloud infrastructure</li>
                                <li>• Regular security audits and penetration testing</li>
                                <li>• Automated security patch management</li>
                                <li>• DDoS protection and rate limiting</li>
                            </ul>
                        </div>

                        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                            <h3 className="mb-3 text-xl font-semibold">Access Control</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• Role-based access control (RBAC)</li>
                                <li>• Principle of least privilege</li>
                                <li>• Audit logs for all administrative actions</li>
                                <li>• Secure password requirements</li>
                            </ul>
                        </div>

                        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
                            <h3 className="mb-3 text-xl font-semibold">Data Handling</h3>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                                <li>• Encryption at rest and in transit</li>
                                <li>• Regular automated backups</li>
                                <li>• Secure data deletion procedures</li>
                                <li>• Geographic data residency options</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Incident Response */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20">
                <div className="mx-auto max-w-4xl">
                    <h2 className="text-4xl font-bold mb-12 text-center">Incident Response</h2>
                    <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <p className="mb-4 text-lg">
                            In the unlikely event of a security incident, we have a comprehensive response plan to:
                        </p>
                        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                            <li>• Immediately contain and investigate the incident</li>
                            <li>• Notify affected users within 72 hours</li>
                            <li>• Coordinate with relevant authorities as required</li>
                            <li>• Implement corrective measures to prevent recurrence</li>
                            <li>• Provide transparent post-incident reports</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="border-b border-gray-200 dark:border-gray-800 px-6 py-20 bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer" onClick={handleSecurityEmail}>
                        <h3 className="mb-2 text-2xl font-semibold">Security Questions?</h3>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                            If you have security concerns or wish to report a vulnerability, please contact our security team.
                        </p>
                        <div className="font-semibold text-black dark:text-white hover:underline cursor-pointer">
                            security@nexa.ai
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

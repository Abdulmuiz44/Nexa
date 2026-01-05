import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

'use client';

export default function SecurityPage() {
    const handleSecurityEmail = () => {
        window.location.href = 'mailto:security@nexa.ai';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navbar />
            <main className="min-h-screen bg-white dark:bg-black pt-24">
                <PageHeader
                    badge="🔐 Security"
                    title="Enterprise-Grade Security"
                    description="Your data security and privacy are our top priorities. Learn about the measures we take to protect your information."
                />

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <div className="mx-auto max-w-5xl">
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                                <Card key={idx} className="p-6">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </Card>
                            ))}
                        </div>

                        {/* Security Practices */}
                        <div className="mt-16">
                            <h2 className="mb-8 text-3xl font-bold">Our Security Practices</h2>
                            <div className="space-y-6">
                                <Card className="p-6">
                                    <h3 className="mb-3 text-xl font-semibold">Infrastructure Security</h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li>• Hosted on enterprise-grade cloud infrastructure</li>
                                        <li>• Regular security audits and penetration testing</li>
                                        <li>• Automated security patch management</li>
                                        <li>• DDoS protection and rate limiting</li>
                                    </ul>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="mb-3 text-xl font-semibold">Access Control</h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li>• Role-based access control (RBAC)</li>
                                        <li>• Principle of least privilege</li>
                                        <li>• Audit logs for all administrative actions</li>
                                        <li>• Secure password requirements</li>
                                    </ul>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="mb-3 text-xl font-semibold">Data Handling</h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li>• Encryption at rest and in transit</li>
                                        <li>• Regular automated backups</li>
                                        <li>• Secure data deletion procedures</li>
                                        <li>• Geographic data residency options</li>
                                    </ul>
                                </Card>
                            </div>
                        </div>

                        {/* Incident Response */}
                        <div className="mt-16">
                            <h2 className="mb-8 text-3xl font-bold">Incident Response</h2>
                            <Card className="p-8">
                                <p className="mb-4 text-lg">
                                    In the unlikely event of a security incident, we have a comprehensive response
                                    plan to:
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>• Immediately contain and investigate the incident</li>
                                    <li>• Notify affected users within 72 hours</li>
                                    <li>• Coordinate with relevant authorities as required</li>
                                    <li>• Implement corrective measures to prevent recurrence</li>
                                    <li>• Provide transparent post-incident reports</li>
                                </ul>
                            </Card>
                        </div>

                        {/* Contact */}
                         <div className="mt-16 text-center">
                             <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleSecurityEmail}>
                                 <h3 className="mb-2 text-xl font-semibold">Security Questions?</h3>
                                 <p className="mb-4 text-muted-foreground">
                                     If you have security concerns or wish to report a vulnerability, please contact
                                     our security team.
                                 </p>
                                 <div className="font-semibold text-primary hover:underline cursor-pointer">
                                     security@nexa.ai
                                 </div>
                             </Card>
                         </div>
                    </div>
                </section>

                <Footer />
            </main>
        </div>
    );
}

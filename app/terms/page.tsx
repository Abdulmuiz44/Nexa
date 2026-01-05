import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
            <Navbar />
            <main className="min-h-screen bg-white dark:bg-black pt-24">
                <PageHeader
                    badge="📜 Terms of Service"
                    title="Terms of Service"
                    description="Last updated: December 2, 2024"
                />

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <div className="mx-auto max-w-4xl prose prose-invert">
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

                <Footer />
            </main>
        </div>
    );
}

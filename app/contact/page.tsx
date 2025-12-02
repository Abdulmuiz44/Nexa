import PageHeader from '@/components/PageHeader';
import ContactForm from '@/components/ContactForm';
import { Card } from '@/components/ui/card';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function ContactPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background pt-24">
                <PageHeader
                    badge="📧 Get in Touch"
                    title="Contact Our Team"
                    description="Have questions about Nexa? We're here to help. Send us a message and we'll get back to you within 24 hours."
                />

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <div className="grid gap-12 lg:grid-cols-2">
                        {/* Contact Form */}
                        <div>
                            <h2 className="mb-6 text-2xl font-bold">Send us a message</h2>
                            <ContactForm />
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="mb-6 text-2xl font-bold">Other ways to reach us</h2>
                                <div className="space-y-6">
                                    <Card className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Mail className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="mb-1 font-semibold">Email</h3>
                                                <a
                                                    href="mailto:support@nexa.ai"
                                                    className="text-muted-foreground hover:text-primary"
                                                >
                                                    support@nexa.ai
                                                </a>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    For general inquiries
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <MessageSquare className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="mb-1 font-semibold">Live Chat</h3>
                                                <p className="text-muted-foreground">
                                                    Available Monday-Friday
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    9:00 AM - 5:00 PM EST
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Phone className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="mb-1 font-semibold">Phone</h3>
                                                <a
                                                    href="tel:+1-555-NEXA-123"
                                                    className="text-muted-foreground hover:text-primary"
                                                >
                                                    +1 (555) NEXA-123
                                                </a>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    For enterprise support
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* FAQ Link */}
                            <Card className="bg-secondary/30 p-6">
                                <h3 className="mb-2 text-lg font-semibold">Need quick answers?</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Check out our documentation and FAQ section for instant help with common questions.
                                </p>
                                <a
                                    href="/docs"
                                    className="text-sm font-semibold text-primary hover:underline"
                                >
                                    View Documentation →
                                </a>
                            </Card>
                        </div>
                    </div>
                </section>

                <Footer />
            </main>
        </>
    );
}

'use client';

import PageHeader from '@/components/PageHeader';
import ContactForm from '@/components/ContactForm';
import { Card } from '@/components/ui/card';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

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
            <Navbar />
            <main className="min-h-screen bg-white dark:bg-black pt-24">
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
                                    <Card className="p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors" onClick={handleEmailClick}>
                                         <div className="flex items-start gap-4">
                                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                 <Mail className="h-6 w-6" />
                                             </div>
                                             <div>
                                                 <h3 className="mb-1 font-semibold">Email</h3>
                                                 <div className="text-muted-foreground hover:text-primary">
                                                     support@nexa.ai
                                                 </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    For general inquiries
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors" onClick={handleLiveChat}>
                                         <div className="flex items-start gap-4">
                                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                 <MessageSquare className="h-6 w-6" />
                                             </div>
                                             <div>
                                                 <h3 className="mb-1 font-semibold cursor-pointer">Live Chat</h3>
                                                 <p className="text-muted-foreground">
                                                     Available Monday-Friday
                                                 </p>
                                                 <p className="mt-1 text-sm text-muted-foreground">
                                                     9:00 AM - 5:00 PM EST
                                                 </p>
                                             </div>
                                         </div>
                                     </Card>

                                    <Card className="p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors" onClick={handlePhoneClick}>
                                         <div className="flex items-start gap-4">
                                             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                 <Phone className="h-6 w-6" />
                                             </div>
                                             <div>
                                                 <h3 className="mb-1 font-semibold">Phone</h3>
                                                 <div className="text-muted-foreground hover:text-primary">
                                                     +1 (555) NEXA-123
                                                 </div>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    For enterprise support
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* FAQ Link */}
                            <Card className="bg-secondary/30 p-6 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" onClick={handleDocsClick}>
                                <h3 className="mb-2 text-lg font-semibold">Need quick answers?</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Check out our documentation and FAQ section for instant help with common questions.
                                </p>
                                <div className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                                    View Documentation →
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

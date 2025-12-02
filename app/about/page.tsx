import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function AboutPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background pt-24">
                <PageHeader
                    badge="🚀 Our Story"
                    title="Building the Future of Social Media Marketing"
                    description="Nexa was born from a simple observation: founders and marketers spend too much time on social media with too little results."
                />

                <section className="container mx-auto px-4 py-20 sm:px-6">
                    <div className="mx-auto max-w-4xl space-y-16">
                        {/* Mission */}
                        <div>
                            <h2 className="mb-4 text-3xl font-bold">Our Mission</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                We believe that every startup and business deserves to have a world-class social media presence without dedicating countless hours to manual posting and engagement. Our mission is to democratize social media marketing through AI automation, allowing founders and teams to focus on what they do best: building great products.
                            </p>
                        </div>

                        {/* Story */}
                        <div>
                            <h2 className="mb-4 text-3xl font-bold">How We Started</h2>
                            <p className="mb-4 text-lg text-muted-foreground leading-relaxed">
                                After launching multiple SaaS products and spending 15+ hours weekly on social media with minimal results, our founders knew there had to be a better way. They assembled a team of AI researchers, growth marketers, and engineers to build Nexa—an autonomous AI agent that handles everything from content creation to community engagement.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Today, Nexa helps over 500 companies automate their social media growth, saving thousands of hours and driving real business results.
                            </p>
                        </div>

                        {/* Values */}
                        <div>
                            <h2 className="mb-6 text-3xl font-bold">Our Values</h2>
                            <div className="grid gap-6 sm:grid-cols-2">
                                {[
                                    {
                                        title: "Automation First",
                                        description: "We believe in automating repetitive tasks so humans can focus on creativity and strategy."
                                    },
                                    {
                                        title: "Transparency",
                                        description: "Clear pricing, honest metrics, and complete control over your content."
                                    },
                                    {
                                        title: "Innovation",
                                        description: "Leveraging cutting-edge AI technology to solve real marketing challenges."
                                    },
                                    {
                                        title: "Customer Success",
                                        description: "Your growth is our success. We're committed to delivering real, measurable results."
                                    },
                                ].map((value, idx) => (
                                    <Card key={idx} className="p-6">
                                        <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
                                        <p className="text-muted-foreground">{value.description}</p>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Team */}
                        <div>
                            <h2 className="mb-4 text-3xl font-bold">Meet the Team</h2>
                            <p className="mb-8 text-lg text-muted-foreground">
                                We're a distributed team of engineers, designers, and growth experts passionate about making social media marketing accessible to everyone.
                            </p>
                            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 text-center">
                                <h3 className="mb-2 text-xl font-semibold">Want to join us?</h3>
                                <p className="mb-4 text-muted-foreground">
                                    We're always looking for talented people who share our vision.
                                </p>
                                <a
                                    href="mailto:careers@nexa.ai"
                                    className="font-semibold text-primary hover:underline"
                                >
                                    View Open Positions →
                                </a>
                            </Card>
                        </div>

                        {/* Stats */}
                        <div>
                            <h2 className="mb-6 text-3xl font-bold">By the Numbers</h2>
                            <div className="grid gap-6 sm:grid-cols-3">
                                {[
                                    { label: "Active Users", value: "500+" },
                                    { label: "Posts Published", value: "12,500+" },
                                    { label: "Hours Saved", value: "7,500+" },
                                ].map((stat, idx) => (
                                    <Card key={idx} className="p-6 text-center">
                                        <div className="mb-2 text-4xl font-bold text-primary">{stat.value}</div>
                                        <div className="text-muted-foreground">{stat.label}</div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </main>
        </>
    );
}

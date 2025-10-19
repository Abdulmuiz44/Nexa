import { Bot, Calendar, MessageSquare, BarChart3, Zap, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Bot,
    title: "AI Content Generation",
    description: "Creates engaging posts, tweets, and replies in multiple tones — educational, casual, or promotional.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Automatically posts at optimal times for maximum reach and engagement across all platforms.",
  },
  {
    icon: MessageSquare,
    title: "Auto-Engagement",
    description: "Replies to comments, mentions, and relevant discussions to build relationships and drive traffic.",
  },
  {
    icon: Target,
    title: "Smart Targeting",
    description: "Identifies trending subreddits, hashtags, and communities where your audience hangs out.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track impressions, engagement, clicks, and growth with beautiful real-time charts.",
  },
  {
    icon: Zap,
    title: "Campaign Mode",
    description: "Run automated multi-post campaigns for launches, updates, or special promotions.",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      
      <div className="container relative z-10 px-6 mx-auto">
        <div className="text-center mb-16 flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your Growth Team,
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent"> Automated</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Nexa handles every aspect of your social media growth strategy with intelligent automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card 
              key={idx} 
              className="p-6 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-neon"
            >
              <div className="relative inline-flex p-3 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
                <div className="absolute inset-0 blur-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
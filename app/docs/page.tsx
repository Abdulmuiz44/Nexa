import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, TrendingUp, Settings } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="flex-1 p-6 min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Help & Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            Everything you need to know about using Nexa for your social media management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">1. Complete Your Profile</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up your business information and brand preferences
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">2. Connect Social Accounts</h4>
                  <p className="text-sm text-muted-foreground">
                    Link your Twitter/X and Reddit accounts for automated posting
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">3. Chat with Nexa</h4>
                  <p className="text-sm text-muted-foreground">
                    Ask our AI assistant to create content and manage campaigns
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Campaign Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Schedule posts and track performance across platforms
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Analytics & Reporting</h4>
                  <p className="text-sm text-muted-foreground">
                    View detailed engagement metrics and growth trends
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">AI-Powered Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate optimized posts matching your brand voice
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">How does Nexa generate content?</h4>
                <p className="text-sm text-muted-foreground">
                  Nexa uses advanced AI models to create content tailored to your brand voice, target audience, and platform requirements. Simply chat with our AI assistant and specify what you need.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Can I schedule posts in advance?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! Use the Campaigns section to create and schedule posts. Nexa will automatically publish them at your specified times across connected platforms.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">What social platforms are supported?</h4>
                <p className="text-sm text-muted-foreground">
                  Currently supported: Twitter/X and Reddit. We're continuously adding more platforms. Connect your accounts in the Connections section.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">How do credits work?</h4>
                <p className="text-sm text-muted-foreground">
                  Credits are used for AI content generation, posting, and analytics. View your usage in the Billing section and top up when needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

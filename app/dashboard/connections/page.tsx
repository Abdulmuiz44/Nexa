import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Twitter, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";

export default function ConnectionsPage() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts to enable automated posting
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Twitter/X Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Twitter className="h-5 w-5 text-white" />
                </div>
                Twitter / X
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Connected</span>
                <Badge variant="secondary">@nexa_ai</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your Twitter/X account is connected and ready for automated posting.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
                <Button variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reddit Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                Reddit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Reddit account to enable automated posting to subreddits.
              </p>
              <Button>
                Connect Reddit Account
              </Button>
            </CardContent>
          </Card>

          {/* LinkedIn Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">in</span>
                </div>
                LinkedIn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                LinkedIn integration is currently in development.
              </p>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Instagram Connection */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IG</span>
                </div>
                Instagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Instagram API integration is planned for future updates.
              </p>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status Summary */}
        <Card className="mt-8 p-6">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500 mb-1">1</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500 mb-1">1</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 mb-1">2</div>
                <div className="text-sm text-muted-foreground">Coming Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500 mb-1">4</div>
                <div className="text-sm text-muted-foreground">Total Platforms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

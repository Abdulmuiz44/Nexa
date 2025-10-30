import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, MessageSquare, Heart, Share } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your social media performance and engagement metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">2,847</div>
            <div className="text-sm text-muted-foreground">Total Followers</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">156</div>
            <div className="text-sm text-muted-foreground">Posts This Month</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-5 w-5 text-red-500" />
              <Badge variant="secondary" className="text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -3%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">4,231</div>
            <div className="text-sm text-muted-foreground">Total Engagement</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Share className="h-5 w-5 text-purple-500" />
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15%
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">89</div>
            <div className="text-sm text-muted-foreground">Shares/Retweets</div>
          </Card>
        </div>

        {/* Platform Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">Twitter/X</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">68%</div>
                  <div className="text-sm text-muted-foreground">of engagement</div>
                </div>
              </div>
              <Progress value={68} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="font-medium">Reddit</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">32%</div>
                  <div className="text-sm text-muted-foreground">of engagement</div>
                </div>
              </div>
              <Progress value={32} className="h-2" />
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Educational Posts</span>
                  <span className="font-medium">42%</span>
                </div>
                <Progress value={42} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Product Updates</span>
                  <span className="font-medium">28%</span>
                </div>
                <Progress value={28} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm">Industry News</span>
                  <span className="font-medium">30%</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts Performance */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Recent Posts Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Exciting new feature announcement...</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Twitter/X</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold">127</div>
                      <div className="text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">23</div>
                      <div className="text-muted-foreground">Replies</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">45</div>
                      <div className="text-muted-foreground">Retweets</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

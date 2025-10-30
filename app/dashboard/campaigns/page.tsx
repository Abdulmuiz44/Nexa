import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Manage and schedule your social media campaigns
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Campaign Cards */}
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Content Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Automated weekly posts about industry trends
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Active</span>
                </div>
                <span>12 posts scheduled</span>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Product Launch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Multi-platform campaign for new feature release
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Draft</span>
                </div>
                <span>8 posts planned</span>
              </div>
            </CardContent>
          </Card>

          <Card className="p-6 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Campaign</h3>
              <p className="text-sm text-muted-foreground text-center">
                Set up automated posting schedules and content strategies
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

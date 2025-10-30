import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Plus, Crown, Zap } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Billing & Credits</h1>
          <p className="text-muted-foreground mt-2">
            Manage your credits and subscription plan
          </p>
        </div>

        {/* Current Plan */}
        <Card className="p-6 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Growth Plan</h3>
                <p className="text-muted-foreground">$29/month</p>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credits used this month</span>
                <span>247 / 500</span>
              </div>
              <Progress value={49.4} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Credit Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Credit Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">253</div>
              <p className="text-sm text-muted-foreground mb-4">
                Credits remaining this month
              </p>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Buy More Credits
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/26</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Credit Usage Breakdown */}
        <Card className="p-6 mb-8">
          <CardHeader>
            <CardTitle>Credit Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Content Generation</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">145 credits</div>
                  <div className="text-sm text-muted-foreground">58% of usage</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Social Media Posts</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">67 credits</div>
                  <div className="text-sm text-muted-foreground">27% of usage</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Analytics & Reports</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">35 credits</div>
                  <div className="text-sm text-muted-foreground">14% of usage</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>AI Agent Interactions</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">12 credits</div>
                  <div className="text-sm text-muted-foreground">5% of usage</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Growth Plan - Monthly</p>
                  <p className="text-sm text-muted-foreground">October 1, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$29.00</p>
                  <Badge className="bg-green-500">Paid</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Extra Credits - 100 pack</p>
                  <p className="text-sm text-muted-foreground">September 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$4.99</p>
                  <Badge className="bg-green-500">Paid</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Growth Plan - Monthly</p>
                  <p className="text-sm text-muted-foreground">September 1, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$29.00</p>
                  <Badge className="bg-green-500">Paid</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

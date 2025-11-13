"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Plus, TrendingUp, CheckCircle, Clock, Target, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  platform: 'twitter' | 'reddit';
  variants: ABVariant[];
  winner?: string; // variant ID
  startDate?: string;
  endDate?: string;
  totalImpressions: number;
  totalEngagements: number;
  created_at: string;
}

interface ABVariant {
  id: string;
  content: string;
  headline?: string;
  hashtags?: string[];
  impressions: number;
  engagements: number;
  engagementRate: number;
  isWinner?: boolean;
}

interface ABTestingProps {
  userId: string;
}

export function ABTesting({ userId }: ABTestingProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [userId]);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/experiments/ab-tests');
      const data = await response.json();
      if (data.tests) {
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async (testData: any) => {
    setCreating(true);
    try {
      const response = await fetch('/api/experiments/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testData, userId }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchTests();
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Failed to create A/B test:', error);
    } finally {
      setCreating(false);
    }
  };

  const stopTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/experiments/ab-tests/${testId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchTests();
      }
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            A/B Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            A/B Testing
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New A/B Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create A/B Test</DialogTitle>
              </DialogHeader>
              <CreateABTestForm onSubmit={createTest} loading={creating} />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          Test different content variations to optimize your social media performance
        </p>
      </CardHeader>
      <CardContent>
        {tests.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No A/B tests yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first A/B test to compare different content variations and find what works best.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Test
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="active" className="w-full">
              <TabsList>
                <TabsTrigger value="active">
                  Active ({tests.filter(t => t.status === 'running').length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({tests.filter(t => t.status === 'completed').length})
                </TabsTrigger>
                <TabsTrigger value="all">All ({tests.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {tests.filter(t => t.status === 'running').map((test) => (
                  <ABTestCard
                    key={test.id}
                    test={test}
                    onStop={() => stopTest(test.id)}
                    onView={() => setSelectedTest(test)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {tests.filter(t => t.status === 'completed').map((test) => (
                  <ABTestCard
                    key={test.id}
                    test={test}
                    onView={() => setSelectedTest(test)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {tests.map((test) => (
                  <ABTestCard
                    key={test.id}
                    test={test}
                    onStop={test.status === 'running' ? () => stopTest(test.id) : undefined}
                    onView={() => setSelectedTest(test)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Test Details Dialog */}
        {selectedTest && (
          <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {selectedTest.name}
                  <Badge className={getStatusColor(selectedTest.status)}>
                    {selectedTest.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <ABTestDetails test={selectedTest} />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

function ABTestCard({ test, onStop, onView }: {
  test: ABTest;
  onStop?: () => void;
  onView: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={onView}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium">{test.name}</h4>
            <Badge className={getStatusColor(test.status)}>
              {test.status}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {test.platform}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground">{test.variants.length}</div>
              <div>Variants</div>
            </div>
            <div>
              <div className="font-medium text-foreground">{test.totalImpressions.toLocaleString()}</div>
              <div>Impressions</div>
            </div>
            <div>
              <div className="font-medium text-foreground">{test.totalEngagements.toLocaleString()}</div>
              <div>Engagements</div>
            </div>
          </div>

          {test.winner && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Winner: Variant {test.winner}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onStop && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onStop(); }}>
              Stop Test
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ABTestDetails({ test }: { test: ABTest }) {
  const maxEngagement = Math.max(...test.variants.map(v => v.engagementRate));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{test.variants.length}</div>
          <div className="text-sm text-muted-foreground">Variants Tested</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{test.totalImpressions.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Impressions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{test.totalEngagements.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Engagements</div>
        </Card>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Variant Performance</h4>
        {test.variants.map((variant, index) => (
          <Card key={variant.id} className={`p-4 ${variant.isWinner ? 'border-green-500 bg-green-50/50' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                {variant.isWinner && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Winner
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{variant.engagementRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">engagement rate</div>
              </div>
            </div>

            <p className="text-sm mb-3">{variant.content}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{variant.impressions.toLocaleString()}</div>
                <div className="text-muted-foreground">Impressions</div>
              </div>
              <div>
                <div className="font-medium">{variant.engagements.toLocaleString()}</div>
                <div className="text-muted-foreground">Engagements</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Performance</span>
                <span>{variant.engagementRate.toFixed(1)}%</span>
              </div>
              <Progress value={(variant.engagementRate / maxEngagement) * 100} className="h-2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateABTestForm({ onSubmit, loading }: {
  onSubmit: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    platform: 'twitter' as 'twitter' | 'reddit',
    variants: [
      { content: '', headline: '' },
      { content: '', headline: '' },
    ],
  });

  const addVariant = () => {
    if (formData.variants.length < 5) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, { content: '', headline: '' }],
      }));
    }
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="test-name">Test Name</Label>
        <Input
          id="test-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Headline Optimization Test"
          required
        />
      </div>

      <div>
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={formData.platform}
          onValueChange={(value: 'twitter' | 'reddit') =>
            setFormData(prev => ({ ...prev, platform: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="reddit">Reddit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Content Variants</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            disabled={formData.variants.length >= 5}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Variant
          </Button>
        </div>

        <div className="space-y-3">
          {formData.variants.map((variant, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <Label className="text-sm font-medium">Variant {index + 1}</Label>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="Headline (optional)"
                  value={variant.headline}
                  onChange={(e) => updateVariant(index, 'headline', e.target.value)}
                />
                <Textarea
                  placeholder="Content..."
                  value={variant.content}
                  onChange={(e) => updateVariant(index, 'content', e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create A/B Test'}
        </Button>
      </div>
    </form>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState<any>(null);

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const res = await fetch('/api/experiments?action=list', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setExperiments(data.experiments || []);
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeExperiment = async (expId: string) => {
    try {
      const res = await fetch(`/api/experiments?action=analyze&experiment_id=${expId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setSelectedExp(data.results);
    } catch (error) {
      console.error('Error analyzing experiment:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading experiments...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Growth Experiments</h1>
        <p className="text-muted-foreground">
          Run A/B tests to optimize your content strategy
        </p>
      </div>

      {/* Experiment List */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {experiments.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No experiments yet. Create your first experiment to start optimizing!
              </p>
            </CardContent>
          </Card>
        ) : (
          experiments.map((exp) => (
            <Card key={exp.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{exp.name}</CardTitle>
                    <CardDescription className="mt-1">{exp.description}</CardDescription>
                  </div>
                  <Badge variant={
                    exp.status === 'running' ? 'default' :
                    exp.status === 'completed' ? 'secondary' : 
                    'outline'
                  }>
                    {exp.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{exp.experiment_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variants:</span>
                    <span className="font-medium">{exp.test_variants.length + 1}</span>
                  </div>
                  {exp.winner_variant_index !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Winner:</span>
                      <span className="font-medium">Variant {exp.winner_variant_index}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => analyzeExperiment(exp.id)}
                  variant="outline"
                  className="w-full mt-4"
                >
                  View Results
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selected Experiment Results */}
      {selectedExp && (
        <Card>
          <CardHeader>
            <CardTitle>Experiment Results: {selectedExp.experiment.name}</CardTitle>
            <CardDescription>
              Statistical significance: {(selectedExp.statistical_significance * 100).toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recommendation */}
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-medium mb-2">💡 Recommendation:</p>
                <p>{selectedExp.recommendation}</p>
              </div>

              {/* Variants Performance */}
              <div className="space-y-2">
                <h3 className="font-medium">Variant Performance:</h3>
                {selectedExp.variants.map((variant: any, idx: number) => (
                  <div key={variant.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{variant.variant_name}</h4>
                      {selectedExp.winner?.variant.id === variant.id && (
                        <Badge>Winner</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Posts</p>
                        <p className="font-medium">{variant.posts_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-medium">{variant.total_impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Engagements</p>
                        <p className="font-medium">{variant.total_engagements.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Eng. Rate</p>
                        <p className="font-medium">{(variant.avg_engagement_rate * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedExp.winner && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    🎉 Winner improves performance by {selectedExp.winner.improvement_percentage.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

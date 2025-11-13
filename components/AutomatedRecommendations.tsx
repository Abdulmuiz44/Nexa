"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle, Clock, Target, TrendingUp, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface Recommendation {
  id: string;
  type: 'content' | 'timing' | 'strategy' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  timeToImplement: string;
  confidence: number; // 0-100
  implemented: boolean;
  implementedAt?: string;
}

interface AutomatedRecommendationsProps {
  userId: string;
}

export function AutomatedRecommendations({ userId }: AutomatedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [implementing, setImplementing] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/analytics/recommendations');
      const data = await response.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const implementRecommendation = async (recommendationId: string) => {
    setImplementing(recommendationId);
    try {
      const response = await fetch(`/api/analytics/recommendations/${recommendationId}/implement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.success) {
        // Update the recommendation as implemented
        setRecommendations(prev =>
          prev.map(rec =>
            rec.id === recommendationId
              ? { ...rec, implemented: true, implementedAt: new Date().toISOString() }
              : rec
          )
        );
      }
    } catch (error) {
      console.error('Failed to implement recommendation:', error);
    } finally {
      setImplementing(null);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'content': return Lightbulb;
      case 'timing': return Clock;
      case 'strategy': return Target;
      case 'optimization': return TrendingUp;
      default: return Zap;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const pendingRecommendations = recommendations.filter(r => !r.implemented);
  const implementedRecommendations = recommendations.filter(r => r.implemented);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
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
            <Lightbulb className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <Button
            onClick={fetchRecommendations}
            variant="outline"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Automated insights to optimize your social media strategy
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground">
              Generate recommendations based on your posting history and performance data.
            </p>
          </div>
        ) : (
          <>
            {/* Pending Recommendations */}
            {pendingRecommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Action Items ({pendingRecommendations.length})
                </h3>
                <div className="space-y-4">
                  {pendingRecommendations.map((rec) => {
                    const IconComponent = getRecommendationIcon(rec.type);
                    return (
                      <div key={rec.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{rec.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getPriorityColor(rec.priority)}>
                                  {rec.priority} priority
                                </Badge>
                                <Badge variant="outline">
                                  {rec.confidence}% confidence
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="h-3 w-3" />
                              {rec.timeToImplement}
                            </div>
                            <div className="text-green-600 font-medium">
                              +{rec.expectedImpact}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          {rec.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Expected impact: {rec.expectedImpact}
                          </div>
                          <Button
                            onClick={() => implementRecommendation(rec.id)}
                            disabled={implementing === rec.id}
                            size="sm"
                          >
                            {implementing === rec.id ? (
                              <>Implementing...</>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Implement
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Implemented Recommendations */}
            {implementedRecommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Implemented ({implementedRecommendations.length})
                </h3>
                <div className="space-y-3">
                  {implementedRecommendations.map((rec) => {
                    const IconComponent = getRecommendationIcon(rec.type);
                    return (
                      <div key={rec.id} className="border rounded-lg p-3 bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800 dark:text-green-200">{rec.title}</h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Implemented {rec.implementedAt ? new Date(rec.implementedAt).toLocaleDateString() : 'recently'}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            +{rec.expectedImpact}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const steps = [
  { title: 'Business Info', description: 'Tell us about your business' },
  { title: 'Promotion Goals', description: 'What do you want to achieve?' },
  { title: 'Brand Voice', description: 'Define your communication style' },
];
const businessTypes = ['SaaS', 'AI Tool', 'Agency', 'Freelancer', 'Other'];
const promotionGoals = ['Generate awareness', 'Get more signups', 'Grow community', 'Launch a new feature'];
const postingFrequencies = ['Daily', 'Weekly', 'Custom'];
const brandTones = ['Friendly', 'Professional', 'Bold', 'Fun', 'Chill'];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    websiteUrl: '',
    promotionGoals: [] as string[],
    postingFrequency: '',
    brandTone: '',
    sampleCaption: '',
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      if (status !== 'authenticated') {
        setInitializing(false);
        return;
      }

      try {
        const response = await fetch('/api/onboarding', { method: 'GET' });
        if (!response.ok) {
          throw new Error('Failed to load onboarding data');
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        if (data.status === 'onboarding_complete' || data.status === 'active' || data.status === 'agent_active') {
          router.replace('/chat');
          return;
        }

        if (data.onboarding_data) {
          setFormData((prev) => ({
            ...prev,
            businessName: data.onboarding_data.business_name ?? '',
            businessType: data.onboarding_data.business_type ?? '',
            websiteUrl: data.onboarding_data.website_url ?? '',
            promotionGoals: Array.isArray(data.onboarding_data.promotion_goals)
              ? data.onboarding_data.promotion_goals
              : [],
            postingFrequency: data.onboarding_data.posting_frequency ?? '',
            brandTone: data.onboarding_data.brand_tone ?? '',
            sampleCaption: data.onboarding_data.sample_caption ?? '',
          }));
        }
      } catch (error) {
        console.error('Onboarding preload error:', error);
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    preload();

    return () => {
      cancelled = true;
    };
  }, [session, status, router]);

  const validateStep = (step: number) => {
    switch (step) {
      case 0:
        if (!formData.businessName.trim()) {
          setErrorMessage('Please enter your business or product name.');
          return false;
        }
        if (!formData.businessType) {
          setErrorMessage('Select the type of business you operate.');
          return false;
        }
        return true;
      case 1:
        if (!formData.promotionGoals.length) {
          setErrorMessage('Choose at least one growth goal for Nexa to prioritize.');
          return false;
        }
        if (!formData.postingFrequency) {
          setErrorMessage('Decide how frequently Nexa should post on your behalf.');
          return false;
        }
        return true;
      case 2:
        if (!formData.brandTone) {
          setErrorMessage('Select the tone that best represents your brand.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    setErrorMessage('');
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Force a full page reload to ensure session is updated
        window.location.href = '/chat';
      } else {
        setErrorMessage(responseData.error || 'Unknown error');
      }
    } catch (error) {
      setErrorMessage('Network error occurred while saving onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business / Product Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                placeholder="e.g., My Awesome SaaS"
                required
              />
            </div>
            <div>
              <Label htmlFor="businessType">Type of business</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, businessType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="websiteUrl">Website or Product URL (optional)</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>What do you want Nexa to help you with? (select all that apply)</Label>
              <div className="space-y-2">
                {promotionGoals.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.promotionGoals.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => ({ ...prev, promotionGoals: [...prev.promotionGoals, goal] }));
                        } else {
                          setFormData((prev) => ({ ...prev, promotionGoals: prev.promotionGoals.filter((g) => g !== goal) }));
                        }
                      }}
                    />
                    <Label htmlFor={goal}>{goal}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="postingFrequency">How often do you want Nexa to post?</Label>
              <Select
                value={formData.postingFrequency}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, postingFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {postingFrequencies.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="brandTone">Describe your preferred tone</Label>
              <Select
                value={formData.brandTone}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, brandTone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {brandTones.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sampleCaption">Add a short sample caption or post style (optional)</Label>
              <Textarea
                id="sampleCaption"
                value={formData.sampleCaption}
                onChange={(e) => setFormData((prev) => ({ ...prev, sampleCaption: e.target.value }))}
                placeholder="e.g., Excited to share our latest feature!"
                rows={3}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (status === 'loading' || initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Preparing your onboarding experience...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">You need to be logged in to access this page.</p>
          <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-4 text-center">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <p className="text-muted-foreground">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}
          {errorMessage && (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
              {errorMessage}
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0 || loading}>
              Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Finish Onboarding'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

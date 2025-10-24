'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/pricing');
      } else {
        const errorData = await response.json();
        alert(`Error saving onboarding data: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error saving onboarding data');
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
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="e.g., My Awesome SaaS"
                required
              />
            </div>
            <div>
              <Label htmlFor="businessType">Type of business</Label>
              <Select value={formData.businessType} onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="websiteUrl">Website or Product URL (optional)</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
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
                {promotionGoals.map(goal => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.promotionGoals.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, promotionGoals: [...prev.promotionGoals, goal] }));
                        } else {
                          setFormData(prev => ({ ...prev, promotionGoals: prev.promotionGoals.filter(g => g !== goal) }));
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
              <Select value={formData.postingFrequency} onValueChange={(value) => setFormData(prev => ({ ...prev, postingFrequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {postingFrequencies.map(freq => <SelectItem key={freq} value={freq}>{freq}</SelectItem>)}
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
              <Select value={formData.brandTone} onValueChange={(value) => setFormData(prev => ({ ...prev, brandTone: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {brandTones.map(tone => <SelectItem key={tone} value={tone}>{tone}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sampleCaption">Add a short sample caption or post style (optional)</Label>
              <Textarea
                id="sampleCaption"
                value={formData.sampleCaption}
                onChange={(e) => setFormData(prev => ({ ...prev, sampleCaption: e.target.value }))}
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="text-center mb-4">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <p className="text-muted-foreground">Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
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

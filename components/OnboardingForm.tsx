'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Twitter, Linkedin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/db';

const OnboardingForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    brandVoice: '',
    contentPillars: '',
    targetAudience: '',
    twitter: '',
    linkedin: '',
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleFinish = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from('onboarding').insert([{
        user_id: user.id,
        company_name: formData.companyName,
        brand_voice: formData.brandVoice,
        content_pillars: formData.contentPillars,
        target_audience: formData.targetAudience,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
      }]);

      if (error) {
        console.error('Error saving onboarding data:', error);
      } else {
        router.push('/pricing');
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Welcome to Nexa!</h2>
            <p className="text-muted-foreground mb-8">Let's get your AI growth agent set up.</p>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g., SaaS Co."
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Brand Voice & Tone</h2>
            <p className="text-muted-foreground mb-8">Define the personality of your AI agent.</p>
            <Select name="brandVoice" onValueChange={(value) => handleSelectChange('brandVoice', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a brand voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
                <SelectItem value="professional">Professional & Authoritative</SelectItem>
                <SelectItem value="witty">Witty & Humorous</SelectItem>
                <SelectItem value="informative">Informative & Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Content Pillars</h2>
            <p className="text-muted-foreground mb-8">What topics should your AI post about? (comma-separated)</p>
            <Textarea
              name="contentPillars"
              value={formData.contentPillars}
              onChange={handleChange}
              placeholder="e.g., AI, Marketing, SaaS, Growth Hacking"
            />
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Target Audience</h2>
            <p className="text-muted-foreground mb-8">Describe your ideal customer.</p>
            <Textarea
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleChange}
              placeholder="e.g., Early-stage startup founders, marketing managers at tech companies"
            />
          </div>
        );
      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Socials</h2>
            <p className="text-muted-foreground mb-8">Connect your social media accounts to get started.</p>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Twitter className="h-6 w-6 text-sky-500" />
                <Input
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="@your_handle"
                />
              </div>
              <div className="flex items-center gap-2">
                <Linkedin className="h-6 w-6 text-blue-600" />
                <Input
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="/in/your-profile"
                />
              </div>
            </div>
          </div>
        );
      case 6:
        return <div>Payment Step</div>;
      default:
        return <div>Done!</div>;
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Onboarding</CardTitle>
      </CardHeader>
      <CardContent>
        {renderStep()}
        <div className="flex justify-between mt-8">
          {step > 1 && <Button variant="outline" onClick={prevStep}>Back</Button>}
          {step < 6 && <Button onClick={nextStep}>Next</Button>}
          {step === 6 && <Button onClick={handleFinish}>Choose Plan & Pay</Button>}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingForm;

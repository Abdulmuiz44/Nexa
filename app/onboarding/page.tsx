'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const steps = ['business', 'description', 'goals', 'platforms'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    businessName: '',
    description: '',
    goals: [] as string[],
    platforms: [] as string[],
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/auth/login');
    };
    checkAuth();
  }, [router]);

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('users')
      .update({ onboarding_data: data })
      .eq('id', session.user.id);

    if (error) {
      alert(error.message);
    } else {
      router.push('/pricing-intro');
    }
  };

  const updateData = (key: string, value: any) => {
    setData({ ...data, [key]: value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow max-w-md">
        <h1 className="text-2xl mb-4">Onboarding</h1>
        {step === 0 && (
          <div>
            <label>Business Name</label>
            <input
              type="text"
              value={data.businessName}
              onChange={(e) => updateData('businessName', e.target.value)}
              className="w-full p-2 mb-4 border"
            />
          </div>
        )}
        {step === 1 && (
          <div>
            <label>Description</label>
            <textarea
              value={data.description}
              onChange={(e) => updateData('description', e.target.value)}
              className="w-full p-2 mb-4 border"
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <label>Goals (select all that apply)</label>
            <div className="mb-4">
              {['Increase brand awareness', 'Drive traffic', 'Generate leads'].map((goal) => (
                <label key={goal} className="block">
                  <input
                    type="checkbox"
                    checked={data.goals.includes(goal)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateData('goals', [...data.goals, goal]);
                      } else {
                        updateData('goals', data.goals.filter(g => g !== goal));
                      }
                    }}
                  />
                  {goal}
                </label>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <label>Target Platforms</label>
            <div className="mb-4">
              {['Twitter', 'Reddit'].map((platform) => (
                <label key={platform} className="block">
                  <input
                    type="checkbox"
                    checked={data.platforms.includes(platform)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateData('platforms', [...data.platforms, platform]);
                      } else {
                        updateData('platforms', data.platforms.filter(p => p !== platform));
                      }
                    }}
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between">
          {step > 0 && <button onClick={handlePrev} className="bg-gray-500 text-white p-2">Prev</button>}
          {step < steps.length - 1 ? (
            <button onClick={handleNext} className="bg-blue-500 text-white p-2">Next</button>
          ) : (
            <button onClick={handleSubmit} className="bg-green-500 text-white p-2">Submit</button>
          )}
        </div>
      </div>
    </div>
  );
}

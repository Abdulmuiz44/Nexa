'use client';

import { useRouter } from 'next/navigation';

const tiers = [
  { name: 'Growth', credits: 1000, price: '$10' },
  { name: 'Scale', credits: 5000, price: '$45' },
  { name: 'Enterprise', credits: 10000, price: '$85' },
];

export default function PricingIntroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl mb-8">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div key={tier.name} className="bg-white p-6 rounded shadow">
            <h2 className="text-xl mb-2">{tier.name}</h2>
            <p className="mb-2">{tier.credits} Credits</p>
            <p className="mb-4">{tier.price}</p>
            <button className="bg-blue-500 text-white p-2 w-full">Select</button>
          </div>
        ))}
      </div>
      <button onClick={() => router.push('/dashboard')} className="mt-8 bg-gray-500 text-white p-2">
        Skip for now
      </button>
    </div>
  );
}

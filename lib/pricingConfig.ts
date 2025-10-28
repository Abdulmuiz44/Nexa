export const plans = {
  free: {
    name: 'Free',
    price: 0,
    credits: 100,
    features: ['Basic chat', 'Posting to connected platforms'],
  },
  growth: {
    name: 'Growth',
    price: 49,
    credits: 5000,
    features: ['Advanced analytics', 'Priority support'],
  },
  scale: {
    name: 'Scale',
    price: 149,
    credits: 20000,
    features: ['Campaign automation', 'Bulk posting'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    credits: 100000,
    features: ['Dedicated agent', 'API access', 'White-label'],
  },
};

export const creditPrices = {
  1000: 10, // $10 for 1000 credits
  5000: 45,
  10000: 85,
};

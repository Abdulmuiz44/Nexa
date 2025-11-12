// Feature flags for the application
export const FEATURES = {
  // Platform connectors
  TWITTER_CONNECTOR: process.env.NEXT_PUBLIC_ENABLE_TWITTER !== 'false',
  REDDIT_CONNECTOR: process.env.NEXT_PUBLIC_ENABLE_REDDIT !== 'false',
  LINKEDIN_CONNECTOR: process.env.NEXT_PUBLIC_ENABLE_LINKEDIN === 'true',
  EMAIL_CONNECTOR: process.env.NEXT_PUBLIC_ENABLE_EMAIL === 'true',

  // AI features
  CONTENT_GENERATION: process.env.NEXT_PUBLIC_ENABLE_CONTENT_GEN !== 'false',
  AUTONOMOUS_AGENT: process.env.NEXT_PUBLIC_ENABLE_AUTONOMOUS_AGENT !== 'false',
  ANALYTICS_LEARNING: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_LEARNING !== 'false',

  // Approval workflows
  CONTENT_APPROVALS: process.env.NEXT_PUBLIC_ENABLE_APPROVALS !== 'false',
  DRAFT_WORKFLOW: process.env.NEXT_PUBLIC_ENABLE_DRAFTS !== 'false',

  // Engagement features
  AUTO_ENGAGEMENT: process.env.NEXT_PUBLIC_ENABLE_AUTO_ENGAGEMENT !== 'false',
  ENGAGEMENT_DISCOVERY: process.env.NEXT_PUBLIC_ENABLE_ENGAGEMENT_DISCOVERY !== 'false',

  // Advanced features
  BULK_SCHEDULING: process.env.NEXT_PUBLIC_ENABLE_BULK_SCHEDULING !== 'false',
  ADVANCED_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS !== 'false',
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature];
}

export function getEnabledFeatures(): FeatureFlag[] {
  return Object.keys(FEATURES).filter(key => FEATURES[key as FeatureFlag]) as FeatureFlag[];
}

export function getDisabledFeatures(): FeatureFlag[] {
  return Object.keys(FEATURES).filter(key => !FEATURES[key as FeatureFlag]) as FeatureFlag[];
}

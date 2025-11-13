import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { FEATURES } from '@/src/lib/features';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    // Simple query to test database connectivity
    const { data, error } = await supabaseServer
      .from('users')
      .select('count')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return {
      service: 'Database (Supabase)',
      status: 'healthy',
      message: 'Database connection successful',
    };
  } catch (error: any) {
    return {
      service: 'Database (Supabase)',
      status: 'error',
      message: 'Database connection failed',
      details: error.message,
    };
  }
}

async function checkOpenAI(): Promise<HealthCheckResult> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        service: 'OpenAI',
        status: 'error',
        message: 'OPENAI_API_KEY not configured',
      };
    }

    if (!apiKey.startsWith('sk-')) {
      return {
        service: 'OpenAI',
        status: 'warning',
        message: 'OPENAI_API_KEY format looks incorrect',
      };
    }

    // Note: We don't make actual API calls here to avoid rate limits
    return {
      service: 'OpenAI',
      status: 'healthy',
      message: 'API key configured',
    };
  } catch (error: any) {
    return {
      service: 'OpenAI',
      status: 'error',
      message: 'OpenAI check failed',
      details: error.message,
    };
  }
}

async function checkComposio(): Promise<HealthCheckResult> {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      return {
        service: 'Composio',
        status: 'error',
        message: 'COMPOSIO_API_KEY not configured',
      };
    }

    return {
      service: 'Composio',
      status: 'healthy',
      message: 'API key configured',
    };
  } catch (error: any) {
    return {
      service: 'Composio',
      status: 'error',
      message: 'Composio check failed',
      details: error.message,
    };
  }
}

async function checkFlutterwave(): Promise<HealthCheckResult> {
  try {
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return {
        service: 'Flutterwave',
        status: 'error',
        message: 'Flutterwave keys not configured',
      };
    }

    return {
      service: 'Flutterwave',
      status: 'healthy',
      message: 'API keys configured',
    };
  } catch (error: any) {
    return {
      service: 'Flutterwave',
      status: 'error',
      message: 'Flutterwave check failed',
      details: error.message,
    };
  }
}

async function checkNextAuth(): Promise<HealthCheckResult> {
  try {
    const url = process.env.NEXTAUTH_URL;
    const secret = process.env.NEXTAUTH_SECRET;

    if (!url) {
      return {
        service: 'NextAuth',
        status: 'warning',
        message: 'NEXTAUTH_URL not configured',
      };
    }

    if (!secret) {
      return {
        service: 'NextAuth',
        status: 'error',
        message: 'NEXTAUTH_SECRET not configured',
      };
    }

    return {
      service: 'NextAuth',
      status: 'healthy',
      message: 'Configuration valid',
    };
  } catch (error: any) {
    return {
      service: 'NextAuth',
      status: 'error',
      message: 'NextAuth check failed',
      details: error.message,
    };
  }
}

async function checkFeatureFlags(): Promise<HealthCheckResult> {
  try {
    const disabledFeatures = Object.entries(FEATURES)
      .filter(([_, enabled]) => !enabled)
      .map(([feature, _]) => feature);

    if (disabledFeatures.length > 0) {
      return {
        service: 'Feature Flags',
        status: 'warning',
        message: `${disabledFeatures.length} features disabled`,
        details: disabledFeatures,
      };
    }

    return {
      service: 'Feature Flags',
      status: 'healthy',
      message: 'All features enabled',
    };
  } catch (error: any) {
    return {
      service: 'Feature Flags',
      status: 'error',
      message: 'Feature flag check failed',
      details: error.message,
    };
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run all health checks
    const checks = await Promise.all([
      checkDatabase(),
      checkOpenAI(),
      checkComposio(),
      checkFlutterwave(),
      checkNextAuth(),
      checkFeatureFlags(),
    ]);

    // Calculate overall status
    const hasErrors = checks.some(check => check.status === 'error');
    const hasWarnings = checks.some(check => check.status === 'warning');

    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    if (hasErrors) overallStatus = 'error';
    else if (hasWarnings) overallStatus = 'warning';

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(c => c.status === 'healthy').length,
        warnings: checks.filter(c => c.status === 'warning').length,
        errors: checks.filter(c => c.status === 'error').length,
      },
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}

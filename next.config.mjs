import dotenv from 'dotenv-extended';

dotenv.load();

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config) => {
    config.cache = false;
    config.watchOptions = {
      ignored: ['**/node_modules', '**/.git', '**/.next', '/', '/data/data', '/data'],
    };
    return config;
  },
}

export default nextConfig
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
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  },
  webpack: (config) => {
    config.cache = false;
    config.watchOptions = {
      ignored: ['/data/data', '/data', '/'],
    };
    return config;
  },
}

export default nextConfig
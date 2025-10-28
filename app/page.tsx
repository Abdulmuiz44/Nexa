"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Nexa</h1>
        <p className="text-xl text-gray-600 mb-8">Your AI Growth Agent is ready 🚀</p>
        <div className="space-x-4">
          <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
            Get Started
          </Link>
          <Link href="/auth/login" className="bg-gray-200 text-gray-900 px-6 py-3 rounded-md hover:bg-gray-300">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

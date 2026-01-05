'use client';

import Link from 'next/link';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Nexa
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 items-center">
            <Link href="/#features" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              Blog
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="px-6 py-4 space-y-3 flex flex-col">
              <Link
                href="/#features"
                onClick={closeMenu}
                className="block py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                onClick={closeMenu}
                className="block py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                onClick={closeMenu}
                className="block py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/blog"
                onClick={closeMenu}
                className="block py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/about"
                onClick={closeMenu}
                className="block py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="block py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Contact
              </Link>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 space-y-3">
                <Link
                  href="/auth/signin"
                  onClick={closeMenu}
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={closeMenu}
                  className="block w-full px-4 py-2 text-center text-sm font-medium text-white dark:text-black bg-black dark:bg-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}

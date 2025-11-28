'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/pageheader';
import InputBox from '@/components/ui/inputboxes';
import Button from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Check for success message from signup
    const message = searchParams.get('message');
    if (message) {
      // Schedule setState asynchronously to avoid cascading renders
      Promise.resolve().then(() => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 5000);
        // Store timer in ref if you want to clear it on unmount
      });
    }
    // Optionally, clear message on unmount
    return () => setSuccessMessage('');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      alert('Login successful! (This is just a demo - no backend connected yet)');
      window.location.href = '/dashboard';
    }, 2000);
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign in clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <PageHeader 
            title="Welcome back!"
            subtitle="Welcome back! Let's pick up right where you left off and dive back in."
            centered={false}
          />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message Display */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Email Input */}
          <InputBox
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password Input */}
          <InputBox
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPasswordToggle={true}
            required
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-md border-2 transition-all ${
                  rememberMe 
                    ? 'bg-orange-500 border-orange-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {rememberMe && (
                    <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                Remember me
              </span>
            </label>
            
            <Link 
              href="/forgot-password" 
              className="text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-colors font-medium"
            >
              Forgot password
            </Link>
          </div>

          {/* Sign In Button */}
          <Button 
            type="submit" 
            fullWidth 
            size="lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button 
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleGoogleSignIn}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Sign Up Link */}
          <div className="text-center pt-6">
            <p className="text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
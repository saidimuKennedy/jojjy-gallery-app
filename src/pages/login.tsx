import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext'; 
import { Brush } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth(); 
  const router = useRouter();

  // If already logged in, redirect to home
  // This is a basic redirect; for more robust, consider server-side checks or useEffect
  if (user) {
    router.push('/');
    return null; // Don't render login page if already logged in
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const errorMessage = await login(email, password);

    if (errorMessage) {
      setError(errorMessage);
    } else {
      // Login successful, AuthContext's user state is updated,
      // and the `if (user)` check above will trigger redirect.
      // You can also explicitly push here if not using the above check:
      // router.push('/');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>Login - Njenga Ngugi</title>
      </Head>
      <div className="min-h-screen bg-white flex">
        {/* Left side - Visual element */}
        <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-center items-center px-16">
          <div className="text-white text-center">
            <div className="mb-8">
              <Brush className="w-24 h-24 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
              <p className="text-xl text-gray-300 max-w-md">
                Sign in to continue your journey with us and access your account.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-black mb-2">
                Sign In
              </h1>
              <p className="text-gray-600 text-lg">
                Access your account and continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 px-6 text-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200 uppercase tracking-wide"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-black font-semibold hover:underline">
                  Create one here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
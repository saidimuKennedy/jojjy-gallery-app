import React, { useState, useEffect } from 'react'; // Added useEffect
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react'; // CHANGED: Import useSession and signIn
import { Brush } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // CHANGED: Use useSession directly
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already logged in (authenticated session)
  useEffect(() => {
    if (status === "authenticated") {
      router.push('/');
    }
  }, [status, router]); // Dependency array includes status and router

  // Don't render anything while session status is loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 animate-spin rounded-full"></div>
      </div>
    );
  }

  // If already authenticated, return null as useEffect will handle redirect
  if (status === "authenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // CHANGED: Use signIn from next-auth/react
    const result = await signIn('credentials', {
      redirect: false, // Prevent NextAuth.js from redirecting automatically
      email,
      password,
    });

    if (result?.error) {
      setError(result.error); // Display error message from NextAuth.js
    } else {
      // If no error, sign-in was successful.
      // NextAuth.js updates the session, and the useEffect above will handle the redirect.
      // Alternatively, you could explicitly push here if you don't rely on useEffect:
      router.push('/');
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
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Palette } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Registration successful! You can now log in.');
        // Optionally clear form fields
        setUsername('');
        setEmail('');
        setPassword('');
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error("Registration API call failed:", err);
      setError('Network error or server unavailable. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - Njenga Ngugi</title>
      </Head>
      <div className="min-h-screen bg-white flex">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-black mb-2">
                Create Account
              </h1>
              <p className="text-gray-600 text-lg">
                Join us today and get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg"
                  placeholder="Enter your username"
                />
              </div>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg"
                  placeholder="Create a password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <p className="text-green-800 text-sm font-medium">{successMessage}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 px-6 text-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200 uppercase tracking-wide"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="text-black font-semibold hover:underline">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Visual element */}
        <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-center items-center px-16">
          <div className="text-white text-center">
            <div className="mb-8">
              <Palette className='w-24 h-24 mx-auto mb-6' />
              <h2 className="text-4xl font-bold mb-4">Welcome</h2>
              <p className="text-xl text-gray-300 max-w-md">
                Create your account and join our community of innovators and creators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import { Brush, X } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl =
        typeof router.query.callbackUrl === "string"
          ? router.query.callbackUrl
          : "/";
      router.push(callbackUrl);
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 animate-spin rounded-full"></div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const callbackUrl =
      typeof router.query.callbackUrl === "string"
        ? router.query.callbackUrl
        : "/";

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push(callbackUrl);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>Login - Njenga Ngugi</title>
      </Head>
      <div className="min-h-screen bg-white flex relative">
        <Link
          href="/"
          className="absolute top-0 right-0 z-20 flex h-12 w-12 items-center justify-center border-l border-b border-black bg-black text-white transition-colors hover:bg-white hover:text-black lg:h-14 lg:w-14"
          aria-label="Close and return to site"
        >
          <X className="h-5 w-5 stroke-[1.5]" />
        </Link>

        <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between px-16 py-12">
          <Link
            href="/"
            className="text-sm tracking-wide text-white/60 transition-colors hover:text-white"
          >
            ← Njenga Ngugi
          </Link>
          <div className="text-white text-center">
            <Brush className="w-24 h-24 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
            <p className="text-xl text-gray-300 max-w-md mx-auto">
              Sign in to continue your journey with us and access your account.
            </p>
          </div>
          <div aria-hidden className="h-5" />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 pt-16">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <Link
                href="/"
                className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900 lg:hidden"
              >
                ← Back to site
              </Link>
              <h1 className="text-4xl font-bold text-black mb-2">Sign In</h1>
              <p className="text-gray-600 text-lg">
                Access your account and continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-black mb-2 uppercase tracking-wide"
                >
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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-black mb-2 uppercase tracking-wide"
                >
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
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center space-y-3">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-black font-semibold hover:underline"
                >
                  Create one here
                </Link>
              </p>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

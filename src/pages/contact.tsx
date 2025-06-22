import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '@/components/ui/Navbar'; // Assuming you want Navbar on all pages
import Footer from '@/components/ui/Footer'; // Assuming you want Footer on all pages
import { Mails, PhoneCall } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage(null);

    // Basic client-side validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setErrorMessage('Please fill in all fields.');
      setStatus('error');
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success or failure
    const isSuccess = Math.random() > 0.2; // 80% chance of success for demo

    if (isSuccess) {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
      alert('Your message has been sent successfully!'); // Use alert for now, replace with a custom modal/toast
    } else {
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again later.');
    }
  };

  return (
    <>
      <Head>
        <title>Contact - Njenga Ngugi</title>
        <meta name="description" content="Get in touch with Njenga Ngugi for inquiries, commissions, or collaborations." />
      </Head>
      <main className="min-h-screen bg-white">
        <Navbar />
        
        {/* Hero Section */}
        <div className="bg-black py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Have a question, a commission request, or just want to say hello? Fill out the form below, and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg"
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg"
                  placeholder="What's this about?"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-lg resize-none"
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-800 text-sm font-medium">{errorMessage}</p>
                </div>
              )}
              
              {status === 'success' && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <p className="text-green-800 text-sm font-medium">Thank you for your message! We will get back to you soon.</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-black text-white py-4 px-6 text-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200 uppercase tracking-wide"
                >
                  {status === 'loading' ? 'Sending Message...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4">
                Other Ways to Reach Us
              </h2>
              <p className="text-gray-600 text-lg">
                Prefer direct contact? Here are additional ways to get in touch.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <Mails className="w-16 h-16 mx-auto mb-4 " color='black'/>
                </div>
                <h3 className="text-xl font-semibold text-black mb-2 lowercase tracking-wide">email</h3>
                <p className="text-gray-600 text-lg">info@njengangugi.com</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <PhoneCall className="w-16 h-16 mx-auto mb-4 " color='black'/>
                </div>
                <h3 className="text-xl font-semibold text-black mb-2 lowercase tracking-wide">phone</h3>
                <p className="text-gray-600 text-lg">+254-712-345-67</p>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
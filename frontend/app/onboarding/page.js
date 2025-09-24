'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  
  // All navigation logic is now inside a useEffect hook.
  useEffect(() => {
    // If the session has loaded and the user is unauthenticated, redirect to login.
    if (status === "unauthenticated") {
      router.push('/login');
    }

    // Pre-fill the name field if available from Google.
    if (status === 'authenticated' && session?.user?.name) {
      setName(session.user.name);
    }
  }, [status, session, router]); // The hook re-runs if these dependencies change.

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    // ... (rest of the submit function is unchanged and correct)
    if (!session) {
      setMessage({ text: 'Authentication error. Please log in again.', type: 'error' });
      setLoading(false);
      return;
    }
    const token = session.accessToken;
    try {
      const response = await fetch('http://localhost:5000/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ name, username }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: 'Onboarding successful! Redirecting...', type: 'success' });
        await update({ ...session, user: { ...session.user, name, username, onboarded: 1 } });
        setTimeout(() => { router.push('/profile'); }, 1500);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // While the session is loading, we show a loading screen.
  // This prevents the redirect logic from running prematurely.
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading session...
      </div>
    );
  }

  // Only render the main component if the user is authenticated.
  // The useEffect will handle redirecting unauthenticated users.
  if (status === "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 max-w-sm w-full">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Complete Your Profile</h1>
          <p className="text-gray-400 mb-6 text-center">Please provide a few more details to get started.</p>
          {message.text && (<div className={`p-3 rounded-lg text-center mb-4 text-white ${message.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>{message.text}</div>)}
          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-gray-300">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-md" disabled={loading}>
              {loading ? "Saving..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If status is "unauthenticated", this will briefly show while useEffect redirects.
  return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Redirecting...</div>;
}
'use client'

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    // This hook now correctly handles all redirection logic.
    if (status !== 'loading') {
      if (status === 'authenticated') {
        // If logged in but NOT onboarded, redirect.
        if (session.user?.onboarded === false) {
          router.push('/onboarding');
        }
      } else {
        // If not logged in at all, redirect to login.
        router.push('/login');
      }
    }
  }, [status, session, router]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    const token = session?.accessToken;
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: data.message, type: 'success' });
        setOldPassword('');
        setNewPassword('');
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // While loading or before redirection occurs, show a loading screen.
  if (status === "loading" || (status === "authenticated" && session.user?.onboarded === false)) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  // Only render the profile if the user is fully authenticated and onboarded.
  if (status === "authenticated" && session.user?.onboarded === true) {
    return (
      <div className="relative min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="absolute top-4 right-4 bg-red-600 text-white font-semibold py-2 px-5 rounded-xl hover:bg-red-700">
          Sign Out
        </button>
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 max-w-sm w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white">{session.user.name}</h2>
            <p className="text-gray-400">@{session.user.username}</p>
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
          {message.text && (<div className={`p-3 rounded-lg text-center mb-4 text-white ${message.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>{message.text}</div>)}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-gray-300">Old Password</label>
              <div className="relative">
                <input type={showOldPassword ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">{showOldPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <div>
              <label className="block text-gray-300">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">{showNewPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-md" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Fallback for unauthenticated users while the redirect happens.
  return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Redirecting...</div>;
}
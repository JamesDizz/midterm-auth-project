// --- CLIENT COMPONENT DIRECTIVE ---
'use client'

// --- IMPORTS ---
import { useState, useEffect } from 'react';      // React hooks for state and side effects.
import { useSession } from 'next-auth/react';     // The primary NextAuth hook to access session data.
import { useRouter } from 'next/navigation';      // Hook for programmatic navigation.

/**
 * Onboarding Component
 * This page is shown to new users after their first login. It requires them to
 * provide additional profile information (like a name and username) before they can
 * access the main application.
 */
export default function Onboarding() {
  // --- HOOKS & STATE MANAGEMENT ---

  // useSession hook provides session data, authentication status, and an update function.
  // - `session`: The object containing user data (e.g., email, accessToken, onboarded status).
  // - `status`: A string indicating the auth state: "loading", "authenticated", or "unauthenticated".
  // - `update`: A function to update the client-side session without needing a re-login.
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  // State for the form inputs.
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  
  // State for managing UI feedback.
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // --- SIDE EFFECTS ---

  /**
   * This useEffect hook runs when the component mounts or the session status changes.
   * Its purpose is to pre-fill the "Full Name" field if the user signed in with Google,
   * as Google provides the user's name in the session data.
   */
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.name) {
      setName(session.user.name);
    }
  }, [status, session]); // Dependency array: this effect re-runs if status or session changes.

  // --- FORM SUBMISSION HANDLER ---

  /**
   * Handles the submission of the onboarding form.
   * @param {Event} e - The form submission event.
   */
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault(); // Prevent the browser's default form submission.
    setLoading(true);   // Start loading state.
    setMessage({ text: '', type: '' }); // Clear previous messages.

    // Safety check: if the session is somehow lost, prevent the API call.
    if (!session) {
      setMessage({ text: 'Authentication error. Please log in again.', type: 'error' });
      setLoading(false);
      return;
    }

    // Retrieve the JWT from the session to authorize the request to our backend.
    const token = session.accessToken;

    try {
      // --- API CALL ---
      // Send a PUT request to our backend API to update the user's profile.
      const response = await fetch('http://localhost:5000/api/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include the JWT for authentication.
        },
        body: JSON.stringify({ name, username }), // Send the new name and username.
      });

      const data = await response.json();

      if (response.ok) {
        // --- HANDLE SUCCESS ---
        setMessage({ text: 'Onboarding successful! Redirecting...', type: 'success' });
        
        // Update the client-side session with the new user data.
        // This sets `onboarded` to 1 in the browser's session, so the user won't be
        // redirected back to this page on their next visit to `/profile`.
        await update({ ...session, user: { ...session.user, name, username, onboarded: 1 } });
        
        // Redirect to the profile page after a short delay for a smoother user experience.
        setTimeout(() => {
          router.push('/profile');
        }, 1500);

      } else {
        // If the backend returns an error (e.g., username taken), display it.
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      // Handle network or other unexpected errors.
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      // This will run after the try/catch block, regardless of the outcome.
      setLoading(false); // Stop the loading state.
    }
  };

  // --- RENDER GUARDS ---
  // These checks prevent the main component from rendering until the session is ready.

  // Guard 1: While the session is being fetched, show a generic loading message.
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading session...
      </div>
    );
  }
  
  // Guard 2: If the user is not authenticated, redirect them to the login page.
  if (status === "unauthenticated") {
    router.push('/login');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Redirecting to login...
      </div>
    );
  }

  // --- JSX RENDER ---
  // This part only renders if the status is "authenticated".
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 max-w-sm w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Complete Your Profile</h1>
        <p className="text-gray-400 mb-6 text-center">
          Please provide a few more details to get started.
        </p>

        {/* --- DYNAMIC MESSAGE DISPLAY --- */}
        {message.text && (
          <div className={`p-3 rounded-lg text-center mb-4 text-white ${message.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
            {message.text}
          </div>
        )}

        {/* --- ONBOARDING FORM --- */}
        <form onSubmit={handleOnboardingSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-md"
            disabled={loading} // Button is disabled during form submission.
          >
            {loading ? "Saving..." : "Complete Setup"} {/* Text changes to provide feedback. */}
          </button>
        </form>
      </div>
    </div>
  );
}
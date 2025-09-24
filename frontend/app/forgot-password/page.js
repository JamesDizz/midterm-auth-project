'use client'

// Import necessary hooks from React and Next.js for state management and navigation.
import { useState } from 'react';
import Link from 'next/link';

/**
 * ForgotPassword Component
 * This page provides a form for users to enter their email address
 * to request a password reset link.
 */
export default function ForgotPassword() {
  // --- STATE MANAGEMENT ---

  // State to hold the user's email input.
  const [email, setEmail] = useState('');

  // State to manage the loading status, used to disable the button during submission.
  const [loading, setLoading] = useState(false);

  // State to hold and display feedback messages (e.g., success or error).
  // It's an object to handle both the message text and its type (for styling).
  const [message, setMessage] = useState({ text: '', type: '' });

  // --- FORM SUBMISSION HANDLER ---

  /**
   * Handles the form submission when the user requests a reset link.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    // Prevent the default browser behavior of a full-page reload on form submission.
    e.preventDefault();

    // Set loading to true to disable the button and show a loading state.
    setLoading(true);

    // Clear any previous messages.
    setMessage({ text: '', type: '' });

    try {
      // --- API CALL ---
      // Send a POST request to the backend's /api/forgot-password endpoint.
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Convert the email state into a JSON string to send in the request body.
        body: JSON.stringify({ email }),
      });

      // Parse the JSON response from the server.
      const data = await response.json();

      // Check if the API call was successful (e.g., status 200 OK).
      if (response.ok) {
        // If successful, display the success message from the server.
        setMessage({ text: data.message, type: 'success' });
      } else {
        // If not successful, display the error message from the server.
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (error) {
      // Catch any network errors (e.g., backend server is down).
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    } finally {
      // This block runs regardless of whether the try/catch succeeded or failed.
      // Set loading back to false to re-enable the button.
      setLoading(false);
    }
  };

  // --- JSX RENDER ---
  return (
    // Main container to center the form on the page with a dark background.
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      {/* The styled form "card" container. */}
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 max-w-sm w-full">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Forgot Password</h1>
        <p className="text-gray-400 mb-6 text-center">
          Enter your email to receive a reset link.
        </p>

        {/* --- DYNAMIC MESSAGE DISPLAY --- */}
        {/* Conditionally render the message box only if there is a message to display. */}
        {message.text && (
          // Dynamically sets the background color based on the message type ('success' or 'error').
          <div className={`p-3 rounded-lg text-center mb-4 text-white ${message.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
            {message.text}
          </div>
        )}

        {/* --- FORM ELEMENT --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            // The button is disabled while the form is submitting.
            disabled={loading}
          >
            {/* The button text changes to provide feedback during the loading state. */}
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* --- NAVIGATION LINK --- */}
        <p className="text-center text-gray-400 mt-6">
          Remember your password?{' '}
          {/* Provides an easy way for the user to navigate back to the login page. */}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
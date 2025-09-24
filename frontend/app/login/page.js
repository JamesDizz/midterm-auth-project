// --- CLIENT COMPONENT DIRECTIVE ---
// This line marks the component as a Client Component, allowing it to use hooks like useState and useRouter.
"use client";

// --- IMPORTS ---
// Import necessary hooks and components from React and Next.js.
import { useState } from "react"; // For managing component state (e.g., form inputs, loading status).
import { useRouter } from "next/navigation"; // For programmatic navigation (e.g., redirecting after login).
import { signIn } from "next-auth/react"; // The core function from NextAuth to handle sign-in attempts.
import Link from "next/link"; // For client-side navigation between pages without a full-page reload.

/**
 * LoginPage Component
 * Renders a login form that allows users to sign in using their email/password
 * or via a Google OAuth provider.
 */
export default function LoginPage() {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Holds any login error messages to display to the user.
  const [loading, setLoading] = useState(false); // Manages the loading state for the submit button.
  const [showPassword, setShowPassword] = useState(false); // Toggles the visibility of the password field.
  const router = useRouter(); // Hook to get access to the router instance.

  // --- FORM SUBMISSION HANDLER (EMAIL & PASSWORD) ---
  /**
   * Handles the form submission for the credentials (email/password) login.
   * @param {Event} e - The form submission event.
   */
  const handleEmailPasswordSignIn = async (e) => {
    // Prevent the default form submission behavior which causes a page refresh.
    e.preventDefault();
    setError(""); // Clear any previous errors.
    setLoading(true); // Set loading to true to disable the button.

    // --- NEXTAUTH SIGN-IN ---
    // Use the signIn function from NextAuth to attempt a login with the "credentials" provider.
    const result = await signIn("credentials", {
      // 'redirect: false' is crucial. It tells NextAuth to not automatically redirect.
      // Instead, it returns a result object, allowing us to handle success or error manually.
      redirect: false,
      email,
      password,
    });

    // --- HANDLE LOGIN RESULT ---
    if (result.error) {
      // If the result object has an error, it means login failed.
      setError("Invalid email or password."); // Set a generic error message for security.
      setLoading(false); // Re-enable the button.
    } else {
      // If there is no error, login was successful.
      // Manually redirect the user to their profile page.
      router.push("/profile");
    }
  };

  // --- JSX RENDER ---
  return (
    // Main container to center the form on the page with a dark background.
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      {/* The styled form "card" container. */}
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 max-w-sm w-full">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">Login</h1>
        
        {/* --- DYNAMIC ERROR DISPLAY --- */}
        {/* Conditionally render this block only if the 'error' state is not empty. */}
        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg text-center mb-4">
            {error}
          </div>
        )}

        {/* --- LOGIN FORM --- */}
        <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
          <div>
            <label className="block text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* --- PASSWORD FIELD WITH VISIBILITY TOGGLE --- */}
          <div>
            <label className="block text-gray-300">Password</label>
            <div className="relative"> {/* Parent div needs to be relative for the button's absolute positioning. */}
              <input
                type={showPassword ? 'text' : 'password'} // Dynamically change the input type.
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {/* This button toggles the 'showPassword' state on click. */}
              <button
                type="button" // Important: 'type="button"' prevents it from submitting the form.
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          
          {/* --- FORGOT PASSWORD LINK --- */}
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-indigo-400 hover:underline">
              Forgot Password?
            </Link>
          </div>
          
          {/* --- SUBMIT BUTTONS --- */}
          <button
            type="submit"
            disabled={loading} // Button is disabled during the API call.
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-md disabled:bg-indigo-400"
          >
            {loading ? 'Signing In...' : 'Sign In'} {/* Text changes to give user feedback. */}
          </button>

          {/* --- GOOGLE SIGN-IN BUTTON --- */}
          <button
            type="button"
            // On click, call NextAuth's signIn function, specifying the "google" provider.
            // 'callbackUrl' tells NextAuth where to redirect the user after a successful Google login.
            onClick={() => signIn('google', { callbackUrl: "/profile" })}
            className="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-red-700 transition duration-300 shadow-md"
          >
            Sign In with Google
          </button>
        </form>

        {/* --- LINK TO REGISTER PAGE --- */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Don’t have an account?{" "}
            <Link href="/register" className="text-indigo-500 hover:underline">
              Register here.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
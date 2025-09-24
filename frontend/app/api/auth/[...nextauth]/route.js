import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const res = await fetch('http://localhost:5000/api/login', {
                        method: 'POST',
                        body: JSON.stringify(credentials),
                        headers: { "Content-Type": "application/json" }
                    });
                    const responseData = await res.json();
                    if (res.ok && responseData.user) {
                        return { ...responseData.user, accessToken: responseData.token };
                    }
                } catch (error) {
                    console.error("Authorize Error:", error);
                }
                return null;
            }
        })
    ],

    //  CALLBACKS OBJECT
    callbacks: {
        /**
         * This JWT callback is the single source of truth for the user's session token.
         * It is the only place we need to interact with our custom backend.
         */
        async jwt({ token, user, account, trigger, session }) {
            // This block runs only ONCE per login, when the `user` object is first available.
            if (user && account) {
                let userFromBackend;
                let backendToken;

                if (account.provider === 'google') {
                    // For Google sign-in, we must fetch the user from our backend to get their real status.
                    try {
                        const res = await fetch('http://localhost:5000/api/auth/google', {
                            method: 'POST',
                            headers: { 'Content-Type': "application/json" },
                            body: JSON.stringify({ email: user.email, name: user.name, image: user.image }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error("Backend call failed");
                        userFromBackend = data.user;
                        backendToken = data.token;
                    } catch (error) {
                        console.error("JWT GOOGLE SYNC ERROR:", error);
                        return { ...token, error: "BackendError" }; // Mark the token as invalid
                    }
                } else {
                    // For credentials sign-in, the `user` object is already from our backend.
                    userFromBackend = user;
                    backendToken = user.accessToken;
                }
                
                // Now, safely populate the token with the data from our database.
                token.id = userFromBackend.id;
                token.name = userFromBackend.name;
                token.username = userFromBackend.username;
                token.onboarded = userFromBackend.onboarded; // This will be 0 or 1
                token.accessToken = backendToken;
            }

            // This block runs when the session is updated on the client (e.g., after onboarding).
            if (trigger === "update" && session) {
                token.name = session.user.name;
                token.username = session.user.username;
                token.onboarded = 1; // Mark as onboarded
            }

            return token;
        },

        /**
         * The session callback transfers data from the token to the client-side session object.
         */
        async session({ session, token }) {
            // If an error occurred in the JWT callback, invalidate the session.
            if (token.error) {
                return null;
            }

            // Transfer the data from our token to the session, making it available on the client.
            session.user = {
                id: token.id,
                name: token.name,
                email: token.email,
                username: token.username,
                // CRITICAL: Convert the numeric status (0/1) to a true boolean for the client.
                onboarded: token.onboarded === 1,
            };
            session.accessToken = token.accessToken;

            return session;
        }
    },


    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: '/login' },
});

export { handler as GET, handler as POST };
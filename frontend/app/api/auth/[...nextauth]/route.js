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
            async authorize(credentials, req) {
                const res = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    body: JSON.stringify(credentials),
                    headers: { "Content-Type": "application/json" }
                });
                const responseData = await res.json();
                if (res.ok && responseData.user && responseData.token) {
                    const userWithToken = {
                        ...responseData.user,
                        accessToken: responseData.token
                    };
                    return userWithToken;
                } else {
                    return null;
                }
            }
        })
    ],
    //  'callbacks' OBJECT 
    callbacks: {
        // JWT FUNCTION 
        async jwt({ token, user, trigger, session }) {
            // On initial sign-in, the `user` object is available
            if (user) {
                token.id = user.id;
                token.accessToken = user.accessToken;
                token.name = user.name;
                token.email = user.email;
                token.username = user.username;
                token.onboarded = user.onboarded;
            }

            // When the session is updated on the client, this trigger is called
            if (trigger === "update" && session) {
                // `session` contains the data passed to the `update` function
                token.name = session.user.name;
                token.username = session.user.username;
                token.onboarded = session.user.onboarded;
            }

            return token;
        },

        // Your 'session' function is already correct, leave it as is.
        async session({ session, token }) {
            if (token) {
                if (!session.user) {
                    session.user = {};
                }
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.username = token.username;
                session.user.onboarded = token.onboarded;
                session.accessToken = token.accessToken;
            }
            return session;
        }
    },
    // ▲▲▲ END OF REPLACEMENT ▲▲▲
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    pages: { signIn: '/login' },
});

export { handler as GET, handler as POST };
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import { User } from "./models";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        await connectToDatabase();
        const user = await User.findOne({ username: credentials.username });
        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        console.log(
          `[AUTH LOGIN] ${user.username} storeIds=${JSON.stringify(user.storeIds)}`,
        );

        return {
          id: user._id.toString(),
          name: user.username,
          role: user.role,
          storeIds: user.storeIds,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.storeIds = (user as any).storeIds;
        token.username = (user as any).name;
      }
      // Refresh storeIds from DB so admin changes take effect immediately
      if (token.username && token.role !== "admin") {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne(
            { username: token.username },
            { storeIds: 1 },
          ).lean();
          if (dbUser) {
            token.storeIds = (dbUser as any).storeIds;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).storeIds = token.storeIds;
      }
      return session;
    },
  },
};

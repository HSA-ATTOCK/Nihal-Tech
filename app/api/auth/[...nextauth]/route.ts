import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials!.email },
        });
        if (!user || !user.verified) throw new Error("Invalid");
        const valid = await bcrypt.compare(
          credentials!.password,
          user.password,
        );
        if (!valid) throw new Error("Invalid");
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const typedUser = user as
        | {
            id?: string;
            role?: string;
            name?: string | null;
            email?: string | null;
          }
        | undefined;

      if (typedUser) {
        (token as JWT & { id?: string; role?: string }).id = typedUser.id;
        (token as JWT & { id?: string; role?: string }).role = typedUser.role;
        token.name = typedUser.name ?? undefined;
        token.email = typedUser.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as {
          id?: string;
          role?: string;
          name?: string | null;
          email?: string | null;
        };

        sessionUser.id = (token as JWT & { id?: string }).id;
        sessionUser.role = (token as JWT & { role?: string }).role;
        sessionUser.name = token.name ?? null;
        sessionUser.email = token.email ?? null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

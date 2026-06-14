import { getServerSession, type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { LOGIN_RATE_LIMIT_ERROR } from "./auth-errors";
import {
  getClientIpFromHeaders,
  isLoginRateLimited,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from "./login-rate-limit";
import { normalizeUserRole } from "./feature-access-rules";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const clientKey = getClientIpFromHeaders(req.headers);

        if (isLoginRateLimited(clientKey)) {
          throw new Error(LOGIN_RATE_LIMIT_ERROR);
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          recordFailedLoginAttempt(clientKey);
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          recordFailedLoginAttempt(clientKey);
          throw new Error("Invalid credentials");
        }

        resetLoginAttempts(clientKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: normalizeUserRole(user.role),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (user?.role) {
        token.role = normalizeUserRole(user.role);
      } else if (token.sub) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = normalizeUserRole(currentUser?.role);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = normalizeUserRole(token.role);
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

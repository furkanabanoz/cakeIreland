import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientAddress,
} from "@/lib/rate-limit";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  trustHost: true,

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials, request) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const email = String(credentials.email)
          .toLowerCase()
          .trim();

        const password = String(credentials.password);

        if (
          email.length > 254 ||
          password.length > 128
        ) {
          return null;
        }

        const limit = await checkRateLimit({
          key: `login:${getClientAddress(request)}:${email}`,
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });

        if (!limit.allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          return null;
        }

        if (!user.passwordHash) {
          return null;
        }

        const passwordMatches =
          await bcrypt.compare(
            password,
            user.passwordHash
          );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(
          token.userId
        );

        session.user.role =
          token.role as
            | "CUSTOMER"
            | "ADMIN"
            | "STAFF";
      }

      return session;
    },
  },
});

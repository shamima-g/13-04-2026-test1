import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';

import { DEFAULT_ROLE, UserRole } from '@/types/roles';

import type { NextAuthConfig } from 'next-auth';

/**
 * Authentication Configuration
 *
 * DEVELOPMENT MODE:
 * Demo users are available for testing. See credentials below.
 *
 * PRODUCTION MODE:
 * Demo users are DISABLED. You MUST implement a real authentication provider.
 *
 * Demo credentials (DEVELOPMENT ONLY):
 * | Email                 | Password    | Role          |
 * |-----------------------|-------------|---------------|
 * | admin@example.com     | Admin123!   | admin         |
 * | user@example.com      | User123!    | team-member   |
 *
 * FRS roles: admin (manager) and team-member (standard employee).
 * No other roles exist in this system.
 */

// NEXTAUTH_SECRET validation
if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '🚨 SECURITY ERROR: NEXTAUTH_SECRET is not set!\n\n' +
        'You MUST set NEXTAUTH_SECRET environment variable in production.\n' +
        'Generate one with: openssl rand -base64 32',
    );
  } else {
    console.warn(
      '⚠️ WARNING: NEXTAUTH_SECRET is not set. Using a default for development only.',
    );
  }
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXTAUTH_SECRET &&
  process.env.NEXTAUTH_SECRET.length < 32
) {
  throw new Error(
    '🚨 SECURITY ERROR: NEXTAUTH_SECRET is too short!\n\n' +
      'NEXTAUTH_SECRET must be at least 32 characters in production.\n' +
      'Generate one with: openssl rand -base64 32',
  );
}

/**
 * Demo users - ONLY available in development mode.
 * Exactly two demo accounts corresponding to the two FRS roles.
 * Old template accounts (power@example.com, readonly@example.com) have been removed.
 */
const demoUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    password: '$2b$10$KeIrQDTJvrTbGsnJhVCNA.AUDy1wuVINdO1ZfVSo31ptnAfPMfbO2', // Admin123!
    role: UserRole.ADMIN,
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Team Member',
    password: '$2b$10$DG4whrMZU7fQm/oIMRom2u8BuyglJ0ZLWKDHN2p.jaAaxvub96E5m', // User123!
    role: UserRole.TEAM_MEMBER,
  },
];

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
      } | null> {
        // Demo users are ONLY available in development mode
        if (process.env.NODE_ENV === 'production') {
          console.error(
            '🚨 Demo credentials are disabled in production. ' +
              'Please configure a real authentication provider.',
          );
          return null;
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email (development only)
        const user = demoUsers.find((u) => u.email === credentials.email);

        if (!user) {
          return null;
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!passwordMatch) {
          return null;
        }

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || DEFAULT_ROLE,
        };
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role || DEFAULT_ROLE;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as UserRole) || DEFAULT_ROLE;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // After sign-in, the redirect is handled by the home page (/) which reads
      // the session role and redirects to the appropriate landing page.
      // This callback just ensures we stay on the same origin.
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.callback-url'
          : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token'
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

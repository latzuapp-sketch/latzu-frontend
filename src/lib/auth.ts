// NextAuth.js configuration for Latzu Platform

import type { JWT } from 'next-auth/jwt';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { ProfileType } from '@/types/user';

// Extend the default session and JWT types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      profileType?: ProfileType;
      tenantId: string;
      role: 'user' | 'admin' | 'moderator';
      needsOnboarding: boolean;
    };
    accessToken?: string;
    /** Signed JWT issued by the Latzu backend — sent as Bearer token to both GraphQL services */
    backendToken?: string;
    /** Set to true when the Google token has calendar scope */
    hasCalendarScope?: boolean;
    /** Set when token refresh fails — user must re-authenticate */
    error?: 'RefreshAccessTokenError';
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    profileType?: ProfileType;
    tenantId?: string;
    role?: 'user' | 'admin' | 'moderator';
    needsOnboarding?: boolean;
    /** Backend JWT returned by /api/auth/login and /api/auth/sync */
    backendToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    profileType?: ProfileType;
    tenantId: string;
    role: 'user' | 'admin' | 'moderator';
    needsOnboarding: boolean;
    /** Latzu backend JWT for authenticating GraphQL requests */
    backendToken?: string;
    accessToken?: string;
    refreshToken?: string;
    /** Unix timestamp (ms) when accessToken expires */
    accessTokenExpires?: number;
    /** Whether this token includes Google Calendar scope */
    hasCalendarScope?: boolean;
    error?: 'RefreshAccessTokenError';
  }
}

const API_URL = 'https://latzu-api-610441107033.us-central1.run.app';

// ─── Google token refresh ─────────────────────────────────────────────────────

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = 'https://oauth2.googleapis.com/token';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken ?? '',
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (err) {
    console.error('Failed to refresh Google access token:', err);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

// ─── Backend helpers ──────────────────────────────────────────────────────────

async function syncUserToBackend(
  user: { id: string; email: string; name: string; image?: string },
  account: { access_token?: string; refresh_token?: string } | null,
  provider: string = 'google'
): Promise<{
  profileType?: ProfileType;
  tenantId: string;
  role: 'user' | 'admin' | 'moderator';
  needsOnboarding: boolean;
  backendToken?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        google_id: provider === 'google' ? user.id : undefined,
        email: user.email,
        name: user.name,
        picture: user.image,
        access_token: account?.access_token,
        refresh_token: account?.refresh_token,
        provider: provider,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        profileType: data.profile_type,
        tenantId: data.tenant_id || 'default',
        role: data.role || 'user',
        needsOnboarding: !data.profile_type,
        backendToken: data.backend_token,
      };
    }
  } catch (error) {
    console.error('Failed to sync user to backend:', error);
  }

  return { tenantId: 'default', role: 'user', needsOnboarding: true };
}

async function authenticateUser(
  email: string,
  password: string
): Promise<{
  id: string;
  email: string;
  name: string;
  profileType?: ProfileType;
  tenantId: string;
  role: 'user' | 'admin' | 'moderator';
  needsOnboarding: boolean;
  backendToken?: string;
} | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        id: data.user_id,
        email: data.email,
        name: data.name,
        profileType: data.profile_type,
        tenantId: data.tenant_id || 'default',
        role: data.role || 'user',
        needsOnboarding: !data.profile_type,
        backendToken: data.backend_token,
      };
    }
  } catch (error) {
    console.error('Failed to authenticate user:', error);
  }
  return null;
}

async function fetchUserProfileType(userId: string): Promise<ProfileType | undefined> {
  try {
    const response = await fetch(`${API_URL}/api/users/${userId}/profile-type`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      return data.profile_type;
    }
  } catch (error) {
    console.error('Failed to fetch user profile type:', error);
  }
  return undefined;
}

async function refreshBackendSession(token: JWT): Promise<Partial<JWT>> {
  if (!token.email) return {};

  const backendData = await syncUserToBackend(
    {
      id: token.userId || token.sub || token.email,
      email: token.email,
      name: token.name || token.email,
      image: token.picture ?? undefined,
    },
    null,
    'next-auth'
  );

  return {
    profileType: backendData.profileType,
    tenantId: backendData.tenantId,
    role: backendData.role,
    needsOnboarding: backendData.needsOnboarding,
    backendToken: backendData.backendToken,
  };
}

// ─── Providers ────────────────────────────────────────────────────────────────

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar',
].join(' ');

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
            scope: GOOGLE_SCOPES,
          },
        },
      })
    : null;

// ─── Auth options ─────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }
        const user = await authenticateUser(credentials.email, credentials.password);
        if (!user) throw new Error('Email o contraseña incorrectos');
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          profileType: user.profileType,
          tenantId: user.tenantId,
          role: user.role,
          needsOnboarding: user.needsOnboarding,
          backendToken: user.backendToken,
        };
      },
    }),
    ...(googleProvider ? [googleProvider] : []),
  ],

  pages: {
    signIn: '/login',
    newUser: '/onboarding',
    error: '/login',
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;

      if (account?.provider === 'google') {
        const backendData = await syncUserToBackend(
          { id: user.id, email: user.email!, name: user.name!, image: user.image ?? undefined },
          account,
          'google'
        );
        user.profileType = backendData.profileType;
        user.tenantId = backendData.tenantId;
        user.role = backendData.role;
        user.needsOnboarding = backendData.needsOnboarding;
        user.backendToken = backendData.backendToken;
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // ── Initial sign-in ────────────────────────────────────────────────────
      if (user && account) {
        token.userId = user.id;
        token.profileType = user.profileType;
        token.tenantId = user.tenantId || 'default';
        token.role = user.role || 'user';
        token.needsOnboarding = user.needsOnboarding ?? true;
        token.backendToken = user.backendToken;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
        // Detect if calendar scope was granted
        token.hasCalendarScope =
          account.provider === 'google' &&
          typeof account.scope === 'string' &&
          account.scope.includes('calendar');
        return token;
      }

      // ── Refresh profile type if missing ────────────────────────────────────
      if (!token.profileType && token.userId) {
        token.profileType = await fetchUserProfileType(token.userId);
        if (token.profileType) token.needsOnboarding = false;
      }

      // ── Recover backend JWT for older sessions that predate backendToken ────
      if (!token.backendToken) {
        const backendSession = await refreshBackendSession(token);
        token = { ...token, ...backendSession };
      }

      // ── Return token if still valid ────────────────────────────────────────
      if (
        !token.accessTokenExpires ||
        Date.now() < token.accessTokenExpires - 60_000 // 1 min buffer
      ) {
        return token;
      }

      // ── Refresh expired access token ───────────────────────────────────────
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.profileType = token.profileType;
      session.user.tenantId = token.tenantId;
      session.user.role = token.role;
      session.user.needsOnboarding = token.needsOnboarding;
      session.backendToken = token.backendToken;
      session.accessToken = token.accessToken;
      session.hasCalendarScope = token.hasCalendarScope;
      session.error = token.error;
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        const path = url.replace(baseUrl, '');
        if (!path || path === '/') return baseUrl;
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

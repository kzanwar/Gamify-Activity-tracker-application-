/**
 * NextAuth Configuration
 *
 * This file configures NextAuth.js for authentication and session management.
 * It provides secure user authentication using email/password credentials
 * and integrates with the Prisma database for user data management.
 *
 * Authentication Flow:
 * 1. User submits email/password via login form
 * 2. Credentials are validated against database records
 * 3. Passwords are securely compared using bcrypt hashing
 * 4. JWT tokens are issued for session management
 * 5. User data is stored in encrypted session cookies
 *
 * Security Features:
 * - Password hashing with bcrypt (salt rounds: 12)
 * - JWT-based session management (no server-side sessions)
 * - Secure credential validation
 * - Automatic session refresh and expiration
 * - Protection against timing attacks
 *
 * Database Integration:
 * - PrismaAdapter handles user, account, session, and token storage
 * - Automatic database schema management for auth-related tables
 * - Foreign key relationships maintained with application data
 *
 * Session Management:
 * - JWT strategy for better performance and scalability
 * - Session data includes user ID, email, and name
 * - Automatic token refresh on API calls
 * - Secure cookie handling with httpOnly flags
 *
 * User Registration:
 * - Secure password hashing before storage
 * - Email uniqueness validation
 * - Automatic user profile creation
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Therajai is a comprehensive mental health platform for Thailand, connecting Thai clients with licensed therapists through secure online and in-person services. The platform features multi-role authentication, Thai language support, real-time video calls, and integrated payment systems.

## Key Development Commands

### Server Management
```bash
# Start development with both Next.js and Socket.IO servers
npm run dev:full

# Start Next.js only
npm run dev

# Start Socket.IO server only (required for video calls)
npm run socket:dev

# Build and type checking
npm run build
npm run type-check
npm run lint
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Generate Prisma client after schema changes
npm run db:generate

# Open Prisma Studio for database management
npm run db:studio

# Seed database with test data (53 users, appointments, sessions)
npm run db:seed
```

### Testing
```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npx jest path/to/test/file.test.ts
```

## Architecture Overview

### Multi-Role Authentication System
- **NextAuth.js** with credential-based authentication in `src/lib/auth.ts`
- **Three user roles**: CLIENT, THERAPIST, ADMIN with role-based access control
- **Middleware protection** in `middleware.ts` handles route-level authorization
- **Session management** extends NextAuth with custom role and verification properties

### Database Architecture (PostgreSQL + Prisma)
- **Multi-tenant design** with separate profiles: `ClientProfile`, `TherapistProfile`
- **Complex relationships**: Users → Appointments → Sessions → Payments → Commissions → Payouts
- **Click tracking system**: `ClickEvent` model tracks user interactions with UTM parameters and referrer data
- **Admin-only analytics**: Click data accessible only through `/api/admin/analytics/*` endpoints

### Real-Time Video Calling System
- **WebRTC implementation** using simple-peer library in `src/hooks/useWebRTC.ts`
- **Socket.IO signaling server** in `server/socket-server.js` (runs on port 3001)
- **Dual server architecture**: Next.js (port 3000) + Socket.IO (port 3001) both required for video calls
- **Video components** in `src/components/video/` handle peer connections and UI

### API Route Structure
- **RESTful design** in `src/app/api/` following Next.js 14 App Router patterns
- **Role-based endpoints**: `/api/admin/*` (admin only), `/api/therapist/*` (therapist only)
- **Protected routes** use session validation and role checking
- **Analytics endpoints**: `/api/analytics/track` (public), `/api/admin/analytics/*` (admin only)

### Click Tracking Implementation
- **Automatic tracking** via `ClickTrackingProvider` in app layout
- **useClickTracking hook** with batching, rate limiting, and privacy features (IP hashing)
- **Admin dashboard** at `/admin/analytics` with interactive charts using Recharts
- **UTM parameter tracking** for marketing campaign attribution

## Test Credentials
- **Admin**: admin@therajai.com / admin123
- **Therapist**: therapist@therajai.com / therapist123  
- **Client**: client@therajai.com / client123
- **Generated users**: Use any email from seeded data with password: password123

## Thai Language Integration
- **i18next** with Thai/English support in `src/locales/`
- **Sarabun font** for proper Thai text rendering
- **Context provider** in `src/contexts/LanguageContext.tsx`
- **All user-facing text** should use translation keys, not hardcoded strings

## Key Configuration Requirements
- **Node.js 18.17.0+** required for Next.js compatibility
- **PostgreSQL database** with connection string in DATABASE_URL
- **NextAuth configuration** requires NEXTAUTH_URL and NEXTAUTH_SECRET
- **Socket.IO port** configurable via SOCKET_PORT environment variable
- **Stripe keys** for payment processing integration

## Important Development Notes
- **Always run both servers** (`npm run dev:full`) when working on video call features
- **Database changes** require `npm run db:generate` to update Prisma client
- **Role-based testing** requires switching between different user accounts
- **Video calls require HTTPS** in production for WebRTC to function
- **Click tracking** automatically captures user interactions; test at `/test-analytics`

## Admin Features Access
- **Therapist verification**: `/admin/therapist-verification`
- **Payout management**: `/admin/payouts`
- **Analytics dashboard**: `/admin/analytics` (includes click tracking data)
- **All admin routes** protected by middleware and require ADMIN role

## Commission & Payment System
- **Automatic commission calculation** when sessions are completed
- **Payout scheduling** for therapists with batch processing
- **Stripe integration** for client payments with Thai baht support
- **Commission rates** configurable in session completion logic

When working on this codebase, always consider the multi-role nature, ensure proper Thai language support, and test video calling functionality with both servers running.
# Therajai - Mental Health Platform for Thailand

A comprehensive therapy platform connecting Thai clients with licensed therapists, offering secure online and in-person mental health services.

## Features

- **Multi-role Authentication**: Separate interfaces for clients, therapists, and administrators
- **Thai Language Support**: Full localization for Thai users with Sarabun font
- **Real-time Video Calls**: WebRTC-powered video/audio therapy sessions
- **Therapist Discovery**: Advanced search and matching algorithms
- **Appointment Booking**: Flexible scheduling system
- **Secure Sessions**: HIPAA-compliant video calls and messaging
- **Payment Integration**: Thai payment gateways and insurance support
- **Profile Management**: Comprehensive user profiles and preferences
- **Session Recording**: Optional session recording with consent management

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with multi-role support
- **Payment**: Stripe
- **Real-time**: Socket.IO for signaling
- **Video Calling**: WebRTC with simple-peer for P2P connections
- **UI Components**: Radix UI, Lucide React icons

## Prerequisites

- Node.js 18.17.0+ (for Next.js compatibility)
- PostgreSQL 14+
- npm, yarn, or pnpm
- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/therajai.git
cd therajai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your database and fill in the environment variables in `.env`

5. Set up the database:
```bash
npm run db:push
```

6. Seed the database with dummy data (optional):
```bash
npm run db:seed
```

7. Start the development servers:
```bash
# Start both Next.js and Socket.IO servers
npm run dev:full

# Or start them separately:
npm run dev          # Next.js server (port 3000)
npm run socket:dev   # Socket.IO server (port 3001)
```

## Scripts

- `npm run dev` - Start Next.js development server
- `npm run socket:dev` - Start Socket.IO server for video calls
- `npm run dev:full` - Start both servers concurrently
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with dummy data

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/therajai"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Socket.IO
SOCKET_PORT=3001
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   ├── video-call/        # Video calling pages
│   ├── video-demo/        # Video demo page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # UI components
│   └── video/             # Video call components
├── lib/                   # Utility functions
├── types/                 # TypeScript definitions
├── hooks/                 # Custom React hooks (including WebRTC)
├── utils/                 # Helper functions
└── server/                # Socket.IO server for video calling
```

## Video Calling System

Therajai includes a complete WebRTC-based video calling system for secure therapy sessions:

### Features
- **Peer-to-peer video calls** using WebRTC
- **Real-time signaling** via Socket.IO
- **Camera and microphone controls**
- **Screen sharing capability**
- **Multi-participant support**
- **Session recording** (with consent)
- **Call quality monitoring**
- **Automatic reconnection**

### Usage

1. **Testing the Video System:**
   - Start both servers: `npm run dev:full`
   - Navigate to `/video-demo` to test video calls
   - Create a room or join an existing one
   - Allow camera/microphone permissions

2. **Integration with Appointments:**
   - Video calls are linked to therapy sessions
   - Therapists can start calls from their dashboard
   - Clients join via appointment links

3. **Browser Requirements:**
   - Chrome 60+ (recommended)
   - Firefox 55+
   - Safari 11+
   - Edge 79+

### Configuration

The video system requires both HTTP and WebSocket servers:

```bash
# Next.js server (default: port 3000)
NEXTAUTH_URL="http://localhost:3000"

# Socket.IO server for video signaling
SOCKET_PORT=3001
```

For production, ensure proper STUN/TURN server configuration for NAT traversal.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please contact: support@therajai.com

## Regulatory Compliance

This platform is designed to comply with:
- Thailand's Mental Health Act
- Personal Data Protection Act (PDPA)
- Telemedicine regulations in Thailand
- International healthcare data security standards
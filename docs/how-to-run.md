# How to Run Therajai

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 18.17.0 (you currently have 18.14.0)
- PostgreSQL running
- npm or yarn package manager

### Option 1: Update Node.js (Recommended)

#### Update Node.js via Homebrew:
```bash
brew update
brew install node
```

#### Or use Node Version Manager (nvm):
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use latest Node.js
nvm install node
nvm use node
```

### Option 2: Run with Current Node.js (Workaround)

Since you're close to the required version, you can try bypassing the version check:

```bash
# Create a custom Next.js config to bypass version check
echo "module.exports = { skipTrailingSlashRedirect: true }" > next.config.override.js

# Or use --legacy-peer-deps flag
npm run dev --legacy-peer-deps
```

### Step-by-Step Running Instructions

1. **Ensure PostgreSQL is running**
   ```bash
   brew services list | grep postgres
   # Should show: postgresql@14 started
   ```

2. **Verify database connection**
   ```bash
   node scripts/verify.js
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to: http://localhost:3000
   - You should see the Therajai homepage

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checking

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database with test data

# Utilities
node scripts/verify.js           # Verify database setup
node scripts/show-sample-data.js # Show sample data
```

### Test Login Credentials

Once the app is running, you can test login with:

#### Admin User
- Email: admin@therajai.com
- Password: admin123

#### Client User
- Email: client@therajai.com
- Password: client123

#### Therapist User
- Email: therapist@therajai.com
- Password: therapist123

#### Generated Users
- Any email from the generated data
- Password: password123

### Available Routes

- `/` - Homepage
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - User dashboard (requires login)

### Troubleshooting

#### 1. Node.js Version Error
```
Error: You are using Node.js 18.14.0. For Next.js, Node.js version >= v18.17.0 is required.
```
**Solution**: Update Node.js to version 18.17.0 or higher

#### 2. Database Connection Error
```
Error: Can't reach database server
```
**Solution**: Make sure PostgreSQL is running
```bash
brew services start postgresql@14
```

#### 3. Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: Use a different port
```bash
npm run dev -- -p 3001
```

#### 4. Environment Variables Missing
```
Error: Environment variable not found
```
**Solution**: Make sure `.env` file exists with all required variables

### Development Workflow

1. **Make changes** to your code
2. **Hot reload** will automatically update the browser
3. **Check console** for any errors
4. **Use Prisma Studio** to view database changes:
   ```bash
   npm run db:studio
   ```

### Production Deployment

For production deployment:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start
   ```

3. **Environment variables**
   - Update `.env` with production values
   - Set up proper database connection
   - Configure authentication secrets

### Next Steps

Once running, you can:
- Test the authentication flow
- Explore the dashboard
- Check the database with DataGrip
- Start developing additional features

### Need Help?

If you encounter any issues:
1. Check the console for error messages
2. Verify all prerequisites are met
3. Ensure the database is running and accessible
4. Check that all environment variables are set correctly

The application should now be running at http://localhost:3000 with full authentication and database functionality!
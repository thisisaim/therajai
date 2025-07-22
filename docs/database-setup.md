# Database Setup Guide

## PostgreSQL Configuration

### Database Details
- **Database Name**: `therajai`
- **Username**: `therajai_user`
- **Password**: `therajai_password`
- **Host**: `localhost`
- **Port**: `5432`

### Connection String
```
DATABASE_URL="postgresql://therajai_user:therajai_password@localhost:5432/therajai"
```

## Database Schema

The database includes the following tables:

### Core Tables
1. **users** - Main user accounts (CLIENT, THERAPIST, ADMIN)
2. **client_profiles** - Client-specific information
3. **therapist_profiles** - Therapist credentials and details
4. **therapist_availability** - Therapist schedule slots
5. **appointments** - Booking records
6. **sessions** - Session details and feedback
7. **payments** - Payment transactions

### Key Features
- **Multi-role authentication** with role-based access control
- **Profile management** for different user types
- **Appointment scheduling** with availability tracking
- **Session management** with notes and ratings
- **Payment processing** with Stripe integration
- **Thai language support** with proper Unicode handling

## Seed Data

The database comes pre-populated with test accounts:

### Admin Account
- **Email**: admin@therajai.com
- **Password**: admin123
- **Role**: ADMIN
- **Status**: Verified

### Client Account
- **Email**: client@therajai.com
- **Password**: client123
- **Role**: CLIENT
- **Name**: สมชาย ใจดี
- **Status**: Verified

### Therapist Account
- **Email**: therapist@therajai.com
- **Password**: therapist123
- **Role**: THERAPIST
- **Name**: ดร.สมศรี ช่วยเหลือ
- **License**: PSY-2024-001
- **Rate**: 1500 THB/hour
- **Status**: Verified
- **Availability**: Monday-Friday, 9 AM - 5 PM

## Database Operations

### Common Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Seed database with test data
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Reset database (caution: deletes all data)
npx prisma db push --force-reset
```

### Direct PostgreSQL Access

```bash
# Connect to database
psql -d therajai -U therajai_user

# Common queries
\dt                           # List all tables
\d users                      # Describe users table
SELECT * FROM users;          # View all users
SELECT * FROM therapist_profiles; # View therapist profiles
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
2. **Database Permissions**: Limited user permissions (no superuser access)
3. **Connection Security**: Uses SSL in production environments
4. **Data Validation**: Comprehensive input validation with Zod schemas
5. **GDPR Compliance**: Supports data deletion and privacy controls

## Backup and Recovery

### Backup Database
```bash
pg_dump -U therajai_user -h localhost therajai > backup.sql
```

### Restore Database
```bash
psql -U therajai_user -h localhost therajai < backup.sql
```

## Performance Optimization

1. **Indexes**: Automatically created on foreign keys and unique constraints
2. **Query Optimization**: Uses Prisma's efficient query generation
3. **Connection Pooling**: Configured for production environments
4. **Caching**: Redis integration ready for session management

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check PostgreSQL service is running: `brew services list`
   - Verify connection string in `.env`

2. **Permission Denied**
   - Ensure user has proper database permissions
   - Check database ownership

3. **Schema Mismatch**
   - Run `npm run db:push` to sync schema
   - Use `npx prisma db push --force-reset` for major changes

### Verification Script
Run the verification script to test the setup:
```bash
node scripts/verify.js
```

This will test:
- Database connection
- User authentication
- Profile relationships
- Data integrity

## Production Deployment

For production deployment:

1. **Environment Variables**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

2. **SSL Configuration**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

3. **Connection Pooling**
   - Configure connection limits
   - Set up read replicas if needed
   - Monitor query performance

4. **Backup Strategy**
   - Automated daily backups
   - Point-in-time recovery
   - Cross-region replication
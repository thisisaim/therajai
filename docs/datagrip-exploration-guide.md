# DataGrip Exploration Guide for Therajai Database

## Database Connection Settings

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: therajai
- **Username**: therajai_user
- **Password**: therajai_password
- **SSL Mode**: Disable (for local development)

### Connection Steps in DataGrip
1. Open DataGrip
2. Click "+" → "Data Source" → "PostgreSQL"
3. Enter the connection details above
4. Click "Test Connection" to verify
5. Click "OK" to save

## Database Schema Overview

### Core Tables
- **users** - Main user accounts with roles (CLIENT, THERAPIST, ADMIN)
- **client_profiles** - Client personal information and preferences
- **therapist_profiles** - Therapist credentials, specializations, and rates
- **therapist_availability** - Therapist schedule and availability slots
- **appointments** - Booking records with status tracking
- **sessions** - Session details, notes, and ratings
- **payments** - Payment transactions and status

## Sample Data Overview

### Users (53 total)
- **3 Original Test Users**: admin@therajai.com, client@therajai.com, therapist@therajai.com
- **25 Additional Clients**: Thai names with realistic profiles
- **15 Additional Therapists**: Licensed professionals with varied specializations

### Test Credentials
- **Original users**: Use their original passwords (admin123, client123, therapist123)
- **Generated users**: All have password "password123"

## Interesting Queries for Exploration

### 1. Therapist Overview
```sql
SELECT 
  tp."firstName" || ' ' || tp."lastName" as therapist_name,
  tp.title,
  tp."licenseNumber",
  tp.specializations,
  tp."hourlyRate",
  tp.rating,
  tp."totalSessions",
  tp.verified,
  u.email
FROM therapist_profiles tp
JOIN users u ON tp."userId" = u.id
WHERE tp.verified = true
ORDER BY tp.rating DESC;
```

### 2. Client Demographics
```sql
SELECT 
  cp."firstName" || ' ' || cp."lastName" as client_name,
  cp.phone,
  cp."preferredLanguage",
  cp."insuranceProvider",
  EXTRACT(YEAR FROM AGE(cp."dateOfBirth")) as age,
  u.email,
  u.verified
FROM client_profiles cp
JOIN users u ON cp."userId" = u.id
ORDER BY cp."firstName";
```

### 3. Appointment Analytics
```sql
SELECT 
  a.status,
  a.type,
  COUNT(*) as appointment_count,
  AVG(a.duration) as avg_duration,
  MIN(a."dateTime") as earliest_appointment,
  MAX(a."dateTime") as latest_appointment
FROM appointments a
GROUP BY a.status, a.type
ORDER BY appointment_count DESC;
```

### 4. Session Feedback and Ratings
```sql
SELECT 
  s.rating,
  s."clientFeedback",
  s."sessionNotes",
  s."startTime",
  c.name as client_name,
  t.name as therapist_name,
  tp.specializations
FROM sessions s
JOIN users c ON s."clientId" = c.id
JOIN users t ON s."therapistId" = t.id
JOIN therapist_profiles tp ON t.id = tp."userId"
WHERE s.rating IS NOT NULL
ORDER BY s.rating DESC, s."startTime" DESC;
```

### 5. Payment Analysis
```sql
SELECT 
  p.status,
  p.currency,
  COUNT(*) as payment_count,
  SUM(p.amount) as total_amount,
  AVG(p.amount) as average_amount,
  MIN(p.amount) as min_amount,
  MAX(p.amount) as max_amount
FROM payments p
GROUP BY p.status, p.currency
ORDER BY total_amount DESC;
```

### 6. Therapist Availability Overview
```sql
SELECT 
  tp."title" || tp."firstName" || ' ' || tp."lastName" as therapist_name,
  CASE ta."dayOfWeek"
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_of_week,
  ta."startTime",
  ta."endTime",
  ta."isAvailable",
  tp."hourlyRate"
FROM therapist_availability ta
JOIN therapist_profiles tp ON ta."therapistId" = tp.id
ORDER BY tp."firstName", ta."dayOfWeek", ta."startTime";
```

### 7. Client-Therapist Matching
```sql
SELECT 
  c.name as client_name,
  t.name as therapist_name,
  tp.specializations,
  COUNT(a.id) as total_appointments,
  AVG(s.rating) as average_rating,
  SUM(p.amount) as total_spent
FROM appointments a
JOIN users c ON a."clientId" = c.id
JOIN users t ON a."therapistId" = t.id
JOIN therapist_profiles tp ON t.id = tp."userId"
LEFT JOIN sessions s ON a.id = s."appointmentId"
LEFT JOIN payments p ON a.id = p."appointmentId"
GROUP BY c.name, t.name, tp.specializations
HAVING COUNT(a.id) > 0
ORDER BY total_appointments DESC;
```

### 8. Revenue Analysis by Therapist
```sql
SELECT 
  t.name as therapist_name,
  tp.specializations,
  tp."hourlyRate",
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT s.id) as completed_sessions,
  SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END) as revenue,
  AVG(s.rating) as average_rating
FROM therapist_profiles tp
JOIN users t ON tp."userId" = t.id
LEFT JOIN appointments a ON t.id = a."therapistId"
LEFT JOIN sessions s ON a.id = s."appointmentId"
LEFT JOIN payments p ON a.id = p."appointmentId"
GROUP BY t.name, tp.specializations, tp."hourlyRate"
ORDER BY revenue DESC NULLS LAST;
```

### 9. Popular Specializations
```sql
SELECT 
  UNNEST(tp.specializations) as specialization,
  COUNT(*) as therapist_count,
  AVG(tp.rating) as avg_rating,
  AVG(tp."hourlyRate") as avg_rate
FROM therapist_profiles tp
GROUP BY specialization
ORDER BY therapist_count DESC;
```

### 10. Daily Activity Pattern
```sql
SELECT 
  EXTRACT(HOUR FROM a."dateTime") as hour_of_day,
  COUNT(*) as appointment_count,
  COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed_count,
  COUNT(CASE WHEN a.status = 'CANCELLED' THEN 1 END) as cancelled_count
FROM appointments a
GROUP BY hour_of_day
ORDER BY hour_of_day;
```

## Data Exploration Tips

### 1. Table Relationships
- Use the ER diagram feature in DataGrip to visualize relationships
- Pay attention to foreign key constraints
- Notice the cascade delete relationships

### 2. Thai Language Data
- The database contains Thai language text in names and feedback
- Use proper character encoding when exporting data
- Some specializations are in Thai language

### 3. Data Patterns
- Most therapists have 3-5 specializations
- Hourly rates range from 1000-2000 THB
- Session ratings are mostly 4-5 stars
- Payment amounts correlate with appointment duration and therapist rates

### 4. Performance Queries
- Use indexes on frequently queried columns
- Consider performance when joining multiple tables
- Use EXPLAIN ANALYZE for query optimization

## Sample Visualizations

### 1. Therapist Rating Distribution
```sql
SELECT 
  FLOOR(rating) as rating_range,
  COUNT(*) as therapist_count
FROM therapist_profiles
GROUP BY FLOOR(rating)
ORDER BY rating_range;
```

### 2. Monthly Appointment Trends
```sql
SELECT 
  DATE_TRUNC('month', "dateTime") as month,
  COUNT(*) as appointment_count,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count
FROM appointments
GROUP BY month
ORDER BY month;
```

### 3. Revenue by Payment Status
```sql
SELECT 
  status,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount,
  ROUND(AVG(amount), 2) as average_amount
FROM payments
GROUP BY status
ORDER BY total_amount DESC;
```

This comprehensive dataset provides a realistic view of a therapy platform with authentic Thai names, realistic appointment patterns, and meaningful relationships between entities. Perfect for exploring database queries and understanding the business logic!